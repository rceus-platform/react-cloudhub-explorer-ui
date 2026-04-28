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

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFiles } from "../services/fileService";
import type { FilesResponse } from "../types";

/** Custom hook for retrieval of folder data with optimized caching */
export function useFiles(folderId: string) {
    const queryClient = useQueryClient();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const query = useQuery<FilesResponse>({
        queryKey: ["files", folderId],
        queryFn: () => fetchFiles(folderId),
        staleTime: 30 * 60 * 1000, 
        refetchOnWindowFocus: false,
    });

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
