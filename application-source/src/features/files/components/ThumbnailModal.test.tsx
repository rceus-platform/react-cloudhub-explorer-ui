/**
 * ThumbnailModal Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThumbnailModal } from "./ThumbnailModal";
import type { FileItem } from "../types";

// Mock useAuth
vi.mock("../../../hooks/useAuth", () => ({
    useAuth: () => ({ token: "mock-token" }),
}));

describe("ThumbnailModal Component", () => {
    const mockFile: FileItem = { name: "Video.mp4", type: "file", providers: ["gdrive"], ids: { gdrive: "1" }, duration: 100 };
    const mockOnClose = vi.fn();
    const mockOnUpdate = vi.fn();

    it("renders correctly when open", () => {
        render(<ThumbnailModal isOpen={true} file={mockFile} provider="gdrive" fileId="1" initialTimestamp={0} onClose={mockOnClose} onUpdate={mockOnUpdate} />);
        expect(screen.getByText("Edit Thumbnail")).toBeDefined();
    });

    it("switches to upload mode", () => {
        render(<ThumbnailModal isOpen={true} file={mockFile} provider="gdrive" fileId="1" initialTimestamp={0} onClose={mockOnClose} onUpdate={mockOnUpdate} />);
        fireEvent.click(screen.getByText(/Upload/i));
        expect(screen.getByText(/Click or drag to upload/i)).toBeDefined();
    });
});
