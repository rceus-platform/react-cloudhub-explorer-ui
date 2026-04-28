/**
 * API Client Tests
 *
 * Responsibilities:
 * - Validate base HTTP methods (GET, POST, etc.)
 * - Verify header management (Content-Type, Authorization)
 * - Test error handling and response parsing
 *
 * Boundaries:
 * - Does not test specific business logic or feature-specific endpoints
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { apiClient } from "./apiClient";

/** Main test suite for the shared API client utility */
describe("API Client", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        localStorage.clear();
    });

    it("should perform a GET request with correct headers", async () => {
        const mockResponse = { data: "test" };
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await apiClient.get("/test");

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/test"), {
            headers: {
                "Content-Type": "application/json",
            },
        });
        expect(result).toEqual(mockResponse);
    });

    it("should include Authorization header if token exists", async () => {
        localStorage.setItem("access_token", "secret-token");
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        });

        await apiClient.get("/secure");

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/secure"), {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer secret-token",
            },
        });
    });

    it("should handle POST with FormData correctly", async () => {
        const formData = new FormData();
        formData.append("key", "value");
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        await apiClient.post("/upload", formData);

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/upload"), {
            method: "POST",
            headers: {}, // Content-Type should NOT be set for FormData
            body: formData,
        });
    });

    it("should handle POST with JSON correctly", async () => {
        const body = { name: "test" };
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        await apiClient.post("/json", body);

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/json"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    });

    it("should handle PATCH with JSON correctly", async () => {
        const body = { status: "active" };
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        await apiClient.patch("/update", body);

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/update"), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    });

    it("should handle PATCH with FormData correctly", async () => {
        const formData = new FormData();
        formData.append("key", "value");
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        await apiClient.patch("/upload", formData);

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/upload"), {
            method: "PATCH",
            headers: {},
            body: formData,
        });
    });

    it("should handle DELETE correctly", async () => {
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        await apiClient.delete("/remove");

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/remove"), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
    });

    it("throws error when response is not ok (GET)", async () => {
        (fetch as Mock).mockResolvedValue({
            ok: false,
            status: 404,
            statusText: "Not Found",
        });

        await expect(apiClient.get("/error")).rejects.toThrow("API error: 404 Not Found");
    });

    it("throws error when response is not ok (POST)", async () => {
        (fetch as Mock).mockResolvedValue({
            ok: false,
            status: 400,
            statusText: "Bad Request",
        });

        await expect(apiClient.post("/error", {})).rejects.toThrow("API error: 400 Bad Request");
    });

    it("throws error when response is not ok (PATCH)", async () => {
        (fetch as Mock).mockResolvedValue({
            ok: false,
            status: 403,
            statusText: "Forbidden",
        });

        await expect(apiClient.patch("/error", {})).rejects.toThrow("API error: 403 Forbidden");
    });

    it("throws error when response is not ok (DELETE)", async () => {
        (fetch as Mock).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
        });

        await expect(apiClient.delete("/error")).rejects.toThrow("API error: 500 Internal Server Error");
    });
});
