/**
 * ThumbnailUpload Component Tests
 *
 * Responsibilities:
 * - Verify file selection via clicking the upload area
 * - Validate drag and drop event handling
 * - Test display of selected filename
 *
 * Boundaries:
 * - Does not test actual file upload persistence
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThumbnailUpload } from "./ThumbnailUpload";

/** Main test suite for the thumbnail file upload interface */
describe("ThumbnailUpload Component", () => {
    const mockOnFileSelect = vi.fn();

    it("renders default message when no file is selected", () => {
        render(<ThumbnailUpload selectedFile={null} onFileSelect={mockOnFileSelect} />);
        expect(screen.getByText("Click or drag to upload")).toBeDefined();
    });

    it("renders filename when a file is selected", () => {
        const file = new File([""], "test.jpg", { type: "image/jpeg" });
        render(<ThumbnailUpload selectedFile={file} onFileSelect={mockOnFileSelect} />);
        expect(screen.getByText("test.jpg")).toBeDefined();
    });

    it("handles file selection via input change", () => {
        const { container } = render(<ThumbnailUpload selectedFile={null} onFileSelect={mockOnFileSelect} />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File([""], "test.jpg", { type: "image/jpeg" });
        
        fireEvent.change(input, { target: { files: [file] } });
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it("handles drag and drop", () => {
        const { container } = render(<ThumbnailUpload selectedFile={null} onFileSelect={mockOnFileSelect} />);
        const dropZone = container.firstChild as HTMLElement;
        const file = new File([""], "test.jpg", { type: "image/jpeg" });
        
        const dragOverEvent = new MouseEvent("dragover", { bubbles: true });
        fireEvent(dropZone, dragOverEvent);
        expect(dropZone.style.borderColor).toBe("var(--accent-color)");

        const dropEvent = {
            dataTransfer: {
                files: [file],
            },
        };
        fireEvent.drop(dropZone, dropEvent);
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it("resets border color on drag leave", () => {
        const { container } = render(<ThumbnailUpload selectedFile={null} onFileSelect={mockOnFileSelect} />);
        const dropZone = container.firstChild as HTMLElement;
        
        fireEvent.dragOver(dropZone);
        fireEvent.dragLeave(dropZone);
        expect(dropZone.style.borderColor).toBe("rgba(255, 255, 255, 0.2)");
    });

    it("triggers file input click when the area is clicked", () => {
        const { container } = render(<ThumbnailUpload selectedFile={null} onFileSelect={mockOnFileSelect} />);
        const dropZone = container.firstChild as HTMLElement;
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        
        const clickSpy = vi.spyOn(input, "click");
        fireEvent.click(dropZone);
        expect(clickSpy).toHaveBeenCalled();
    });
});
