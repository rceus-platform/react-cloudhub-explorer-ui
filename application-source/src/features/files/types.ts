/**
 * Files Feature Types
 *
 * Responsibilities:
 * - Define data structures for files and folders
 * - Provide type safety for API responses and component props
 *
 * Boundaries:
 * - Does not include player-specific or global application types
 */

/** Metadata for a file or folder in the cloud storage */
export interface FileItem {
    name: string;
    type: "file" | "folder";
    providers: string[];
    ids: Record<string, string>;
    size?: number;
    progress_percentage?: number;
    duration?: number;
    width?: number | null;
    height?: number | null;
    updated_at?: number;
    is_generating?: boolean;
}

/** API response structure for file listing */
export interface FilesResponse {
    folder_id: string;
    files: FileItem[];
}

/** State for folder navigation history */
export interface FolderState {
    id: string;
    name: string;
}

/** Response from thumbnail update operation */
export interface UpdateThumbnailResponse {
    success: boolean;
    updated_at: number;
}

// ---------------------------------------------------------------------------
// New unified FileSystemItem types
// ---------------------------------------------------------------------------

/** A tag associated with a file or folder */
export interface Tag {
    id: number;
    name: string;
}

/** A share link record */
export interface ShareLink {
    hash: string;
    permission: "view" | "edit";
    expires_at: string | null;
    url: string;
}

/** Unified file/folder record from the /items API */
export interface FileSystemItem {
    id: string;
    name: string;
    is_folder: boolean;
    parent_id: string | null;
    provider: string;
    provider_id: string | null;
    mime_type: string | null;
    size: number | null;
    extension: string | null;
    tags: Tag[];
    created_at: string;
    updated_at: string;
}

/** Request to move items */
export interface MoveRequest {
    item_ids: string[];
    destination_id: string | null;
}

/** Request to copy items */
export interface CopyRequest {
    item_ids: string[];
    destination_id: string | null;
}

/** Request to rename an item */
export interface RenameRequest {
    name: string;
}

/** Request to delete items */
export interface DeleteRequest {
    item_ids: string[];
}

/** Request to update tags */
export interface TagUpdateRequest {
    tags: string[];
}

/** Request to create a share link */
export interface ShareLinkCreateRequest {
    item_id: string;
    permission?: "view" | "edit";
    expires_at?: string | null;
    password?: string | null;
}

/** Request to create a folder */
export interface FolderCreateRequest {
    name: string;
    parent_id?: string | null;
}

/** Request to create a text file */
export interface TextFileCreateRequest {
    name: string;
    content: string;
    parent_id?: string | null;
}
