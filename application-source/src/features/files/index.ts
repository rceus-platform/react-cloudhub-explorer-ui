/**
 * Files Feature Entry Point
 *
 * Responsibilities:
 * - Export feature-specific components, hooks, and types
 * - Act as the public interface for the files domain
 *
 * Boundaries:
 * - Does not export internal implementation details of components
 */

export * from "./components/FileLibrary";
export * from "./components/FileCard";
export * from "./components/ThumbnailModal";
export * from "./types";
export * from "./hooks/useFiles";
