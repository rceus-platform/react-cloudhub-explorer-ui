/**
 * ThumbnailPreview Component
 *
 * Responsibilities:
 * - Render the image preview area for the thumbnail modal
 * - Handle loading states and fallbacks
 *
 * Boundaries:
 * - Does not handle image capture or file picking logic
 */

import React from "react";
import { FaSpinner } from "react-icons/fa";

interface ThumbnailPreviewProps {
    loading: boolean;
    previewUrl: string | null;
    selectedFile: File | null;
    fallbackUrl: string;
}

/** Visual preview of the pending thumbnail update */
export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({ 
    loading, previewUrl, selectedFile, fallbackUrl 
}) => {
    return (
        <div style={{
            width: "100%",
            aspectRatio: "16/9",
            backgroundColor: "#000",
            borderRadius: "8px",
            marginBottom: "24px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            {loading && (
                <div style={{ position: "absolute", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", width: "100%", height: "100%" }}>
                    <FaSpinner className="spinner" style={{ color: "white", fontSize: "32px" }} />
                </div>
            )}
            
            {selectedFile ? (
                <img 
                    src={URL.createObjectURL(selectedFile)} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
            ) : (
                <img 
                    src={previewUrl || fallbackUrl} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    key={previewUrl}
                />
            )}
        </div>
    );
};
