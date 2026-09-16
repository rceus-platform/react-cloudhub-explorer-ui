/**
 * useFiles Hook
 *
 * Responsibilities:
 * - Manage the data fetching lifecycle for folder contents
 * - Handle caching and synchronization via TanStack Query
 * - Use SSE streaming for incremental loading on cache miss
 *
 * Boundaries:
 * - Does not handle navigation or individual file interactions
 */

import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFiles, streamFiles } from "../services/fileService";
import type { FilesResponse } from "../types";
import { useSyncStatus } from "../../accounts/hooks/useSyncStatus";

/** Custom hook for retrieval of folder data with optimized caching */
export function useFiles(folderId: string) {
    const queryClient = useQueryClient();
    const { data: isSyncRunning } = useSyncStatus();

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const closeStreamRef = useRef<(() => void) | null>(null);

    const normalizedFolderId = useMemo(() => {
        if (!folderId || folderId === "root") return "root";
        try {
            const parsed = JSON.parse(folderId);
            if (typeof parsed === "object" && parsed !== null) {
                return JSON.stringify(
                    Object.keys(parsed).sort().reduce(
                        (acc, key) => {
                            acc[key] = (
                                parsed as Record<string, unknown>
                            )[key];
                            return acc;
                        },
                        {} as Record<string, unknown>,
                    ),
                );
            }
        } catch {
            // Not a JSON string, use as is
        }
        return folderId;
    }, [folderId]);

    const query = useQuery<FilesResponse>({
        queryKey: ["files", normalizedFolderId],
        queryFn: ({ signal }) =>
            new Promise<FilesResponse>((resolve, reject) => {
                setIsStreaming(true);
                const qk = ["files", normalizedFolderId];

                const close = streamFiles(
                    normalizedFolderId,
                    (event) => {
                        const partial: FilesResponse = {
                            folder_id: normalizedFolderId,
                            files: event.files,
                        };

                        // Update query cache incrementally
                        queryClient.setQueryData(qk, partial);

                        if (event.done) {
                            setIsStreaming(false);
                            closeStreamRef.current = null;
                            resolve(partial);
                        }
                    },
                    () => {
                        // SSE error: fall back to regular fetch
                        setIsStreaming(false);
                        closeStreamRef.current = null;
                        fetchFiles(normalizedFolderId)
                            .then(resolve)
                            .catch(reject);
                    },
                );

                closeStreamRef.current = close;

                if (signal) {
                    signal.addEventListener("abort", () => {
                        close();
                        setIsStreaming(false);
                        closeStreamRef.current = null;
                    });
                }
            }),
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data?.files) return false;

            const hasMissing = data.files.some(
                (f) =>
                    f.type === "file" &&
                    (!f.updated_at || f.is_generating) &&
                    /\.(mp4|mkv|mov|avi|wmv|flv|webm|jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(
                        f.name,
                    ),
            );

            return isSyncRunning || hasMissing ? 3000 : false;
        },
    });

    /** Manual trigger to bypass all caches */
    const refresh = async () => {
        setIsRefreshing(true);
        try {
            const freshData = await fetchFiles(
                normalizedFolderId,
                true,
            );
            queryClient.setQueryData(
                ["files", normalizedFolderId],
                freshData,
            );

            import("../../../services/apiClient").then(
                ({ apiClient }) => {
                    apiClient
                        .post("/accounts/sync", {})
                        .catch((err) =>
                            console.error("Global sync failed:", err),
                        );
                },
            );

            import("../../accounts/utils/syncState").then(
                ({ syncStateManager }) => {
                    syncStateManager.startMonitoring("thumbnails");
                },
            );
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    /** Full data refresh: rebuild folder sizes then reload */
    const refreshData = async (): Promise<boolean> => {
        setIsRefreshing(true);
        try {
            const { apiClient } = await import(
                "../../../services/apiClient"
            );
            await apiClient.post<{ message: string }>(
                "/accounts/recalculate-sizes",
                {},
            );

            const freshData = await fetchFiles(
                normalizedFolderId,
                true,
            );
            queryClient.setQueryData(
                ["files", normalizedFolderId],
                freshData,
            );
            return true;
        } catch (error) {
            console.error("Refresh data failed:", error);
            return false;
        } finally {
            setIsRefreshing(false);
        }
    };

    return {
        ...query,
        refresh,
        refreshData,
        isRefreshing,
        isStreaming,
    };
}
