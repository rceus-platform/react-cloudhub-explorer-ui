/**
 * ThumbnailCapture Component
 *
 * Responsibilities:
 * - Provide controls for seeking through a video to find a thumbnail frame
 * - Trigger preview generation
 *
 * Boundaries:
 * - Does not handle manual file uploads
 */

import React from "react";

interface ThumbnailCaptureProps {
    timestamp: number;
    duration: number;
    loading: boolean;
    onTimestampChange: (time: number) => void;
    onPreview: () => void;
}

/** Interface for capturing a specific frame from a video timeline */
export const ThumbnailCapture: React.FC<ThumbnailCaptureProps> = ({
    timestamp, duration, loading, onTimestampChange, onPreview
}) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: "14px" }}>
                <span>Timestamp</span>
                <span>{Math.floor(timestamp / 60)}:{String(timestamp % 60).padStart(2, "0")}</span>
            </div>
            <input
                type="range"
                min="1"
                max={duration}
                value={timestamp}
                onChange={(e) => onTimestampChange(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-color)" }}
            />
            <button
                onClick={onPreview}
                disabled={loading}
                style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--accent-color)",
                    backgroundColor: "transparent",
                    color: "var(--accent-color)",
                    cursor: "pointer",
                    fontWeight: 600
                }}
            >
                Preview Frame
            </button>
        </div>
    );
};
