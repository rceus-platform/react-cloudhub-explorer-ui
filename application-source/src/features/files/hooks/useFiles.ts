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

import { useState, useMemo, useEffect } from "react";
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
    });

    // Detect if any media file in the current view is still missing a thumbnail
    const hasMissingThumbnails = useMemo(() => {
        if (!query.data?.files) return false;
        return query.data.files.some(f => 
            f.type === "file" && 
            !f.updated_at && 
            /\.(mp4|mkv|mov|avi|wmv|flv|webm|jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(f.name)
        );
    }, [query.data?.files]);

    // Update query with adaptive polling interval
    useEffect(() => {
        let pollCount = 0;
        const MAX_POLLS = 10;

        if (isSyncRunning || hasMissingThumbnails) {
            const interval = setInterval(() => {
                // Stop polling if we reached the limit or if the tab is not visible
                if (pollCount >= MAX_POLLS || document.hidden) {
                    if (pollCount >= MAX_POLLS) {
                        console.warn("[useFiles] Max polls reached for folder, stopping polling.");
                        clearInterval(interval);
                    }
                    return;
                }

                pollCount++;
                query.refetch();
            }, 10000); // 10 seconds
            return () => clearInterval(interval);
        }
    }, [isSyncRunning, hasMissingThumbnails, query.refetch]);

    /** Manual trigger to bypass all caches and force-refresh from cloud providers */
    const refresh = async () => {
        setIsRefreshing(true);
        try {
            const freshData = await fetchFiles(folderId, true);
            queryClient.setQueryData(["files", folderId], freshData);
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return { ...query, refresh, isRefreshing };
}
