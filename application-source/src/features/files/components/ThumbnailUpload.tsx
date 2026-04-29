/**
 * ThumbnailUpload Component
 *
 * Responsibilities:
 * - Provide a drag-and-drop interface for image uploads
 * - Handle file selection via native file picker
 *
 * Boundaries:
 * - Does not handle video frame capture logic
 */

import React from "react";
import { FaUpload } from "react-icons/fa";

interface ThumbnailUploadProps {
    selectedFile: File | null;
    onFileSelect: (file: File) => void;
}

/** Interface for uploading custom image files as thumbnails */
export const ThumbnailUpload: React.FC<ThumbnailUploadProps> = ({
    selectedFile, onFileSelect
}) => {
    return (
        <div
            style={{
                border: "2px dashed rgba(255,255,255,0.2)",
                borderRadius: "12px",
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s"
            }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent-color)"; }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    onFileSelect(e.dataTransfer.files[0]);
                }
            }}
            onClick={() => document.getElementById("file-upload")?.click()}
        >
            <FaUpload style={{ fontSize: "32px", color: "#666", marginBottom: "12px" }} />
            <div style={{ color: "white", marginBottom: "4px" }}>
                {selectedFile ? selectedFile.name : "Click or drag to upload"}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>Supports JPG, PNG (Max 5MB)</div>
            <input
                type="file"
                id="file-upload"
                hidden
                accept="image/*"
                onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
            />
        </div>
    );
};
