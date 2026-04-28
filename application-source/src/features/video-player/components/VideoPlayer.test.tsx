/**
 * VideoPlayer Component Tests
 *
 * Responsibilities:
 * - Verify initialization of video source with provider credentials
 * - Validate playback state resumption from persistent storage
 * - Test progress tracking and throttling logic
 *
 * Boundaries:
 * - Does not test actual video codecs or streaming performance
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { VideoPlayer } from "./VideoPlayer";
import { getVideoState, saveVideoProgress } from "../services/videoService";

vi.mock("../services/videoService", () => ({
    getVideoState: vi.fn(),
    saveVideoProgress: vi.fn(),
}));

/** Main test suite for the cinematic video player component */
describe("VideoPlayer Component", () => {
    const mockOnEnded = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (getVideoState as Mock).mockResolvedValue({ current_time: 0, duration: 0 });
    });

    it("renders video element with correct stream URL", () => {
        render(
            <VideoPlayer 
                provider="gdrive" 
                fileId="123" 
                fileName="movie.mp4" 
                onEnded={mockOnEnded} 
            />
        );

        const source = document.querySelector("source");
        expect(source?.src).toContain("file_id=123");
        expect(source?.src).toContain("provider=gdrive");
    });

    it("resumes playback from saved state", async () => {
        (getVideoState as Mock).mockResolvedValue({ current_time: 42, duration: 100 });

        render(
            <VideoPlayer 
                provider="gdrive" 
                fileId="123" 
                fileName="movie.mp4" 
                onEnded={mockOnEnded} 
            />
        );

        await waitFor(() => expect(getVideoState).toHaveBeenCalledWith("123"));
    });

    it("saves progress on time update (throttled)", async () => {
        (getVideoState as Mock).mockResolvedValue({ current_time: 0, duration: 100 });

        const { container } = render(
            <VideoPlayer 
                provider="gdrive" 
                fileId="123" 
                fileName="movie.mp4" 
                onEnded={mockOnEnded} 
            />
        );

        // Wait for getVideoState to resolve and component state to update
        await waitFor(() => expect(getVideoState).toHaveBeenCalledWith("123"));
        
        // Small delay to ensure the .then() in useEffect has executed
        await new Promise(resolve => setTimeout(resolve, 0));

        const video = container.querySelector("video")!;
        
        Object.defineProperty(video, "duration", { value: 100 });
        Object.defineProperty(video, "currentTime", { value: 5, writable: true });

        fireEvent.timeUpdate(video);

        expect(saveVideoProgress).toHaveBeenCalledWith("123", 5, 100);
    });

    it("does nothing in useEffect if fileId is missing", () => {
        render(
            <VideoPlayer 
                provider="gdrive" 
                fileId="" 
                fileName="movie.mp4" 
                onEnded={mockOnEnded} 
            />
        );

        expect(getVideoState).not.toHaveBeenCalled();
    });

    it("renders image correctly when fileName is an image", () => {
        render(
            <VideoPlayer 
                provider="gdrive" 
                fileId="img123" 
                fileName="photo.jpg" 
                onEnded={mockOnEnded} 
            />
        );

        const img = screen.getByRole("img");
        expect(img.getAttribute("src")).toContain("file_id=img123");
        expect(img.getAttribute("alt")).toBe("photo.jpg");
    });
});
