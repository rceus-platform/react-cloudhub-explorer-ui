/**
 * useFiles Hook
 *
 * Responsibilities:
 * - Manage the data fetching lifecycle for folder contents
 * - Handle caching and synchronization via TanStack Query
 *
 * Boundaries:
 * - Does not handle navigation or individual file interactions
 */

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFiles } from "../services/fileService";
import type { FilesResponse } from "../types";
import { useSyncStatus } from "../../accounts/hooks/useSyncStatus";

/** Custom hook for retrieval of folder data with optimized caching */
export function useFiles(folderId: string) {
    const queryClient = useQueryClient();
    const { data: isSyncRunning } = useSyncStatus();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const normalizedFolderId = useMemo(() => {
        if (!folderId || folderId === "root") return "root";
        try {
            const parsed = JSON.parse(folderId);
            if (typeof parsed === "object" && parsed !== null) {
                // Sort keys alphabetically for consistent query key
                return JSON.stringify(Object.keys(parsed).sort().reduce((acc, key) => {
                    acc[key] = (parsed as Record<string, unknown>)[key];
                    return acc;
                }, {} as Record<string, unknown>));
            }
        } catch {
            // Not a JSON string, use as is
        }
        return folderId;
    }, [folderId]);

    const query = useQuery<FilesResponse>({
        queryKey: ["files", normalizedFolderId],
        queryFn: () => fetchFiles(normalizedFolderId),
        staleTime: 30 * 60 * 1000,
        // Keep in cache for 1 hour
        gcTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        // Use native refetchInterval for more robust adaptive polling
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data?.files) return false;

            const hasMissing = data.files.some(f =>
                f.type === "file" &&
                (!f.updated_at || f.is_generating) &&
                /\.(mp4|mkv|mov|avi|wmv|flv|webm|jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(f.name)
            );

            return (isSyncRunning || hasMissing) ? 3000 : false;
        }
    });

    /** Manual trigger to bypass all caches and force-refresh from cloud providers */
    const refresh = async () => {
        setIsRefreshing(true);
        try {
            // 1. Force refresh the current folder immediately
            const freshData = await fetchFiles(normalizedFolderId, true);
            queryClient.setQueryData(["files", normalizedFolderId], freshData);

            // 2. Trigger global background sync for all folders
            import("../../../services/apiClient").then(({ apiClient }) => {
                apiClient.post("/accounts/sync", {}).catch(err => console.error("Global sync failed:", err));
            });

            // 3. Start monitoring sync status to show feedback in UI
            import("../../accounts/utils/syncState").then(({ syncStateManager }) => {
                syncStateManager.startMonitoring();
            });
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    /** Full data refresh: rebuild folder sizes server-side, then reload current folder */
    const refreshData = async (): Promise<boolean> => {
        setIsRefreshing(true);
        try {
            const { apiClient } = await import("../../../services/apiClient");
            await apiClient.post<{ message: string }>("/accounts/recalculate-sizes", {});

            const freshData = await fetchFiles(normalizedFolderId, true);
            queryClient.setQueryData(["files", normalizedFolderId], freshData);
            return true;
        } catch (error) {
            console.error("Refresh data failed:", error);
            return false;
        } finally {
            setIsRefreshing(false);
        }
    };

    return { ...query, refresh, refreshData, isRefreshing };
}
