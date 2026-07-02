/**
 * useSyncOperations Hook
 *
 * Responsibilities:
 * - Provide granular sync operation functions (incremental, deep, maintenance)
 * - Track sync state per operation type
 * - Integrate with global sync state manager for UI indicators
 *
 * Boundaries:
 * - Does not handle UI rendering (delegated to components)
 * - Does not directly manage TanStack Query cache (caller can invalidate as needed)
 */

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncStateManager } from "../../accounts/utils/syncState";

type SyncType = 'incremental' | 'deep' | 'maintenance' | 'thumbnails';

interface SyncState {
    incremental: boolean;
    deep: boolean;
    maintenance: boolean;
    thumbnails: boolean;
}

export function normalizeFolderId(folderId: string): string {
    if (!folderId || folderId === "root") return "root";
    try {
        const parsed = JSON.parse(folderId);
        if (typeof parsed === "object" && parsed !== null) {
            return JSON.stringify(
                Object.keys(parsed)
                    .sort()
                    .reduce((acc, key) => {
                        acc[key] = (parsed as Record<string, unknown>)[key];
                        return acc;
                    }, {} as Record<string, unknown>)
            );
        }
    } catch {
        return folderId;
    }
    return folderId;
}

export function useSyncOperations() {
    const queryClient = useQueryClient();
    const [syncStates, setSyncStates] = useState<SyncState>({
        incremental: false,
        deep: false,
        maintenance: false,
        thumbnails: false,
    });

    const setSyncState = (type: SyncType, active: boolean) => {
        setSyncStates(prev => ({ ...prev, [type]: active }));
        if (active) {
            syncStateManager.startMonitoring(type);
        } else {
            syncStateManager.stopMonitoring(type);
        }
    };

    /**
     * Refresh current folder's cloud data via incremental sync
     */
    const refreshFolder = useCallback(async (folderId: string): Promise<boolean> => {
        setSyncState('incremental', true);
        try {
            const { apiClient } = await import("../../../services/apiClient");
            await apiClient.post("/accounts/sync/incremental", {});
            const normalizedFolderId = normalizeFolderId(folderId);
            // Invalidate current folder query to refetch fresh data
            await queryClient.invalidateQueries({ queryKey: ["files", normalizedFolderId] });
            return true;
        } catch (error) {
            console.error("Refresh folder failed:", error);
            return false;
        } finally {
            setSyncState('incremental', false);
        }
    }, [queryClient]);

    /**
     * Incremental sync across all accounts (lightweight, frequent-use)
     */
    const incrementalSync = useCallback(async (): Promise<{ success: boolean; rate_limited?: boolean; total_synced?: number }> => {
        setSyncState('incremental', true);
        try {
            const { apiClient } = await import("../../../services/apiClient");
            const result = await apiClient.post<{ message: string; total_synced: number }>("/accounts/sync/incremental", {});
            return { success: true, ...result };
        } catch (error: unknown) {
            console.error("Incremental sync failed:", error);
            return { success: false };
        } finally {
            setSyncState('incremental', false);
        }
    }, []);

    /**
     * Deep sync across all accounts (rate-limited, heavy operation)
     * Returns rate_limited status if all accounts are within 6h window
     */
    const deepSync = useCallback(async (): Promise<{ success: boolean; rate_limited?: boolean; message?: string }> => {
        setSyncState('deep', true);
        try {
            const { apiClient } = await import("../../../services/apiClient");
            const result = await apiClient.post<{
                message: string;
                total_synced: number;
                total_skipped: number;
                skipped_accounts: Array<{ email: string; reason: string }>;
            }>("/accounts/sync/deep", {});

            const isRateLimited = result.total_synced === 0 && result.total_skipped > 0;
            return {
                success: true,
                rate_limited: isRateLimited,
                message: result.message
            };
        } catch (error: unknown) {
            const err = error as { message: string; status?: number };
            // Handle 429 from server
            if (err.message.includes("429") || err.status === 429) {
                return {
                    success: false,
                    rate_limited: true,
                    message: "Deep sync rate limited. Try again in 6 hours."
                };
            }
            console.error("Deep sync failed:", error);
            return { success: false, message: err.message };
        } finally {
            setSyncState('deep', false);
        }
    }, []);

    /**
     * Recalculate all folder sizes - maintenance operation
     */
    const recalculateStats = useCallback(async (): Promise<boolean> => {
        setSyncState('maintenance', true);
        try {
            const { apiClient } = await import("../../../services/apiClient");
            await apiClient.post("/accounts/maintenance/recalculate-stats", {});
            // Invalidate all file queries to reflect new sizes
            await queryClient.invalidateQueries({ queryKey: ["files"] });
            return true;
        } catch (error) {
            console.error("Recalculate stats failed:", error);
            return false;
        } finally {
            setSyncState('maintenance', false);
        }
    }, [queryClient]);

    /**
     * Repair thumbnails - enqueue all media files for regen
     */
    const repairThumbnails = useCallback(async (): Promise<{ success: boolean; queued?: number }> => {
        setSyncState('thumbnails', true);
        try {
            const { apiClient } = await import("../../../services/apiClient");
            const result = await apiClient.post<{
                message: string;
                queued_files: number;
            }>("/accounts/maintenance/repair-thumbnails", {});
            return { success: true, queued: result.queued_files };
        } catch (error) {
            console.error("Repair thumbnails failed:", error);
            return { success: false };
        } finally {
            setSyncState('thumbnails', false);
        }
    }, []);

    /**
     * Convenience: check if ANY sync operation is currently running
     */
    const isAnySyncing = syncStates.incremental || syncStates.deep || syncStates.maintenance || syncStates.thumbnails;

    return {
        // Individual state flags
        ...syncStates,
        isAnySyncing,
        // Operation functions
        refreshFolder,
        incrementalSync,
        deepSync,
        recalculateStats,
        repairThumbnails,
    };
}
