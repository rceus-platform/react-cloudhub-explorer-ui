/**
 * File Thumbnail Hook
 *
 * Responsibilities:
 * - Resolve provider and file ID from FileItem
 * - Manage client-side thumbnail generation queue
 * - Construct server-side thumbnail and stream URLs
 *
 * Boundaries:
 * - Does not handle UI rendering or hover states
 */

import { useAuth } from "../../../hooks/useAuth";
import type { FileItem } from "../types";

/** Hook to manage thumbnail generation and URL resolution for a file */
export const useFileThumbnail = (file: FileItem) => {
    const isFolder = file.type === "folder";

    let provider = "";
    let fileId = "";
    if (file.ids["gdrive"]) {
        provider = "gdrive";
        fileId = file.ids["gdrive"];
    } else if (file.ids["mega"]) {
        provider = "mega";
        fileId = file.ids["mega"];
    }

    const { token } = useAuth();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const isImage = /\.(jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(file.name);
    const isVideo = /\.(mp4|mkv|mov|avi|wmv|flv|webm)$/i.test(file.name);

    // Backend now handles background triggers and placeholders automatically.
    // If updated_at is present, it forces a fresh fetch of the generated thumbnail.
    const thumbnailUrl = !isFolder && fileId && (isImage || isVideo)
        ? `${apiBaseUrl}/files/thumbnail?provider=${provider}&file_id=${fileId}&file_name=${encodeURIComponent(file.name)}${file.updated_at ? `&v=${file.updated_at}` : ""}&token=${token}`
        : null;

    const placeholderUrl = isImage 
        ? `${apiBaseUrl}/assets/placeholder-image.png` 
        : `${apiBaseUrl}/assets/placeholder-video.png`;
    
    return {
        provider,
        fileId,
        isImage,
        isVideo,
        thumbnailUrl,
        placeholderUrl,
        // Since generation is now handled in background by backend, 
        // we consider it 'generating' if it's a media file without metadata yet.
        isGenerating: !isFolder && (isImage || isVideo) && !file.updated_at,
    };
};
