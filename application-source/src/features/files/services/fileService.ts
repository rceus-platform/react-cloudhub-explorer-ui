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
import type { FilesResponse } from "../types";

/** Fetch file listing for a specific folder */
export const fetchFiles = async (folderId: string = "root", refresh: boolean = false): Promise<FilesResponse> => {
    const url = `/files/?folder_id=${encodeURIComponent(folderId)}${refresh ? "&refresh=true" : ""}`;
    return apiClient.get<FilesResponse>(url);
};

/** Update thumbnail for a file via timestamp capture or manual upload */
export const updateThumbnail = async (
    fileId: string, 
    provider: string, 
    data: { timestamp?: number; file?: File }
) => {
    // Mode A: Capture from timestamp
    if (data.timestamp !== undefined) {
        return apiClient.patch(`/files/${fileId}/thumbnail?provider=${provider}&timestamp=${data.timestamp}`, {});
    }
    
    // Mode B: Manual upload (requires FormData)
    if (data.file) {
        const formData = new FormData();
        formData.append("file", data.file);
        return apiClient.patch(`/files/${fileId}/thumbnail?provider=${provider}`, formData);
    }
};
