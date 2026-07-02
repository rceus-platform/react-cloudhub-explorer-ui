/**
 * SyncToolsMenu Component
 *
 * Responsibilities:
 * - Provide a unified dropdown for sync and maintenance operations
 * - Show status indicator when operations are in progress
 *
 * Boundaries:
 * - Delegates actual sync logic to useSyncOperations hook
 */

import React, { useState, useRef, useEffect } from "react";
import { FiRefreshCw, FiHardDrive, FiSettings, FiAlertCircle } from "react-icons/fi";
import { useSyncOperations } from "../hooks/useSyncOperations";
import { toast } from "react-hot-toast";

export const SyncToolsMenu: React.FC<{ currentFolderId: string }> = ({ currentFolderId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const {
        isAnySyncing,
        refreshFolder,
        incrementalSync,
        deepSync,
        recalculateStats,
        repairThumbnails,
    } = useSyncOperations();

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRefreshFolder = async () => {
        setIsOpen(false);
        const ok = await refreshFolder(currentFolderId);
        if (ok) {
            toast.success("Folder refreshed");
        } else {
            toast.error("Failed to refresh folder");
        }
    };

    const handleIncrementalSync = async () => {
        setIsOpen(false);
        const result = await incrementalSync();
        if (result.success) {
            toast.success(`Synced ${result.total_synced || 0} accounts`);
        } else {
            toast.error("Incremental sync failed");
        }
    };

    const handleDeepSync = async () => {
        setIsOpen(false);
        const result = await deepSync();
        if (result.rate_limited) {
            toast.error("Deep sync rate limited (6h window)");
        } else if (result.success) {
            toast.success(result.message || "Deep sync completed");
        } else {
            toast.error(result.message || "Deep sync failed");
        }
    };

    const handleRecalcStats = async () => {
        setIsOpen(false);
        // Show loading toast
        const id = toast.loading("Recalculating folder sizes...");
        const ok = await recalculateStats();
        if (ok) {
            toast.success("Folder statistics updated", { id });
        } else {
            toast.error("Failed to recalculate statistics", { id });
        }
    };

    const handleRepairThumbnails = async () => {
        setIsOpen(false);
        const id = toast.loading("Enqueuing thumbnail repair...");
        const result = await repairThumbnails();
        if (result.success && result.queued !== undefined) {
            toast.success(`Enqueued ${result.queued} files for thumbnail regen`, { id });
        } else {
            toast.error("Thumbnail repair failed", { id });
        }
    };

    return (
        <div className="sync-tools-menu" ref={menuRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            {/* Main Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="premium-button secondary"
                style={{
                    padding: "8px 12px",
                    height: "36px",
                    gap: "6px",
                    opacity: isAnySyncing ? 0.7 : 1,
                    pointerEvents: isAnySyncing ? "none" : "auto",
                    display: "flex",
                    alignItems: "center",
                }}
                title={isAnySyncing ? "Sync in progress..." : "Sync & Tools"}
            >
                {isAnySyncing && (
                    <span style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--accent-color)",
                        animation: "pulse 1.5s infinite"
                    }} />
                )}
                <span style={{ fontSize: "12px" }}>Sync & Tools</span>
                <span style={{ fontSize: "10px", opacity: 0.6 }}>▾</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "8px",
                        background: "rgba(30, 30, 35, 0.95)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                        minWidth: "220px",
                        zIndex: 1000,
                        padding: "6px",
                    }}
                >
                    {/* Sync Operations Section */}
                    <div style={{ padding: "6px 12px 4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                        Sync Operations
                    </div>
                    <button
                        onClick={handleRefreshFolder}
                        disabled={isAnySyncing}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            cursor: isAnySyncing ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            borderRadius: "8px",
                            opacity: isAnySyncing ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isAnySyncing) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <FiRefreshCw size={14} />
                        <span>Refresh This Folder</span>
                    </button>
                    <button
                        onClick={handleIncrementalSync}
                        disabled={isAnySyncing}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            cursor: isAnySyncing ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            borderRadius: "8px",
                            opacity: isAnySyncing ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isAnySyncing) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <FiRefreshCw size={14} />
                        <span>Sync All Accounts</span>
                    </button>
                    <button
                        onClick={handleDeepSync}
                        disabled={isAnySyncing}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            cursor: isAnySyncing ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            borderRadius: "8px",
                            opacity: isAnySyncing ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isAnySyncing) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <FiHardDrive size={14} />
                        <span>Full Account Re-index</span>
                        <FiAlertCircle size={10} style={{ marginLeft: "auto", opacity: 0.4 }} title="Rate limited to once per 6 hours" />
                    </button>

                    {/* Maintenance Section */}
                    <div style={{
                        marginTop: "4px",
                        paddingTop: "6px",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        padding: "6px 12px 4px",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "rgba(255,255,255,0.4)",
                        fontWeight: 600
                    }}>
                        Maintenance Tools
                    </div>
                    <button
                        onClick={handleRecalcStats}
                        disabled={isAnySyncing}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            cursor: isAnySyncing ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            borderRadius: "8px",
                            opacity: isAnySyncing ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isAnySyncing) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <FiSettings size={14} />
                        <span>Recalculate Statistics</span>
                    </button>
                    <button
                        onClick={handleRepairThumbnails}
                        disabled={isAnySyncing}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            cursor: isAnySyncing ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            borderRadius: "8px",
                            opacity: isAnySyncing ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isAnySyncing) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <FiSettings size={14} />
                        <span>Repair Thumbnails</span>
                    </button>
                </div>
            )}

            {/* CSS for pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};
