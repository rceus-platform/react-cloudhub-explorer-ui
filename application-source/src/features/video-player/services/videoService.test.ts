/**
 * Video Service Tests
 *
 * Responsibilities:
 * - Validate video progress saving logic
 * - Verify retrieval of video playback state
 * - Test error handling and fallback states for media tracking
 *
 * Boundaries:
 * - Does not test HTMLMediaElement or UI playback
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { saveVideoProgress, getVideoState } from "./videoService";
import { apiClient } from "../../../services/apiClient";

vi.mock("../../../services/apiClient", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

/** Main test suite for video domain business logic and persistence */
describe("Video Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("saveVideoProgress", () => {
        it("should call apiClient.post with correct payload", async () => {
            await saveVideoProgress("file123", 10.5, 100);

            expect(apiClient.post).toHaveBeenCalledWith("/video/progress", {
                file_id: "file123",
                current_time: 10,
                duration: 100,
            });
        });

        it("should handle API errors gracefully", async () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            (apiClient.post as Mock).mockRejectedValue(new Error("Network Error"));

            await saveVideoProgress("file123", 10, 100);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to save progress"), expect.any(Error));
        });
    });

    describe("getVideoState", () => {
        it("should return state from apiClient.get", async () => {
            const mockState = { current_time: 50, duration: 100 };
            (apiClient.get as Mock).mockResolvedValue(mockState);

            const result = await getVideoState("file123");

            expect(apiClient.get).toHaveBeenCalledWith("/video/state/file123");
            expect(result).toEqual(mockState);
        });

        it("should return default state on error", async () => {
            (apiClient.get as Mock).mockRejectedValue(new Error("Not Found"));

            const result = await getVideoState("file123");

            expect(result).toEqual({ current_time: 0, duration: 0 });
        });
    });
});
