/**
 * ThumbnailModal Component
 *
 * Responsibilities:
 * - Coordinate between capture and upload modes for thumbnail management
 * - Provide the modal shell and common actions (Save, Cancel)
 *
 * Boundaries:
 * - Delegates specific mode UIs to sub-components
 */

import React, { useState, useEffect } from "react";
import { FaTimes, FaCamera, FaUpload, FaSpinner } from "react-icons/fa";
import { useAuth } from "../../../hooks/useAuth";
import type { FileItem } from "../types";
import { updateThumbnail } from "../services/fileService";
import type { UpdateThumbnailResponse } from "../types";
import { ThumbnailPreview } from "./ThumbnailPreview";
import { ThumbnailCapture } from "./ThumbnailCapture";
import { ThumbnailUpload } from "./ThumbnailUpload";

interface ThumbnailModalProps {
    file: FileItem;
    provider: string;
    fileId: string;
    isOpen: boolean;
    initialTimestamp?: number;
    onClose: () => void;
    onUpdate: (updatedAt: number) => void;
}

/** Orchestrator modal for thumbnail modification */
export const ThumbnailModal: React.FC<ThumbnailModalProps> = ({
    file, provider, fileId, isOpen, initialTimestamp, onClose, onUpdate
}) => {
    const { token } = useAuth();
    const isImage = /\.(jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(file.name || "");
    const [mode, setMode] = useState<"capture" | "upload">(isImage ? "upload" : "capture");
    const [timestamp, setTimestamp] = useState(initialTimestamp || 60);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (initialTimestamp) setTimestamp(Math.floor(initialTimestamp));
    }, [initialTimestamp]);

    if (!isOpen) return null;

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const handlePreview = async () => {
        setLoading(true);
        // The backend /thumbnail endpoint handles timestamp-based previews
        setTimeout(() => setLoading(false), 500);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let result;
            if (mode === "upload" && selectedFile) {
                result = await updateThumbnail(fileId, provider, {
                    file: selectedFile
                }) as UpdateThumbnailResponse;
            } else if (mode === "capture") {
                // Pass timestamp to backend for server-side extraction
                result = await updateThumbnail(fileId, provider, {
                    timestamp: timestamp
                }) as UpdateThumbnailResponse;
            }

            if (result?.success) {
                onUpdate(result.updated_at);
                onClose();
            }
        } catch (error) {
            console.error("[ThumbnailModal] Failed to update thumbnail:", error);
        } finally {
            setSaving(false);
        }
    };

    const fallbackUrl = `${apiBaseUrl}/files/thumbnail?provider=${provider}&file_id=${fileId}&file_name=${encodeURIComponent(file.name)}&token=${token}`;
    const previewUrl = mode === "capture" 
        ? `${fallbackUrl}&timestamp=${timestamp}`
        : null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }} onClick={onClose}>
            <div
                style={{
                    width: "100%", maxHeight: "90vh", maxWidth: "600px",
                    backgroundColor: "#1a1a1a", borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden",
                    display: "flex", flexDirection: "column", position: "relative",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <h3 style={{ margin: 0, color: "white" }}>Edit Thumbnail</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "20px" }}>
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: "24px", overflowY: "auto" }}>
                    <ThumbnailPreview
                        loading={loading}
                        previewUrl={previewUrl}
                        selectedFile={selectedFile}
                        fallbackUrl={fallbackUrl}
                        videoUrl={null}
                        timestamp={timestamp}
                    />

                    {/* Mode Selector */}
                    {!isImage && (
                        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", backgroundColor: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "8px" }}>
                            <button onClick={() => setMode("capture")} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", backgroundColor: mode === "capture" ? "var(--accent-color)" : "transparent", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                <FaCamera /> Capture
                            </button>
                            <button onClick={() => setMode("upload")} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", backgroundColor: mode === "upload" ? "var(--accent-color)" : "transparent", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                <FaUpload /> Upload
                            </button>
                        </div>
                    )}

                    {mode === "capture" ? (
                        <ThumbnailCapture
                            timestamp={timestamp}
                            duration={file.duration || 600}
                            loading={loading}
                            onTimestampChange={setTimestamp}
                            onPreview={handlePreview}
                        />
                    ) : (
                        <ThumbnailUpload
                            selectedFile={selectedFile}
                            onFileSelect={setSelectedFile}
                        />
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: "20px", display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving || (mode === "upload" && !selectedFile)} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "white", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                        {saving && <FaSpinner className="spinner" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            <style>{`
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
