/**
 * FileLibraryHeader Module
 *
 * Responsibilities:
 * - Provide a minimalist navigation header with breadcrumbs
 * - Manage grid density controls and account management access
 *
 * Boundaries:
 * - Does not handle file library loading or filtering logic
 */

import React, { useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Cloud, Grid, FolderPlus, Upload } from "lucide-react";
import type { FolderState } from "../types";
import { AccountManager } from "../../accounts/components/AccountManager";
import { SearchFilterBar } from "./SearchFilterBar";
import { useFileStore } from "../../../store/useFileStore";
import { SyncToolsMenu } from "./SyncToolsMenu";

interface FileLibraryHeaderProps {
    history: FolderState[];
    columnCount: number;
    onBreadcrumbClick: (index: number) => void;
    onColumnCountChange: (count: number) => void;
}

/** Ultra-minimalist header with focused navigation and controls */
export const FileLibraryHeader: React.FC<FileLibraryHeaderProps> = ({
    history, columnCount, onBreadcrumbClick, onColumnCountChange
}) => {
    const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
    const { openCreateFolder, openUploadFile } = useFileStore();

    // Derive current folder ID from history (last item)
    const currentFolderId = history[history.length - 1]?.id || "root";

    return (
        <header className="sticky-header" style={{ height: "72px", display: "flex", alignItems: "center" }}>
            <div className="container" style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                    <div
                        onClick={() => onBreadcrumbClick(0)}
                        style={{
                            fontSize: "18px",
                            fontWeight: 800,
                            letterSpacing: "-1px",
                            cursor: "pointer",
                            color: "var(--text-primary)"
                        }}
                    >
                        CLOUDHUB
                    </div>

                    <nav style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px" }}>
                        {history.map((h, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <FaChevronRight style={{ fontSize: "8px", opacity: 0.3 }} />}
                                <span
                                    onClick={() => onBreadcrumbClick(i)}
                                    style={{
                                        cursor: "pointer",
                                        color: i === history.length - 1 ? "var(--text-primary)" : "var(--text-secondary)",
                                        fontWeight: i === history.length - 1 ? 600 : 500,
                                        transition: "all 0.2s",
                                        opacity: i === history.length - 1 ? 1 : 0.6
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                                    onMouseOut={(e) => (e.currentTarget.style.opacity = i === history.length - 1 ? "1" : "0.6")}
                                >
                                    {h.name}
                                </span>
                            </React.Fragment>
                        ))}
                    </nav>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Search & Filter */}
                    <SearchFilterBar />

                    <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.06)" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingRight: "16px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                        <Grid size={14} style={{ opacity: 0.4 }} />
                        <input
                            type="range"
                            min="2"
                            max="6"
                            step="1"
                            value={columnCount}
                            onChange={(e) => onColumnCountChange(parseInt(e.target.value))}
                            style={{
                                appearance: "none", width: "80px", height: "3px",
                                background: "rgba(255,255,255,0.1)", borderRadius: "2px",
                                outline: "none", cursor: "pointer"
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <button
                        id="create-folder-btn"
                        onClick={() => openCreateFolder()}
                        className="premium-button secondary"
                        style={{ padding: "8px 12px", height: "36px", gap: "6px" }}
                        title="New folder"
                    >
                        <FolderPlus size={14} />
                        <span style={{ fontSize: "12px" }}>Folder</span>
                    </button>

                    <button
                        id="upload-file-btn"
                        onClick={() => openUploadFile()}
                        className="premium-button secondary"
                        style={{ padding: "8px 12px", height: "36px", gap: "6px" }}
                        title="Upload file"
                    >
                        <Upload size={14} />
                        <span style={{ fontSize: "12px" }}>Upload</span>
                    </button>

                    {/* Unified Sync & Tools Menu */}
                    <SyncToolsMenu currentFolderId={currentFolderId} />

                    <button
                        onClick={() => setIsAccountManagerOpen(true)}
                        className="premium-button"
                        style={{ padding: "8px 16px", height: "36px" }}
                    >
                        <Cloud size={16} />
                        <span>Cloud Accounts</span>
                    </button>
                </div>
            </div>

            <AccountManager
                isOpen={isAccountManagerOpen}
                onClose={() => setIsAccountManagerOpen(false)}
            />
        </header>
    );
};
