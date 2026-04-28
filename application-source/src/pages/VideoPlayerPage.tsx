/**
 * VideoPlayerPage Module
 *
 * Responsibilities:
 * - Provide a premium, theater-first layout for video playback
 * - Handle playlist navigation and metadata overlays
 * - Coordinate between player and thumbnail management features
 *
 * Boundaries:
 * - Does not handle raw video tag management (delegated to features/video-player)
 */

import React, { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaImage } from "react-icons/fa";
import { FileCard, useFiles, ThumbnailModal } from "../features/files";
import type { FileItem } from "../features/files";
import { VideoPlayer } from "../features/video-player";
import { FileCardSkeleton } from "../components/Skeleton";

/** Theater-style page combining playback, playlist sidebar, and metadata actions */
const VideoPlayerPage: React.FC = () => {
    const { provider, id: fileId, "*": fullPath } = useParams<{ provider: string; id: string; "*": string }>();
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const fileName = fullPath?.split("/").pop() || "Video";
    const folderId = params.get("folder_id");
    const folderName = params.get("folder_name") || "Back";

    const { data, isLoading } = useFiles(folderId || "root");
    const files = data?.files?.filter((f) => f.type === "file") ?? [];

    const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    /** Navigate to the next video in the folder automatically */
    const handleNext = () => {
        const currentIndex = files.findIndex((f) => f.ids["gdrive"] === fileId || f.ids["mega"] === fileId);

        if (currentIndex !== -1 && currentIndex < files.length - 1) {
            const nextFile = files[currentIndex + 1];
            let nextProvider = "";
            let nextFileId = "";

            if (nextFile.ids["gdrive"]) {
                nextProvider = "gdrive";
                nextFileId = nextFile.ids["gdrive"];
            } else if (nextFile.ids["mega"]) {
                nextProvider = "mega";
                nextFileId = nextFile.ids["mega"];
            }

            if (nextProvider && nextFileId) {
                const currentPathParts = fullPath?.split("/") || [];
                const basePath = currentPathParts.slice(0, -1).map(p => encodeURIComponent(p)).join("/");
                const nextPath = basePath ? `${basePath}/${encodeURIComponent(nextFile.name)}` : encodeURIComponent(nextFile.name);
                navigate(`/player/${nextProvider}/${nextFileId}/${nextPath}?folder_id=${encodeURIComponent(folderId || "root")}&folder_name=${encodeURIComponent(folderName)}`);
            }
        }
    };

    /** Return to the previous folder view */
    const handleBack = () => {
        const currentPathParts = fullPath?.split("/") || [];
        const folderPath = currentPathParts.slice(0, -1).map(p => encodeURIComponent(p)).join("/");
        const target = folderPath ? `/${folderPath}` : "/";
        navigate(`${target}?folder_id=${encodeURIComponent(folderId || "root")}&folder_name=${encodeURIComponent(folderName)}`);
    };

    if (!fileId || !provider) return null;

    return (
        <div style={{ display: "flex", height: "100vh", backgroundColor: "#050505", color: "white", overflow: "hidden" }}>
            {/* Left: Video Player Section (Main) */}
            <div style={{ flex: "0 0 80%", minWidth: 0, display: "flex", flexDirection: "column", position: "relative", backgroundColor: "black", boxShadow: "10px 0 30px rgba(0,0,0,0.5)", zIndex: 2 }}>
                <header className="glass-panel" style={{
                    position: "absolute", top: 0, left: 0, right: 0, padding: "20px 40px", zIndex: 10,
                    display: "flex", alignItems: "center", gap: "20px", borderBottom: "none",
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)"
                }}>
                    <button onClick={handleBack} style={{
                        background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px",
                        borderRadius: "30px", fontSize: "14px", fontWeight: 500, transition: "all 0.2s"
                    }}>
                        <FaArrowLeft />
                        <span>Back to {folderName}</span>
                    </button>
                    <div style={{ height: "30px", width: "1px", backgroundColor: "rgba(255,255,255,0.2)", margin: "0 10px" }} />
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 500, opacity: 0.9, flex: 1 }}>{fileName}</h2>
                </header>

                <VideoPlayer 
                    fileId={fileId} 
                    provider={provider} 
                    fileName={fileName} 
                    onEnded={handleNext}
                    onTimestampUpdate={(t) => setCurrentTime(t)}
                />

                <div style={{ padding: "20px 40px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <button onClick={() => setIsThumbnailModalOpen(true)} style={{
                        background: "var(--accent-color)", border: "none", color: "white", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "10px", padding: "12px 24px", borderRadius: "12px",
                        fontSize: "14px", fontWeight: 600, transition: "all 0.2s", boxShadow: "0 4px 15px rgba(255, 0, 0, 0.3)"
                    }}>
                        <FaImage />
                        <span>Change Thumbnail</span>
                    </button>
                </div>
            </div>

            {/* Right: Playlist Sidebar */}
            <aside style={{ flex: "0 0 20%", minWidth: 0, backgroundColor: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", height: "100%", zIndex: 1 }}>
                <div style={{ padding: "30px 25px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: 600 }}>Up Next</h3>
                    <p style={{ margin: "5px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{files.length} videos in this folder</p>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px" }} className="custom-scrollbar">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} style={{ marginBottom: "20px" }}><FileCardSkeleton /></div>
                        ))
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {files.map((file, index) => {
                                const isCurrent = file.ids["gdrive"] === fileId || file.ids["mega"] === fileId;
                                return (
                                    <div key={index} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", transition: "all 0.2s", border: isCurrent ? "2px solid var(--accent-color)" : "2px solid transparent", boxShadow: isCurrent ? "0 0 15px rgba(255, 0, 0, 0.2)" : "none" }}>
                                        {isCurrent && <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10, backgroundColor: "var(--accent-color)", color: "white", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Playing Now</div>}
                                        <FileCard file={file} onClick={() => {
                                            const p = file.ids["gdrive"] ? "gdrive" : file.ids["mega"] ? "mega" : "";
                                            const id = file.ids[p];
                                            if (p && id) {
                                                const currentPathParts = fullPath?.split("/") || [];
                                                const basePath = currentPathParts.slice(0, -1).map(p => encodeURIComponent(p)).join("/");
                                                const nextPath = basePath ? `${basePath}/${encodeURIComponent(file.name)}` : encodeURIComponent(file.name);
                                                navigate(`/player/${p}/${id}/${nextPath}?folder_id=${encodeURIComponent(folderId || "root")}&folder_name=${encodeURIComponent(folderName)}`);
                                            }
                                        }} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>

            {/* Thumbnail Modal Overlay */}
            {isThumbnailModalOpen && (
                <ThumbnailModal 
                    file={{ ...files.find(f => f.ids[provider] === fileId) as FileItem, duration: currentTime }}
                    provider={provider}
                    fileId={fileId}
                    isOpen={isThumbnailModalOpen}
                    initialTimestamp={currentTime}
                    onClose={() => setIsThumbnailModalOpen(false)}
                    onUpdate={() => {}} // Could trigger a re-render if versioning was needed here
                />
            )}
        </div>
    );
};

export default VideoPlayerPage;
