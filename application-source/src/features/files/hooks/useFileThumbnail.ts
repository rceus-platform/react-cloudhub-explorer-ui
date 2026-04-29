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

import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import type { FileItem } from "../types";
import { thumbnailQueue } from "../utils/thumbnailQueue";

/** Hook to manage thumbnail generation and URL resolution for a file */
export const useFileThumbnail = (file: FileItem) => {
    const [isGenerating, setIsGenerating] = useState(false);
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

    useEffect(() => {
        if (!isFolder && !file.updated_at && (isVideo || isImage) && fileId && token && !isGenerating) {
            const streamUrl = `${apiBaseUrl}/files/stream?provider=${provider}&file_id=${fileId}&file_name=${encodeURIComponent(file.name)}&token=${token}`;

            thumbnailQueue.add({
                fileId,
                provider,
                streamUrl,
                isVideo,
                onComplete: () => setIsGenerating(false),
                onError: () => setIsGenerating(false),
            });

            // Use microtask to avoid synchronous state update in effect (cascading render warning)
            Promise.resolve().then(() => setIsGenerating(true));
        }
    }, [file.updated_at, file.name, isFolder, isVideo, isImage, fileId, token, provider, apiBaseUrl, isGenerating]);

    const thumbnailUrl = !isFolder && fileId && (isImage || isVideo) && file.updated_at
        ? `${apiBaseUrl}/files/thumbnail?provider=${provider}&file_id=${fileId}&file_name=${encodeURIComponent(file.name)}&v=${file.updated_at}&token=${token}`
        : null;

    return {
        provider,
        fileId,
        isImage,
        isVideo,
        thumbnailUrl,
        isGenerating,
    };
};
