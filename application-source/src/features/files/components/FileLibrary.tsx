/**
 * FileLibrary Component
 *
 * Responsibilities:
 * - Render the main file browsing interface
 * - Manage navigation history and state orchestration
 * - Handle file and folder clicks (navigation vs playback)
 *
 * Boundaries:
 * - Delegates header and hero rendering to sub-components
 * - Delegates individual file rendering to FileCard
 */

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useFiles } from "../hooks/useFiles";
import { useAuth } from "../../../hooks/useAuth";
import { FileCard } from "./FileCard";
import { FileCardSkeleton } from "../../../components/Skeleton";
import type { FileItem, FolderState } from "../types";
import { FileLibraryHeader } from "./FileLibraryHeader";
import { FileLibraryHero } from "./FileLibraryHero";
import { ImageViewer, type ImageViewerItem } from "../../image-viewer";
import { TagManager } from "./TagManager";
import { ShareModal } from "./ShareModal";
import { CreateItemModal } from "./CreateItemModal";
import { useFileStore } from "../../../store/useFileStore";

/** Encode a folder name into a URL-safe path segment */
const encodeSegment = (name: string): string =>
    encodeURIComponent(name)
        .replace(/%5B/g, "[")
        .replace(/%5D/g, "]")
        .replace(/%20/g, "-");

/** Main feature component for browsing and navigating the cloud file library */
export const FileLibrary: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuth();
    const { columnCount, setColumnCount, sort, filter } = useFileStore();

    // Redirect bare "/" to "/Home" on initial load
    useEffect(() => {
        if (location.pathname === "/") {
            navigate("/Home", { replace: true });
        }
    }, [location.pathname, navigate]);

    // Ensure root folder metadata is always available in sessionStorage
    useEffect(() => {
        sessionStorage.setItem("folderId:/Home", "root");
        sessionStorage.setItem("folderName:/Home", "Home");
    }, []);

    // Derive folder navigation history from URL (URL is the source of truth)
    const history = useMemo<FolderState[]>(() => {
        const segments = location.pathname.split("/").filter(Boolean);
        if (segments.length === 0) {
            return [{ id: "root", name: "Home" }];
        }
        return segments.map((seg, i) => {
            const pathUpTo = "/" + segments.slice(0, i + 1).join("/");
            const storedId = sessionStorage.getItem(`folderId:${pathUpTo}`);
            const storedName = sessionStorage.getItem(`folderName:${pathUpTo}`);
            if (i === 0) {
                return { id: "root", name: storedName || decodeURIComponent(seg) };
            }
            return {
                id: storedId ?? "root",
                name: storedName || decodeURIComponent(seg),
            };
        });
    }, [location.pathname]);

    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerItems, setViewerItems] = useState<ImageViewerItem[]>([]);
    const [viewerIndex, setViewerIndex] = useState(0);



    const currentFolder = history[history.length - 1];
    const { data, isLoading, error, refresh, isRefreshing } = useFiles(currentFolder.id);

    // Memoize files retrieval to satisfy hook dependency rules
    const files = useMemo(() => data?.files ?? [], [data?.files]);

    const { search: searchFilter } = filter;

    const sortedFiles = useMemo(() => {
        const searchTerm = searchFilter.trim().toLowerCase();

        const filtered = files.filter((file) => {
            // Name search — case-insensitive substring match
            if (searchTerm && !file.name.toLowerCase().includes(searchTerm)) {
                return false;
            }
            return true;
        });

        return filtered.sort((a, b) => {
            if (a.type === "folder" && b.type !== "folder") return -1;
            if (a.type !== "folder" && b.type === "folder") return 1;
            if (sort.field === "size") {
                const diff = (a.size ?? 0) - (b.size ?? 0);
                return sort.order === "asc" ? diff : -diff;
            }
            if (sort.field === "modified_at") {
                const aTime = a.updated_at ?? 0;
                const bTime = b.updated_at ?? 0;
                return sort.order === "asc" ? aTime - bTime : bTime - aTime;
            }
            const cmp = a.name.localeCompare(b.name);
            return sort.order === "asc" ? cmp : -cmp;
        });
    }, [files, searchFilter, sort]);

    /** Handle item selection: folders navigate deep, videos open player, images open in new tab */
    const handleClick = (file: FileItem) => {
        if (file.type === "folder") {
            const nextFolderId = JSON.stringify(file.ids);
            const currentSegments = location.pathname.split("/").filter(Boolean);
            const newPath = "/" + [...currentSegments, encodeSegment(file.name)].join("/");

            // Persist folder metadata for URL-based recovery (back/forward, new tab)
            sessionStorage.setItem(`folderId:${newPath}`, nextFolderId);
            sessionStorage.setItem(`folderName:${newPath}`, file.name);
            navigate(newPath); // push creates browser history entry
        } else {
            let provider = "";
            let fileId = "";

            if (file.ids["gdrive"]) {
                provider = "gdrive";
                fileId = file.ids["gdrive"];
            } else if (file.ids["mega"]) {
                provider = "mega";
                fileId = file.ids["mega"];
            }

            if (!fileId) return;

            const isImage = /\.(jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(file.name);
            if (isImage) {
                const imageItems = sortedFiles
                    .filter((item) => item.type === "file" && /\.(jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(item.name))
                    .map((item) => {
                        if (item.ids["gdrive"]) {
                            return { id: item.ids["gdrive"], provider: "gdrive", name: item.name };
                        }
                        if (item.ids["mega"]) {
                            return { id: item.ids["mega"], provider: "mega", name: item.name };
                        }
                        return null;
                    })
                    .filter((item): item is ImageViewerItem => item !== null);

                const selectedIndex = imageItems.findIndex(
                    (item) => item.provider === provider && item.id === fileId
                );

                setViewerItems(imageItems);
                setViewerIndex(selectedIndex >= 0 ? selectedIndex : 0);
                setIsViewerOpen(true);
                return;
            }

            const breadcrumbs = history.slice(1).map(h => encodeURIComponent(h.name)).join("/");
            const path = breadcrumbs ? `${breadcrumbs}/${encodeURIComponent(file.name)}` : encodeURIComponent(file.name);
            const playerUrl = `/player/${provider}/${fileId}/${path}?folder_id=${encodeURIComponent(currentFolder.id)}&folder_name=${encodeURIComponent(currentFolder.name)}`;

            navigate(playerUrl);
        }
    };

    if (error) return (
        <div className="container" style={{ paddingTop: "100px", textAlign: "center" }}>
            <h2 style={{ color: "var(--accent-color)" }}>Error loading files</h2>
            <p>{(error as Error).message}</p>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <FileLibraryHeader
                history={history}
                columnCount={columnCount}
                onBreadcrumbClick={(i) => {
                    const segments = location.pathname.split("/").filter(Boolean);
                    const targetPath = "/" + segments.slice(0, i + 1).join("/");
                    if (location.pathname !== targetPath) {
                        navigate(targetPath);
                    }
                }}
                onColumnCountChange={setColumnCount}
                onRefresh={refresh}
                isRefreshing={isRefreshing}
            />

            <main className="container" style={{ paddingBottom: "100px" }}>
                <FileLibraryHero
                    title={currentFolder.name}
                    itemCount={files.length}
                    isLoading={isLoading}
                />

                <div
                    className="file-grid"
                    data-testid="skeleton-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                        gap: "32px",
                        width: "100%",
                        alignItems: "start"
                    }}
                >
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <FileCardSkeleton key={i} />
                        ))
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {sortedFiles.map((file) => (
                                <motion.div
                                    key={`${file.name}-${file.type}-${Object.values(file.ids).join("-")}`}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                >
                                    <FileCard
                                        file={file}
                                        onClick={() => handleClick(file)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </main>

            <ImageViewer
                isOpen={isViewerOpen}
                items={viewerItems}
                initialIndex={viewerIndex}
                token={token ?? undefined}
                onClose={() => setIsViewerOpen(false)}
            />

            {/* Global modals managed by Zustand store */}
            <TagManager />
            <ShareModal />
            <CreateItemModal
                parentId={currentFolder.id === "root" ? null : currentFolder.id}
                onCreated={refresh}
            />
        </div>
    );
};
