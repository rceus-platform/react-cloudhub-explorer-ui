/**
 * File Service Module
 *
 * Responsibilities:
 * - Handle API interactions for file and folder operations
 * - Transform raw API data if necessary
 *
 * Boundaries:
 * - Does not handle UI state or player-specific logic
 */

import { apiClient } from "../../../services/apiClient";
import type { FileStreamEvent, FilesResponse } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Fetch file listing for a specific folder */
export const fetchFiles = async (
    folderId: string = "root",
    refresh: boolean = false,
): Promise<FilesResponse> => {
    const url = `/files/?folder_id=${encodeURIComponent(folderId)}${refresh ? "&refresh=true" : ""}`;
    return apiClient.get<FilesResponse>(url);
};

/** Open an SSE stream for incremental file loading */
export const streamFiles = (
    folderId: string,
    onEvent: (event: FileStreamEvent) => void,
    onError?: (error: Event) => void,
): (() => void) => {
    const token = localStorage.getItem("access_token");
    const params = new URLSearchParams({
        folder_id: folderId,
    });
    if (token) params.set("token", token);

    const url = `${BASE_URL}/files/stream-files?${params}`;
    const source = new EventSource(url);

    source.onmessage = (e: MessageEvent) => {
        try {
            const data: FileStreamEvent = JSON.parse(e.data);
            onEvent(data);
            if (data.done) source.close();
        } catch {
            // Ignore malformed events
        }
    };

    source.onerror = (e: Event) => {
        source.close();
        onError?.(e);
    };

    return () => source.close();
};

/** Update thumbnail for a file via timestamp capture or manual upload */
export const updateThumbnail = async (
    fileId: string, 
    provider: string, 
    data: { timestamp?: number; file?: File; duration?: number }
) => {
    // Mode A: Capture from timestamp
    if (data.timestamp !== undefined) {
        return apiClient.patch(`/files/${fileId}/thumbnail?provider=${provider}&timestamp=${data.timestamp}`, {});
    }
    
    // Mode B: Manual upload (requires FormData)
    if (data.file) {
        const formData = new FormData();
        formData.append("file", data.file);
        let url = `/files/${fileId}/thumbnail?provider=${provider}`;
        if (data.duration !== undefined) url += `&duration=${data.duration}`;
        return apiClient.patch(url, formData);
    }
};
