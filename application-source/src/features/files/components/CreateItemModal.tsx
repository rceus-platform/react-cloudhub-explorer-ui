/**
 * CreateItemModal Component
 *
 * Responsibilities:
 * - Provide a unified creation modal for: new folder, text file, and file upload
 * - Read modal state from the global Zustand store
 * - Call item service APIs and notify parent on success via callback
 *
 * Boundaries:
 * - Delegates API calls to itemService functions
 * - Does not handle navigation or selection state
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderPlus, FileText, Upload, File } from "lucide-react";
import { useFileStore } from "../../../store/useFileStore";
import { createFolder, createTextFile, uploadFile } from "../services/itemService";

interface CreateItemModalProps {
    /** Current parent folder ID (null for root) */
    parentId: string | null;
    /** Called after a successful creation so parent can refresh */
    onCreated?: () => void;
}

type Mode = "folder" | "text" | "upload";

/** Tabbed creation modal for folder, text file, and file upload */
export const CreateItemModal: React.FC<CreateItemModalProps> = ({ parentId, onCreated }) => {
    const { modals, closeCreateFolder, closeCreateTextFile, closeUploadFile } = useFileStore();

    const isOpen = modals.createFolder || modals.createTextFile || modals.uploadFile;
    const initialMode: Mode = modals.uploadFile ? "upload" : modals.createTextFile ? "text" : "folder";

    const [mode, setMode] = useState<Mode>(initialMode);
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setName("");
            setContent("");
            setSelectedFile(null);
            setError(null);
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleClose = () => {
        closeCreateFolder();
        closeCreateTextFile();
        closeUploadFile();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() && mode !== "upload") {
            setError("Name is required");
            return;
        }
        setSaving(true);
        setError(null);

        try {
            if (mode === "folder") {
                await createFolder({ name: name.trim(), parent_id: parentId });
            } else if (mode === "text") {
                await createTextFile({ name: name.trim(), content, parent_id: parentId });
            } else if (mode === "upload" && selectedFile) {
                await uploadFile(selectedFile, parentId);
            } else {
                setError("Please select a file to upload");
                return;
            }
            handleClose();
            onCreated?.();
        } catch (_err) {
            setError("Creation failed. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setSelectedFile(file);
            setName(file.name);
        }
    };

    const TABS: { value: Mode; icon: React.ElementType; label: string }[] = [
        { value: "folder", icon: FolderPlus, label: "Folder" },
        { value: "text", icon: FileText, label: "Text File" },
        { value: "upload", icon: Upload, label: "Upload" },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(8px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={(e) => e.target === e.currentTarget && handleClose()}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        id="create-item-modal"
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
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Create New</h3>
                            <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px" }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{
                            display: "flex", gap: "4px", marginBottom: "24px",
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: "12px", padding: "4px",
                        }}>
                            {TABS.map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    id={`create-tab-${value}`}
                                    onClick={() => { setMode(value); setError(null); }}
                                    style={{
                                        flex: 1, padding: "8px",
                                        borderRadius: "9px",
                                        border: "none",
                                        background: mode === value ? "rgba(255,255,255,0.08)" : "transparent",
                                        color: mode === value ? "var(--text-primary)" : "var(--text-secondary)",
                                        cursor: "pointer", fontSize: "12px", fontWeight: 600,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <Icon size={13} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Name Input */}
                            {mode !== "upload" && (
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, letterSpacing: "0.3px", display: "block", marginBottom: "6px" }}>
                                        {mode === "folder" ? "Folder Name" : "File Name"}
                                    </label>
                                    <input
                                        ref={nameInputRef}
                                        id="create-item-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={mode === "folder" ? "My Folder" : "document.txt"}
                                        style={{
                                            width: "100%", background: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
                                            padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px",
                                            outline: "none", boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                            )}

                            {/* Text Content */}
                            {mode === "text" && (
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, letterSpacing: "0.3px", display: "block", marginBottom: "6px" }}>
                                        Content
                                    </label>
                                    <textarea
                                        id="create-text-content"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Enter file content..."
                                        rows={6}
                                        style={{
                                            width: "100%", background: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
                                            padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px",
                                            outline: "none", resize: "vertical", fontFamily: "monospace",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                            )}

                            {/* File Upload Drop Zone */}
                            {mode === "upload" && (
                                <div
                                    id="upload-drop-zone"
                                    onDrop={handleDrop}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${dragOver ? "var(--accent-color)" : "rgba(255,255,255,0.12)"}`,
                                        borderRadius: "12px",
                                        padding: "32px",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        marginBottom: "16px",
                                        background: dragOver ? "rgba(var(--accent-rgb),0.05)" : "rgba(255,255,255,0.02)",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <input
                                        ref={fileInputRef}
                                        id="upload-file-input"
                                        type="file"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) { setSelectedFile(f); setName(f.name); }
                                        }}
                                    />
                                    {selectedFile ? (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                            <File size={20} style={{ color: "var(--accent-color)" }} />
                                            <div>
                                                <div style={{ fontSize: "13px", fontWeight: 600 }}>{selectedFile.name}</div>
                                                <div style={{ fontSize: "11px", opacity: 0.4, marginTop: "2px" }}>
                                                    {(selectedFile.size / 1_000_000).toFixed(2)} MB
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={28} style={{ opacity: 0.3, marginBottom: "8px" }} />
                                            <div style={{ fontSize: "13px", opacity: 0.6 }}>
                                                Drop a file here or <span style={{ color: "var(--accent-color)" }}>click to browse</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {error && (
                                <p style={{ color: "#ff6b6b", fontSize: "12px", margin: "0 0 12px" }}>{error}</p>
                            )}

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button type="button" onClick={handleClose} className="premium-button secondary" style={{ padding: "10px 20px" }}>
                                    Cancel
                                </button>
                                <button
                                    id="create-item-submit-btn"
                                    type="submit"
                                    disabled={saving}
                                    className="premium-button"
                                    style={{ padding: "10px 24px", opacity: saving ? 0.6 : 1 }}
                                >
                                    {saving ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
