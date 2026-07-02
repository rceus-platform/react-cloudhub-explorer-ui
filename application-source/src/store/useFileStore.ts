/**
 * useFileStore - Global Zustand Store
 *
 * Responsibilities:
 * - Track multi-selection state for file/folder items
 * - Store current sort and filter configuration
 * - Manage UI modal open/close state (tag manager, share modal, create dialog)
 * - Persist view mode (grid/list) and column count
 *
 * Boundaries:
 * - Does not handle data fetching (delegated to React Query hooks)
 * - Does not own navigation state (delegated to React Router)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortField = "name" | "size" | "modified_at";
export type SortOrder = "asc" | "desc";
export type TagLogic = "and" | "or";

export interface SortConfig {
    field: SortField;
    order: SortOrder;
}

export interface FilterConfig {
    search: string;
    tags: string[];
    tagLogic: TagLogic;
    mimeType: string;
    minSize: number | null;
    maxSize: number | null;
    dateFrom: string;
    dateTo: string;
}

export interface ModalState {
    tagManager: { open: boolean; itemId: string | null; fileName?: string; provider?: string };
    shareModal: { open: boolean; itemId: string | null };
    createFolder: boolean;
    createTextFile: boolean;
    uploadFile: boolean;
}

export interface FileStoreState {
    // Multi-selection
    selectedIds: Set<string>;
    toggleSelect: (id: string) => void;
    selectAll: (ids: string[]) => void;
    clearSelection: () => void;

    // Sort configuration
    sort: SortConfig;
    setSort: (sort: SortConfig) => void;

    // Filter configuration
    filter: FilterConfig;
    setFilter: (partial: Partial<FilterConfig>) => void;
    clearFilter: () => void;

    // View preferences (persisted to localStorage)
    columnCount: number;
    setColumnCount: (count: number) => void;

    // Modals
    modals: ModalState;
    openTagManager: (itemId: string, fileName?: string, provider?: string) => void;
    closeTagManager: () => void;
    openShareModal: (itemId: string) => void;
    closeShareModal: () => void;
    openCreateFolder: () => void;
    closeCreateFolder: () => void;
    openCreateTextFile: () => void;
    closeCreateTextFile: () => void;
    openUploadFile: () => void;
    closeUploadFile: () => void;
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const defaultFilter: FilterConfig = {
    search: "",
    tags: [],
    tagLogic: "or",
    mimeType: "",
    minSize: null,
    maxSize: null,
    dateFrom: "",
    dateTo: "",
};

const defaultModals: ModalState = {
    tagManager: { open: false, itemId: null },
    shareModal: { open: false, itemId: null },
    createFolder: false,
    createTextFile: false,
    uploadFile: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFileStore = create<FileStoreState>()(
    persist(
        (set) => ({
            // Selection
            selectedIds: new Set(),
            toggleSelect: (id) =>
                set((state) => {
                    const next = new Set(state.selectedIds);
                    if (next.has(id)) {
                        next.delete(id);
                    } else {
                        next.add(id);
                    }
                    return { selectedIds: next };
                }),
            selectAll: (ids) => set({ selectedIds: new Set(ids) }),
            clearSelection: () => set({ selectedIds: new Set() }),

            // Sort
            sort: { field: "name", order: "asc" },
            setSort: (sort) => set({ sort }),

            // Filter
            filter: { ...defaultFilter },
            setFilter: (partial) =>
                set((state) => ({ filter: { ...state.filter, ...partial } })),
            clearFilter: () => set({ filter: { ...defaultFilter } }),

            // View preferences
            columnCount: 6,
            setColumnCount: (count) => set({ columnCount: count }),

            // Modals
            modals: { ...defaultModals },
            openTagManager: (itemId, fileName, provider) =>
                set((state) => ({
                    modals: { ...state.modals, tagManager: { open: true, itemId, fileName, provider } },
                })),
            closeTagManager: () =>
                set((state) => ({
                    modals: { ...state.modals, tagManager: { open: false, itemId: null } },
                })),
            openShareModal: (itemId) =>
                set((state) => ({
                    modals: { ...state.modals, shareModal: { open: true, itemId } },
                })),
            closeShareModal: () =>
                set((state) => ({
                    modals: { ...state.modals, shareModal: { open: false, itemId: null } },
                })),
            openCreateFolder: () =>
                set((state) => ({ modals: { ...state.modals, createFolder: true } })),
            closeCreateFolder: () =>
                set((state) => ({ modals: { ...state.modals, createFolder: false } })),
            openCreateTextFile: () =>
                set((state) => ({ modals: { ...state.modals, createTextFile: true } })),
            closeCreateTextFile: () =>
                set((state) => ({ modals: { ...state.modals, createTextFile: false } })),
            openUploadFile: () =>
                set((state) => ({ modals: { ...state.modals, uploadFile: true } })),
            closeUploadFile: () =>
                set((state) => ({ modals: { ...state.modals, uploadFile: false } })),
        }),
        {
            name: "cloudhub-file-store",
            // Only persist view preferences; reset transient state on page load
            partialize: (state) => ({
                columnCount: state.columnCount,
                sort: state.sort,
            }),
        }
    )
);
