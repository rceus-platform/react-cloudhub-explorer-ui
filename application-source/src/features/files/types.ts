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
