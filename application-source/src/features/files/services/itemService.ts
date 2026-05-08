/**
 * Item Service Module
 *
 * Responsibilities:
 * - Wrap all /items API calls with typed request/response interfaces
 * - Provide functions for CRUD operations, tagging, sharing, and creation
 *
 * Boundaries:
 * - Does not manage UI state or cache invalidation (handled in hooks/components)
 */

import { apiClient } from "../../../services/apiClient";
import type {
    CopyRequest,
    DeleteRequest,
    FileSystemItem,
    FolderCreateRequest,
    MoveRequest,
    RenameRequest,
    ShareLink,
    ShareLinkCreateRequest,
    TagUpdateRequest,
    TextFileCreateRequest,
} from "../types";

const BASE = "/items";

// ---------------------------------------------------------------------------
// Listing (with filter/sort query params)
// ---------------------------------------------------------------------------

export interface ListItemsParams {
    parent_id?: string | null;
    search?: string;
    tags?: string;
    logic?: "and" | "or";
    mime_type?: string;
    min_size?: number;
    max_size?: number;
    date_from?: string;
    date_to?: string;
    sort_by?: "name" | "size" | "modified_at";
    sort_order?: "asc" | "desc";
}

export const fetchItems = async (params: ListItemsParams = {}): Promise<FileSystemItem[]> => {
    const qs = new URLSearchParams();
    if (params.parent_id !== undefined && params.parent_id !== null)
        qs.set("parent_id", params.parent_id);
    if (params.search) qs.set("search", params.search);
    if (params.tags) qs.set("tags", params.tags);
    if (params.logic) qs.set("logic", params.logic);
    if (params.mime_type) qs.set("mime_type", params.mime_type);
    if (params.min_size !== undefined) qs.set("min_size", String(params.min_size));
    if (params.max_size !== undefined) qs.set("max_size", String(params.max_size));
    if (params.date_from) qs.set("date_from", params.date_from);
    if (params.date_to) qs.set("date_to", params.date_to);
    if (params.sort_by) qs.set("sort_by", params.sort_by);
    if (params.sort_order) qs.set("sort_order", params.sort_order);

    const url = `${BASE}/?${qs.toString()}`;
    return apiClient.get<FileSystemItem[]>(url);
};

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

export const moveItems = async (payload: MoveRequest): Promise<{ moved: string[] }> =>
    apiClient.post(`${BASE}/move`, payload);

export const copyItems = async (payload: CopyRequest): Promise<{ copied: FileSystemItem[] }> =>
    apiClient.post(`${BASE}/copy`, payload);

export const renameItem = async (itemId: string, payload: RenameRequest): Promise<FileSystemItem> =>
    apiClient.patch(`${BASE}/${itemId}/rename`, payload);

export const deleteItems = async (payload: DeleteRequest): Promise<{ deleted: string[] }> =>
    apiClient.delete(`${BASE}/remove`, payload);

// ---------------------------------------------------------------------------
// Tag Management
// ---------------------------------------------------------------------------

export const updateTags = async (
    itemId: string,
    payload: TagUpdateRequest
): Promise<FileSystemItem> => apiClient.put(`${BASE}/${itemId}/tags`, payload);

// ---------------------------------------------------------------------------
// Share Links
// ---------------------------------------------------------------------------

export const createShareLink = async (payload: ShareLinkCreateRequest): Promise<ShareLink> =>
    apiClient.post(`${BASE}/share`, payload);

// ---------------------------------------------------------------------------
// Folder / File Creation
// ---------------------------------------------------------------------------

export const createFolder = async (payload: FolderCreateRequest): Promise<FileSystemItem> =>
    apiClient.post(`${BASE}/folders`, payload);

export const createTextFile = async (payload: TextFileCreateRequest): Promise<FileSystemItem> =>
    apiClient.post(`${BASE}/files/text`, payload);

export const uploadFile = async (file: File, parentId?: string | null): Promise<FileSystemItem> => {
    const formData = new FormData();
    formData.append("file", file);
    const url = parentId ? `${BASE}/files/upload?parent_id=${parentId}` : `${BASE}/files/upload`;
    return apiClient.post(url, formData);
};
