/**
 * FileCard Component
 *
 * Responsibilities:
 * - Render an interactive preview card for files and folders
 * - Handle Netflix-style hover expansions and metadata display
 *
 * Boundaries:
 * - Does not manage file streaming or playback logic
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFolder, FaPlay } from "react-icons/fa";
import { useAuth } from "../../../hooks/useAuth";
import type { FileItem } from "../types";
import { formatSize, formatDuration } from "../utils/formatters";

interface FileCardProps {
    file: FileItem;
    onClick: () => void;
}

/** Premium content card with cinematic hover transitions and metadata focus */
export const FileCard: React.FC<FileCardProps> = ({ file, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isFolder = file.type === "folder";
    const progress = file.progress_percentage || 0;

    let provider = "";
    let fileId = "";
    if (file.ids["gdrive"]) { provider = "gdrive"; fileId = file.ids["gdrive"]; }
    else if (file.ids["mega"]) { provider = "mega"; fileId = file.ids["mega"]; }

    const { token } = useAuth();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const isImage = /\.(jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(file.name);
    const isVideo = /\.(mp4|mkv|mov|avi|wmv|flv|webm)$/i.test(file.name);
    const thumbnailUrl = !isFolder && fileId && (isImage || isVideo)
        ? `${apiBaseUrl}/files/thumbnail?provider=${provider}&file_id=${fileId}&file_name=${encodeURIComponent(file.name)}${file.updated_at ? `&v=${file.updated_at}` : ""}&token=${token}`
        : null;

    return (
        <motion.div 
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            style={{ 
                position: "relative", 
                cursor: "pointer",
                zIndex: isHovered ? 20 : 1
            }}
        >
            <motion.div
                animate={{ 
                    scale: isHovered ? 1.05 : 1,
                    y: isHovered ? -10 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                    backgroundColor: "var(--surface-color)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: isHovered ? "var(--shadow-premium)" : "var(--shadow-md)",
                    border: "1px solid rgba(255,255,255,0.05)"
                }}
            >
                {/* Thumbnail Section */}
                <div style={{ 
                    position: "relative", 
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    aspectRatio: "16/9"
                }}>
                    {/* Blurred Background for Images (Premium feel) */}
                    {isImage && thumbnailUrl && (
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${thumbnailUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(40px) brightness(0.4)",
                            opacity: 0.6,
                            zIndex: 0
                        }} />
                    )}

                    {isFolder ? (
                        <div style={{ 
                            position: "absolute", inset: 0, display: "flex", 
                            alignItems: "center", justifyContent: "center"
                        }}>
                            <FaFolder size={64} style={{ color: "var(--accent-color)", opacity: 0.8 }} />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {thumbnailUrl ? (
                                <motion.img 
                                    key={thumbnailUrl}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    src={thumbnailUrl}
                                    style={{ 
                                        width: "100%", 
                                        height: "100%",
                                        objectFit: "contain",
                                        position: "relative",
                                        zIndex: 1
                                    }}
                                />
                            ) : (
                                <div style={{ 
                                    position: "absolute", inset: 0, display: "flex", 
                                    alignItems: "center", justifyContent: "center", opacity: 0.2
                                }}>
                                    <FaPlay size={32} />
                                </div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Progress Bar overlay */}
                    {progress > 0 && !isFolder && !isImage && (
                        <div style={{ 
                            position: "absolute", bottom: 0, left: 0, right: 0, 
                            height: "4px", backgroundColor: "rgba(255,255,255,0.1)",
                            zIndex: 5
                        }}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                style={{ height: "100%", backgroundColor: "var(--accent-color)" }}
                            />
                        </div>
                    )}

                    {/* Duration badge */}
                    {file.duration && file.duration > 0 && !isFolder && !isImage && (
                        <div style={{
                            position: "absolute", bottom: "12px", right: "12px",
                            padding: "4px 8px", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.8)",
                            fontSize: "11px", fontWeight: 700, color: "#fff", backdropFilter: "blur(4px)",
                            zIndex: 5
                        }}>
                            {formatDuration(file.duration)}
                        </div>
                    )}

                    {/* Play Button Overlay on Hover */}
                    <motion.div 
                        animate={{ opacity: isHovered && !isImage && !isFolder ? 1 : 0 }}
                        style={{
                            position: "absolute", inset: 0, display: "flex", 
                            alignItems: "center", justifyContent: "center",
                            background: isImage || isFolder ? "none" : "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
                            zIndex: 2
                        }}
                    >
                        {!isFolder && !isImage && <FaPlay size={40} style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))" }} />}
                    </motion.div>
                </div>

                {/* Content Section */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isFolder && <FaFolder size={14} style={{ opacity: 0.4, flexShrink: 0 }} />}
                        <h3 style={{ 
                            margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-primary)",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                        }}>
                            {file.name}
                        </h3>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", opacity: 0.5, fontWeight: 500 }}>
                        <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>{provider}</span>
                        {file.size && (
                            <>
                                <div style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "currentColor" }} />
                                <span>{formatSize(file.size)}</span>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
