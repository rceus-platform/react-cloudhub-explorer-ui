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

/** Custom hook for retrieval of folder data with optimized caching */
export function useFiles(folderId: string) {
    const queryClient = useQueryClient();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const normalizedFolderId = useMemo(() => {
        if (!folderId || folderId === "root") return "root";
        try {
            const parsed = JSON.parse(folderId);
            if (typeof parsed === "object" && parsed !== null) {
                // Sort keys alphabetically for consistent query key
                return JSON.stringify(Object.keys(parsed).sort().reduce((acc, key) => {
                    acc[key] = parsed[key];
                    return acc;
                }, {} as any));
            }
        } catch (e) {
            // Not a JSON string, use as is
        }
        return folderId;
    }, [folderId]);

    const query = useQuery<FilesResponse>({
        queryKey: ["files", normalizedFolderId],
        queryFn: () => fetchFiles(normalizedFolderId),
        staleTime: 30 * 60 * 1000, 
        gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
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
