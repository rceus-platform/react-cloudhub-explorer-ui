import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../services/apiClient";
import { syncStateManager } from "../utils/syncState";

export function useSyncStatus() {
    const [isMonitoring, setIsMonitoring] = useState(syncStateManager.getIsMonitoring());

    useEffect(() => {
        return syncStateManager.subscribe(setIsMonitoring);
    }, []);

    return useQuery({
        queryKey: ["sync-status"],
        enabled: isMonitoring,
        queryFn: async () => {
            const response = await apiClient.get<{ status: string }>("/accounts/sync/status");
            const isRunning = response.status === "running";
            if (!isRunning) {
                syncStateManager.stopMonitoring();
            }
            return isRunning;
        },
        refetchInterval: isMonitoring ? 5000 : false,
    });
}
