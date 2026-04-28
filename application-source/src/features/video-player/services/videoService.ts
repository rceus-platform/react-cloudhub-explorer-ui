/**
 * Video Service Module
 *
 * Responsibilities:
 * - Handle API interactions for video playback state
 * - Synchronize watch progress with the backend
 *
 * Boundaries:
 * - Does not handle video streaming URL generation (delegated to components/helpers)
 */


import { apiClient } from "../../../services/apiClient";

/** Save the current playback progress for a specific file */
export const saveVideoProgress = async (fileId: string, currentTime: number, duration: number): Promise<void> => {
    try {
        await apiClient.post("/video/progress", {
            file_id: fileId,
            current_time: Math.floor(currentTime),
            duration: Math.floor(duration),
        });
    } catch (error) {
        console.error("[VideoService] Failed to save progress:", error);
    }
};

/** Retrieve the last saved playback state for a specific file */
export const getVideoState = async (fileId: string): Promise<{ current_time: number; duration: number }> => {
    try {
        return await apiClient.get<{ current_time: number; duration: number }>(`/video/state/${encodeURIComponent(fileId)}`);
    } catch {
        return { current_time: 0, duration: 0 };
    }
};
