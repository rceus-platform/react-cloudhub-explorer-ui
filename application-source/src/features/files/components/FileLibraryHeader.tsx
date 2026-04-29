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
import { Cloud, Grid, RefreshCw } from "lucide-react";
import type { FolderState } from "../types";
import { AccountManager } from "../../accounts/components/AccountManager";

interface FileLibraryHeaderProps {
    history: FolderState[];
    columnCount: number;
    onBreadcrumbClick: (index: number) => void;
    onColumnCountChange: (count: number) => void;
    onRefresh: () => void;
    isRefreshing?: boolean;
}

/** Ultra-minimalist header with focused navigation and controls */
export const FileLibraryHeader: React.FC<FileLibraryHeaderProps> = ({
    history, columnCount, onBreadcrumbClick, onColumnCountChange, onRefresh, isRefreshing
}) => {
    const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);

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

                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingRight: "24px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
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

                    <button
                        onClick={onRefresh}
                        className="premium-button secondary"
                        style={{
                            padding: "8px", height: "36px", width: "36px",
                            justifyContent: "center",
                            opacity: isRefreshing ? 0.5 : 1,
                            pointerEvents: isRefreshing ? "none" : "auto"
                        }}
                        title="Refresh cloud data"
                    >
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                    </button>

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
