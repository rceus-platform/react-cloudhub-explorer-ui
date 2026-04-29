/**
 * VideoPlayer Component
 *
 * Responsibilities:
 * - Render the native video element and manage its state
 * - Handle automatic progress saving and resume logic
 * - Manage video events (ended, timeupdate)
 *
 * Boundaries:
 * - Does not handle the playlist or surrounding page layout
 */

import React, { useEffect, useRef } from "react";
import { saveVideoProgress, getVideoState } from "../services/videoService";

interface VideoPlayerProps {
    provider: string;
    fileId: string;
    fileName: string;
    onEnded: () => void;
    onTimestampUpdate?: (time: number) => void;
}

/** Core playback component with persistent state management and progress tracking */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    provider, fileId, fileName, onEnded, onTimestampUpdate
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isResumeLoaded = useRef(false);

    const token = localStorage.getItem("access_token") ?? "";
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const streamUrl = `${apiBaseUrl}/files/stream?provider=${provider}&file_id=${fileId}&file_name=${encodeURIComponent(fileName)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

    // Load last known playback position on file change
    useEffect(() => {
        if (!fileId) return;
        isResumeLoaded.current = false;

        getVideoState(fileId).then((state) => {
            if (videoRef.current && state.current_time > 0) {
                videoRef.current.currentTime = state.current_time;
            }
            isResumeLoaded.current = true;
        });
    }, [fileId]);

    /** Synchronize current time with backend periodically */
    const handleTimeUpdate = () => {
        if (!videoRef.current || !fileId || !isResumeLoaded.current) return;

        const currentTime = videoRef.current.currentTime;
        if (onTimestampUpdate) onTimestampUpdate(currentTime);

        // Throttle saves to every 5 seconds of playback
        if (Math.floor(currentTime) % 5 === 0) {
            saveVideoProgress(fileId, currentTime, videoRef.current.duration);
        }
    };

    const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);

    if (isImage) {
        return (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "black", overflow: "hidden" }}>
                <img
                    src={streamUrl}
                    alt={fileName}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
            </div>
        );
    }

    return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
            <video
                ref={videoRef}
                key={fileId} // Force reload on source change
                controls
                autoPlay
                onTimeUpdate={handleTimeUpdate}
                onEnded={onEnded}
                style={{ width: "100%", maxHeight: "100%", outline: "none" }}
            >
                <source src={streamUrl} />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};
