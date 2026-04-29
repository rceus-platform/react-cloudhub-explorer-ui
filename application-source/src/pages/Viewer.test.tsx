/**
 * Viewer Page Tests
 *
 * Responsibilities:
 * - Verify that the Viewer page correctly extracts query parameters
 * - Validate construction of the streaming URL with token support
 *
 * Boundaries:
 * - Does not test actual video playback or codecs
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import Viewer from "./Viewer";
import { useSearchParams } from "react-router-dom";


vi.mock("react-router-dom", () => ({
    useSearchParams: vi.fn(),
}));

/** Main test suite for the legacy standalone video viewer */
describe("Viewer Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it("renders video element with correct stream URL", () => {
        const mockParams = new URLSearchParams("provider=mega&file_id=123&file_name=movie.mp4");
        (useSearchParams as Mock).mockReturnValue([mockParams]);
        localStorage.setItem("access_token", "test-token");

        render(<Viewer />);

        expect(screen.getByText("movie.mp4")).toBeDefined();
        const source = document.querySelector("source");
        expect(source?.src).toContain("provider=mega");
        expect(source?.src).toContain("file_id=123");
        expect(source?.src).toContain("token=test-token");
    });

    it("handles missing token gracefully", () => {
        const mockParams = new URLSearchParams("provider=gdrive&file_id=456&file_name=show.mp4");
        (useSearchParams as Mock).mockReturnValue([mockParams]);

        render(<Viewer />);

        const source = document.querySelector("source");
        expect(source?.src).not.toContain("token=");
    });
});
