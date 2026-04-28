/**
 * File Service Tests
 *
 * Responsibilities:
 * - Validate API call parameters for file listing
 * - Verify thumbnail update modes (timestamp vs upload)
 * - Test default parameter handling
 *
 * Boundaries:
 * - Does not test API client implementation
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { fetchFiles, updateThumbnail } from "./fileService";
import { apiClient } from "../../../services/apiClient";

vi.mock("../../../services/apiClient", () => ({
    apiClient: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

/** Main test suite for file domain service layer */
describe("File Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("fetchFiles", () => {
        it("should call apiClient.get with correct folderId", async () => {
            const mockFiles = { folder_id: "123", files: [] };
            (apiClient.get as Mock).mockResolvedValue(mockFiles);

            const result = await fetchFiles("123");

            expect(apiClient.get).toHaveBeenCalledWith("/files/?folder_id=123");
            expect(result).toEqual(mockFiles);
        });

        it("should use 'root' as default folderId", async () => {
            await fetchFiles();
            expect(apiClient.get).toHaveBeenCalledWith("/files/?folder_id=root");
        });
    });

    describe("updateThumbnail", () => {
        it("should handle timestamp-based updates", async () => {
            await updateThumbnail("file1", "gdrive", { timestamp: 42 });

            expect(apiClient.patch).toHaveBeenCalledWith(
                "/files/file1/thumbnail?provider=gdrive&timestamp=42",
                {}
            );
        });

        it("should handle manual file upload updates", async () => {
            const mockFile = new File([""], "thumb.jpg", { type: "image/jpeg" });
            await updateThumbnail("file1", "mega", { file: mockFile });

            expect(apiClient.patch).toHaveBeenCalledWith(
                "/files/file1/thumbnail?provider=mega",
                expect.any(FormData)
            );
        });
    });
});
