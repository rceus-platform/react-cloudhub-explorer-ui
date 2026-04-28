/**
 * Formatters Utility
 *
 * Responsibilities:
 * - Provide standardized formatting for file sizes and durations
 * - Ensure consistent string representation across the UI
 *
 * Boundaries:
 * - Does not handle localization or complex date formatting
 */

/** Format bytes into human-readable strings (KB, MB, GB) */
export const formatSize = (bytes: number): string => {
    if (!bytes || bytes < 0) return "0 KB";
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
};

/** Format seconds into HH:MM:SS or MM:SS strings */
export const formatDuration = (duration: number): string => {
    if (!duration || duration < 0) return "";
    const secs = Math.floor(duration);
    if (secs >= 3600) {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
};
