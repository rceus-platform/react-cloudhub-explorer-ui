/**
 * SearchFilterBar Component
 *
 * Responsibilities:
 * - Render a premium search input with live debouncing
 * - Provide an advanced filter dropdown (tags, type, size, date, sort)
 * - Sync all state changes to the global Zustand file store
 *
 * Boundaries:
 * - Does not fetch data; delegates to useFileStore and the parent hook
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFileStore } from "../../../store/useFileStore";
import type { SortField, TagLogic } from "../../../store/useFileStore";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: "name", label: "Name" },
    { value: "size", label: "Size" },
    { value: "modified_at", label: "Date Modified" },
];

/** Premium search bar with collapsible advanced filters */
export const SearchFilterBar: React.FC = () => {
    const { filter, setFilter, clearFilter, sort, setSort } = useFileStore();
    const [panelOpen, setPanelOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(filter.search);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Debounce search input → store
    const handleSearchChange = useCallback(
        (value: string) => {
            setLocalSearch(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                setFilter({ search: value });
            }, 150);
        },
        [setFilter]
    );

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setPanelOpen(false);
            }
        };
        if (panelOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [panelOpen]);

    const hasActiveFilters =
        filter.search ||
        filter.tags.length > 0 ||
        filter.mimeType ||
        filter.minSize !== null ||
        filter.maxSize !== null ||
        filter.dateFrom ||
        filter.dateTo;

    const handleTagInput = (value: string) => {
        const tags = value
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
        setFilter({ tags });
    };

    return (
        <div ref={panelRef} style={{ position: "relative", display: "flex", gap: "8px" }}>
            {/* Search Input */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    padding: "0 12px",
                    height: "36px",
                    minWidth: "220px",
                    transition: "border-color 0.2s",
                }}
            >
                <Search size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
                <input
                    id="search-filter-input"
                    type="text"
                    placeholder="Search files..."
                    value={localSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            // Flush immediately — cancel pending debounce and commit now
                            if (debounceRef.current) clearTimeout(debounceRef.current);
                            setFilter({ search: localSearch });
                        }
                    }}
                    style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        width: "100%",
                    }}
                />
                {localSearch && (
                    <button
                        onClick={() => handleSearchChange("")}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            padding: 0,
                            display: "flex",
                        }}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Filter Toggle Button */}
            <button
                id="filter-toggle-btn"
                onClick={() => setPanelOpen((p) => !p)}
                className="premium-button secondary"
                style={{
                    padding: "8px 12px",
                    height: "36px",
                    gap: "6px",
                    position: "relative",
                }}
                title="Advanced filters"
            >
                <SlidersHorizontal size={14} />
                <ChevronDown
                    size={12}
                    style={{
                        transform: panelOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        opacity: 0.6,
                    }}
                />
                {hasActiveFilters && (
                    <div
                        style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "var(--accent-color)",
                        }}
                    />
                )}
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <button
                    onClick={() => {
                        clearFilter();
                        setLocalSearch("");
                    }}
                    className="premium-button secondary"
                    style={{ padding: "8px", height: "36px", width: "36px", justifyContent: "center" }}
                    title="Clear all filters"
                >
                    <X size={14} />
                </button>
            )}

            {/* Advanced Filter Panel */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            right: 0,
                            zIndex: 100,
                            background: "var(--surface-color)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "16px",
                            padding: "20px",
                            width: "360px",
                            boxShadow: "var(--shadow-premium)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                        }}
                    >
                        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", opacity: 0.4, textTransform: "uppercase" }}>
                            Advanced Filters
                        </div>

                        {/* Tags */}
                        <FilterField label="Tags (comma-separated)">
                            <input
                                id="filter-tags-input"
                                type="text"
                                placeholder="e.g. work, urgent"
                                defaultValue={filter.tags.join(", ")}
                                onBlur={(e) => handleTagInput(e.target.value)}
                                style={inputStyle}
                            />
                            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                                {(["or", "and"] as TagLogic[]).map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => setFilter({ tagLogic: l })}
                                        style={{
                                            padding: "4px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid",
                                            borderColor: filter.tagLogic === l ? "var(--accent-color)" : "rgba(255,255,255,0.1)",
                                            background: filter.tagLogic === l ? "rgba(var(--accent-rgb),0.15)" : "transparent",
                                            color: filter.tagLogic === l ? "var(--accent-color)" : "var(--text-secondary)",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                        }}
                                    >
                                        {l.toUpperCase()}
                                    </button>
                                ))}
                                <span style={{ fontSize: "11px", opacity: 0.4, alignSelf: "center" }}>logic</span>
                            </div>
                        </FilterField>

                        {/* MIME Type */}
                        <FilterField label="File Type">
                            <select
                                id="filter-mime-type"
                                value={filter.mimeType}
                                onChange={(e) => setFilter({ mimeType: e.target.value })}
                                style={{ ...inputStyle, cursor: "pointer" }}
                            >
                                <option value="">All types</option>
                                <option value="video/">Video</option>
                                <option value="image/">Image</option>
                                <option value="audio/">Audio</option>
                                <option value="text/">Text</option>
                                <option value="application/pdf">PDF</option>
                            </select>
                        </FilterField>

                        {/* Size Range */}
                        <FilterField label="Size Range (MB)">
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                    id="filter-min-size"
                                    type="number"
                                    placeholder="Min"
                                    min={0}
                                    value={filter.minSize !== null ? filter.minSize / 1_000_000 : ""}
                                    onChange={(e) =>
                                        setFilter({
                                            minSize: e.target.value ? Math.round(parseFloat(e.target.value) * 1_000_000) : null,
                                        })
                                    }
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                                <input
                                    id="filter-max-size"
                                    type="number"
                                    placeholder="Max"
                                    min={0}
                                    value={filter.maxSize !== null ? filter.maxSize / 1_000_000 : ""}
                                    onChange={(e) =>
                                        setFilter({
                                            maxSize: e.target.value ? Math.round(parseFloat(e.target.value) * 1_000_000) : null,
                                        })
                                    }
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                            </div>
                        </FilterField>

                        {/* Date Range */}
                        <FilterField label="Date Modified">
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                    id="filter-date-from"
                                    type="date"
                                    value={filter.dateFrom}
                                    onChange={(e) => setFilter({ dateFrom: e.target.value })}
                                    style={{ ...inputStyle, flex: 1, colorScheme: "dark" }}
                                />
                                <input
                                    id="filter-date-to"
                                    type="date"
                                    value={filter.dateTo}
                                    onChange={(e) => setFilter({ dateTo: e.target.value })}
                                    style={{ ...inputStyle, flex: 1, colorScheme: "dark" }}
                                />
                            </div>
                        </FilterField>

                        {/* Sort */}
                        <FilterField label="Sort By">
                            <div style={{ display: "flex", gap: "8px" }}>
                                <select
                                    id="filter-sort-by"
                                    value={sort.field}
                                    onChange={(e) => setSort({ ...sort, field: e.target.value as SortField })}
                                    style={{ ...inputStyle, flex: 1, cursor: "pointer" }}
                                >
                                    {SORT_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <button
                                    id="filter-sort-order"
                                    onClick={() =>
                                        setSort({ ...sort, order: sort.order === "asc" ? "desc" : "asc" })
                                    }
                                    style={{
                                        ...inputStyle,
                                        cursor: "pointer",
                                        padding: "0 12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontWeight: 600,
                                        fontSize: "12px",
                                        width: "auto",
                                    }}
                                >
                                    {sort.order === "asc" ? "↑ ASC" : "↓ DESC"}
                                </button>
                            </div>
                        </FilterField>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FilterField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, letterSpacing: "0.3px" }}>
            {label}
        </label>
        {children}
    </div>
);

const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    padding: "8px 10px",
    color: "var(--text-primary)",
    fontSize: "13px",
    outline: "none",
    width: "100%",
};
