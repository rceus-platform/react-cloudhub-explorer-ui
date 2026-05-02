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
import { useFiles } from "../hooks/useFiles";
import { useAuth } from "../../../hooks/useAuth";
import { FileCard } from "./FileCard";
import { FileCardSkeleton } from "../../../components/Skeleton";
import type { FileItem, FolderState } from "../types";
import { FileLibraryHeader } from "./FileLibraryHeader";
import { FileLibraryHero } from "./FileLibraryHero";

/** Main feature component for browsing and navigating the cloud file library */
export const FileLibrary: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuth();

    // Initialize state from URL if possible to avoid cascading renders in useEffect
    const [history, setHistory] = useState<FolderState[]>(() => {
        const params = new URLSearchParams(location.search);

        // Try to recover from sessionStorage using current path as key
        const currentPath = location.pathname;
        const storedHistory = sessionStorage.getItem(`history:${currentPath}`);
        if (storedHistory) {
            try {
                return JSON.parse(storedHistory);
            } catch (e) {
                console.error("Failed to parse history from sessionStorage", e);
            }
        }

        // Fallback for single folder params
        const fId = params.get("folder_id");
        const fName = params.get("folder_name");

        const base = { id: "root", name: "Home" };
        if (fId && fName) {
            return [base, { id: fId, name: fName }];
        }
        return [base];
    });

    const [columnCount, setColumnCount] = useState(6);

    // Synchronize URL with folder navigation history
    useEffect(() => {
        const path = history.map(h => encodeURIComponent(h.name)
            .replace(/%5B/g, "[")
            .replace(/%5D/g, "]")
            .replace(/%20/g, "-")
        ).join("/");
        const targetUrl = `/${path}`;

        // Persist history to sessionStorage for the target path
        sessionStorage.setItem(`history:${targetUrl}`, JSON.stringify(history));

        if (location.pathname !== targetUrl) {
            navigate(targetUrl, { replace: true });
        }
    }, [history, navigate, location.pathname]);

    const currentFolder = history[history.length - 1];
    const { data, isLoading, error, refresh, isRefreshing } = useFiles(currentFolder.id);

    // Memoize files retrieval to satisfy hook dependency rules
    const files = useMemo(() => data?.files ?? [], [data?.files]);

    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => {
            if (a.type === "folder" && b.type !== "folder") return -1;
            if (a.type !== "folder" && b.type === "folder") return 1;
            return a.name.localeCompare(b.name);
        });
    }, [files]);

    /** Handle item selection: folders navigate deep, videos open player, images open in new tab */
    const handleClick = (file: FileItem) => {
        if (file.type === "folder") {
            const nextFolderId = JSON.stringify(file.ids);
            setHistory((prev) => [
                ...prev,
                { id: nextFolderId, name: file.name },
            ]);
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
                const url = `${import.meta.env.VITE_API_BASE_URL}/files/thumbnail?provider=${provider}&file_id=${fileId}&file_name=${encodeURIComponent(file.name)}&token=${token}`;
                window.open(url, "_blank");
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
                onBreadcrumbClick={(i) => setHistory(history.slice(0, i + 1))}
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
                        sortedFiles.map((file) => (
                            <FileCard
                                key={`${file.name}-${file.type}-${Object.values(file.ids).join("-")}`}
                                file={file}
                                onClick={() => handleClick(file)}
                            />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};
