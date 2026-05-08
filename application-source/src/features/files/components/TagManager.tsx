/**
 * TagManager Component
 *
 * Responsibilities:
 * - Display and edit tags for a specific file or folder
 * - Allow adding new tags and removing existing ones
 * - Persist changes via the /items/{id}/tags API endpoint
 *
 * Boundaries:
 * - Receives itemId from the global Zustand store (opened via openTagManager)
 * - Does not handle navigation or file streaming
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag as TagIcon, Plus } from "lucide-react";
import { useFileStore } from "../../../store/useFileStore";
import { updateTags } from "../services/itemService";

/** Pill-style tag editor modal */
export const TagManager: React.FC = () => {
    const { modals, closeTagManager } = useFileStore();
    const { open, itemId } = modals.tagManager;

    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setTags([]);
            setInputValue("");
            setError(null);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const addTag = (value: string) => {
        const normalized = value.trim().toLowerCase();
        if (normalized && !tags.includes(normalized)) {
            setTags((prev) => [...prev, normalized]);
        }
        setInputValue("");
    };

    const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            setTags((prev) => prev.slice(0, -1));
        }
    };

    const handleSave = async () => {
        if (!itemId) return;
        setSaving(true);
        setError(null);
        try {
            await updateTags(itemId, { tags });
            closeTagManager();
        } catch (_err) {
            setError("Failed to save tags. Please try again.");
        } finally {
            setSaving(false);
        }
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
                    onClick={(e) => e.target === e.currentTarget && closeTagManager()}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        id="tag-manager-modal"
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{
                                    width: "32px", height: "32px", borderRadius: "8px",
                                    background: "rgba(var(--accent-rgb),0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <TagIcon size={16} style={{ color: "var(--accent-color)" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Manage Tags</h3>
                                    <p style={{ margin: 0, fontSize: "12px", opacity: 0.4 }}>Press Enter or comma to add</p>
                                </div>
                            </div>
                            <button
                                onClick={closeTagManager}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tag Input Area */}
                        <div
                            onClick={() => inputRef.current?.focus()}
                            style={{
                                minHeight: "72px",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "12px",
                                padding: "10px",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                                alignItems: "center",
                                cursor: "text",
                                marginBottom: "16px",
                            }}
                        >
                            {tags.map((tag) => (
                                <motion.span
                                    key={tag}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        background: "rgba(var(--accent-rgb),0.15)",
                                        border: "1px solid rgba(var(--accent-rgb),0.3)",
                                        color: "var(--accent-color)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                    }}
                                >
                                    {tag}
                                    <button
                                        id={`remove-tag-${tag}`}
                                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            padding: 0, color: "currentColor", opacity: 0.6, display: "flex",
                                        }}
                                    >
                                        <X size={10} />
                                    </button>
                                </motion.span>
                            ))}
                            <input
                                ref={inputRef}
                                id="tag-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={() => inputValue && addTag(inputValue)}
                                placeholder={tags.length === 0 ? "Add tags..." : ""}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "13px",
                                    minWidth: "80px",
                                    flex: 1,
                                }}
                            />
                        </div>

                        {/* Quick suggestions */}
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
                            {["work", "urgent", "personal", "archive", "review"].map((s) =>
                                !tags.includes(s) ? (
                                    <button
                                        key={s}
                                        id={`tag-suggestion-${s}`}
                                        onClick={() => setTags((prev) => [...prev, s])}
                                        style={{
                                            padding: "4px 10px", borderRadius: "20px",
                                            background: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            color: "var(--text-secondary)", fontSize: "11px", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "4px",
                                        }}
                                    >
                                        <Plus size={10} />
                                        {s}
                                    </button>
                                ) : null
                            )}
                        </div>

                        {error && (
                            <p style={{ color: "#ff6b6b", fontSize: "12px", margin: "0 0 12px" }}>{error}</p>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button onClick={closeTagManager} className="premium-button secondary" style={{ padding: "10px 20px" }}>
                                Cancel
                            </button>
                            <button
                                id="tag-manager-save-btn"
                                onClick={handleSave}
                                disabled={saving}
                                className="premium-button"
                                style={{ padding: "10px 24px", opacity: saving ? 0.6 : 1 }}
                            >
                                {saving ? "Saving..." : "Save Tags"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
