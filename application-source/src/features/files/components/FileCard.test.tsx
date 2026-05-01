/**
 * FileCard Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileCard } from "./FileCard";
import type { FileItem } from "../types";
// Mock react-icons
vi.mock("react-icons/fa", () => ({
    FaFolder: () => <div data-testid="folder-icon" />,
    FaPlay: () => <div data-testid="play-icon" />,
}));

// Mock useFileThumbnail to avoid AuthContext dependency
vi.mock("../hooks/useFileThumbnail", () => ({
    useFileThumbnail: vi.fn(() => ({
        provider: "gdrive",
        isImage: false,
        thumbnailUrl: null,
        placeholderUrl: "placeholder.png",
        isGenerating: false
    }))
}));

describe("FileCard Component", () => {
    const mockOnClick = vi.fn();

    it("renders folder correctly", () => {
        const folder: FileItem = {
            name: "My Folder",
            type: "folder",
            providers: [],
            ids: {},
        };

        render(<FileCard file={folder} onClick={mockOnClick} />);
        expect(screen.getByText("My Folder")).toBeDefined();
    });

    it("renders file with duration and size", () => {
        const file: FileItem = {
            name: "Video.mp4",
            type: "file",
            providers: ["gdrive"],
            ids: { gdrive: "1" },
            size: 1024 * 1024,
            duration: 125,
        };

        render(<FileCard file={file} onClick={mockOnClick} />);
        expect(screen.getByText("Video.mp4")).toBeDefined();
        expect(screen.getByText("2:05")).toBeDefined();
    });

    it("calls onClick when clicked", () => {
        const folder: FileItem = { name: "Folder", type: "folder", providers: [], ids: {} };
        render(<FileCard file={folder} onClick={mockOnClick} />);
        fireEvent.click(screen.getByText("Folder"));
        expect(mockOnClick).toHaveBeenCalled();
    });
});
