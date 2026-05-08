/**
 * ShareModal Component
 *
 * Responsibilities:
 * - Generate a unique share link for a file or folder
 * - Allow configuring permission (view/edit), expiry, and password
 * - Display the generated link with a one-click copy action
 *
 * Boundaries:
 * - Receives itemId from the global Zustand store (opened via openShareModal)
 * - Delegates API call to createShareLink in itemService
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link, Copy, Check, Lock, Eye, Edit3, Clock } from "lucide-react";
import { useFileStore } from "../../../store/useFileStore";
import { createShareLink } from "../services/itemService";

/** Premium share link generator with expiry and password controls */
export const ShareModal: React.FC = () => {
    const { modals, closeShareModal } = useFileStore();
    const { open, itemId } = modals.shareModal;

    const [permission, setPermission] = useState<"view" | "edit">("view");
    const [expiresAt, setExpiresAt] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [generating, setGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!itemId) return;
        setGenerating(true);
        setError(null);
        try {
            const link = await createShareLink({
                item_id: itemId,
                permission,
                expires_at: expiresAt
                    ? new Date(expiresAt).toISOString()
                    : null,
                password: password || null,
            });
            const base = window.location.origin;
            setGeneratedUrl(`${base}${link.url}`);
        } catch (_err) {
            setError("Failed to generate share link. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!generatedUrl) return;
        await navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        closeShareModal();
        // Reset state after animation
        setTimeout(() => {
            setGeneratedUrl(null);
            setExpiresAt("");
            setPassword("");
            setPermission("view");
            setError(null);
        }, 300);
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={(e) => e.target === e.currentTarget && handleClose()}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        id="share-modal"
                        style={{
                            background: "var(--surface-color)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "20px",
                            padding: "28px",
                            width: "480px",
                            boxShadow: "var(--shadow-premium)",
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{
                                    width: "32px", height: "32px", borderRadius: "8px",
                                    background: "rgba(var(--accent-rgb),0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Link size={16} style={{ color: "var(--accent-color)" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Share Link</h3>
                                    <p style={{ margin: 0, fontSize: "12px", opacity: 0.4 }}>Generate a secure link</p>
                                </div>
                            </div>
                            <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px" }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Permission Selector */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, letterSpacing: "0.3px", display: "block", marginBottom: "8px" }}>
                                Permission
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {([
                                    { value: "view", icon: Eye, label: "View only" },
                                    { value: "edit", icon: Edit3, label: "Can edit" },
                                ] as const).map(({ value, icon: Icon, label }) => (
                                    <button
                                        key={value}
                                        id={`share-permission-${value}`}
                                        onClick={() => setPermission(value)}
                                        style={{
                                            flex: 1, padding: "10px", borderRadius: "10px",
                                            border: "1px solid",
                                            borderColor: permission === value ? "var(--accent-color)" : "rgba(255,255,255,0.08)",
                                            background: permission === value ? "rgba(var(--accent-rgb),0.12)" : "rgba(255,255,255,0.03)",
                                            color: permission === value ? "var(--accent-color)" : "var(--text-secondary)",
                                            cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "8px",
                                            fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
                                        }}
                                    >
                                        <Icon size={14} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expiry */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, letterSpacing: "0.3px", display: "block", marginBottom: "8px" }}>
                                <Clock size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                                Expires At (optional)
                            </label>
                            <input
                                id="share-expires-at"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                style={{
                                    width: "100%",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "10px",
                                    padding: "10px 12px",
                                    color: "var(--text-primary)",
                                    fontSize: "13px",
                                    outline: "none",
                                    colorScheme: "dark",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, letterSpacing: "0.3px", display: "block", marginBottom: "8px" }}>
                                <Lock size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                                Password Protection (optional)
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="share-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Leave blank for public access"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: "100%",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "10px",
                                        padding: "10px 40px 10px 12px",
                                        color: "var(--text-primary)",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                />
                                <button
                                    onClick={() => setShowPassword((p) => !p)}
                                    style={{
                                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "var(--text-secondary)", padding: 0, display: "flex",
                                    }}
                                >
                                    <Eye size={14} />
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p style={{ color: "#ff6b6b", fontSize: "12px", margin: "0 0 16px" }}>{error}</p>
                        )}

                        {/* Generated Link */}
                        <AnimatePresence>
                            {generatedUrl && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ marginBottom: "16px", overflow: "hidden" }}
                                >
                                    <div style={{
                                        display: "flex", gap: "8px", alignItems: "center",
                                        background: "rgba(var(--accent-rgb),0.08)",
                                        border: "1px solid rgba(var(--accent-rgb),0.2)",
                                        borderRadius: "10px", padding: "12px",
                                    }}>
                                        <span style={{ flex: 1, fontSize: "12px", color: "var(--accent-color)", wordBreak: "break-all", fontFamily: "monospace" }}>
                                            {generatedUrl}
                                        </span>
                                        <button
                                            id="share-copy-btn"
                                            onClick={handleCopy}
                                            className="premium-button"
                                            style={{ padding: "6px 12px", flexShrink: 0, gap: "4px" }}
                                        >
                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button onClick={handleClose} className="premium-button secondary" style={{ padding: "10px 20px" }}>
                                {generatedUrl ? "Close" : "Cancel"}
                            </button>
                            {!generatedUrl && (
                                <button
                                    id="share-generate-btn"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="premium-button"
                                    style={{ padding: "10px 24px", opacity: generating ? 0.6 : 1 }}
                                >
                                    {generating ? "Generating..." : "Generate Link"}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
