/**
 * ThumbnailCapture Component Tests
 *
 * Responsibilities:
 * - Verify timestamp slider changes trigger onTimestampChange
 * - Validate clicking Preview Frame triggers onPreview
 * - Verify loading state disables the preview button
 *
 * Boundaries:
 * - Does not test actual video seeking logic
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThumbnailCapture } from "./ThumbnailCapture";

/** Main test suite for the video frame capture interface */
describe("ThumbnailCapture Component", () => {
    const mockOnTimestampChange = vi.fn();
    const mockOnPreview = vi.fn();

    it("renders correctly and shows formatted time", () => {
        render(
            <ThumbnailCapture
                timestamp={125}
                duration={300}
                loading={false}
                onTimestampChange={mockOnTimestampChange}
                onPreview={mockOnPreview}
            />
        );

        expect(screen.getByText(/2:05/)).toBeDefined();
    });

    it("triggers onTimestampChange when slider moves", () => {
        render(
            <ThumbnailCapture
                timestamp={125}
                duration={300}
                loading={false}
                onTimestampChange={mockOnTimestampChange}
                onPreview={mockOnPreview}
            />
        );

        const slider = screen.getByRole("slider");
        fireEvent.change(slider, { target: { value: "200" } });
        expect(mockOnTimestampChange).toHaveBeenCalledWith(200);
    });

    it("triggers onPreview when button is clicked", () => {
        render(
            <ThumbnailCapture
                timestamp={125}
                duration={300}
                loading={false}
                onTimestampChange={mockOnTimestampChange}
                onPreview={mockOnPreview}
            />
        );

        fireEvent.click(screen.getByText("Preview Frame"));
        expect(mockOnPreview).toHaveBeenCalled();
    });

    it("disables button when loading", () => {
        render(
            <ThumbnailCapture
                timestamp={125}
                duration={300}
                loading={true}
                onTimestampChange={mockOnTimestampChange}
                onPreview={mockOnPreview}
            />
        );

        const btn = screen.getByText("Preview Frame") as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });
});
