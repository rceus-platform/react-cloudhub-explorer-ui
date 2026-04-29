/**
 * useFiles Hook Tests
 *
 * Responsibilities:
 * - Validate file fetching logic and state transitions
 * - Verify interaction with fileService and React Query
 * - Test error and loading states
 *
 * Boundaries:
 * - Does not test UI components or individual file actions
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFiles } from "./useFiles";
import { fetchFiles } from "../services/fileService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("../services/fileService", () => ({
    fetchFiles: vi.fn(),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

/** Main test suite for the files data fetching hook */
describe("useFiles Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it("should fetch files and return data", async () => {
        const mockData = { folder_id: "root", files: [] };
        (fetchFiles as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFiles("root"), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockData);
        expect(fetchFiles).toHaveBeenCalledWith("root");
    });

    it("should handle loading states", async () => {
        (fetchFiles as Mock).mockReturnValue(new Promise(() => {})); // Never resolves

        const { result } = renderHook(() => useFiles("root"), { wrapper });

        expect(result.current.isLoading).toBe(true);
    });

    it("should handle error states", async () => {
        (fetchFiles as Mock).mockRejectedValue(new Error("Fetch failed"));

        const { result } = renderHook(() => useFiles("root"), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error).toEqual(new Error("Fetch failed"));
    });

    it("should force refresh data when refresh is called", async () => {
        const initialData = { folder_id: "root", files: [{ name: "A" }] };
        const freshData = { folder_id: "root", files: [{ name: "B" }] };

        (fetchFiles as Mock).mockResolvedValueOnce(initialData).mockResolvedValueOnce(freshData);

        const { result } = renderHook(() => useFiles("root"), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        await React.act(async () => {
            await result.current.refresh();
        });

        expect(fetchFiles).toHaveBeenCalledWith("root", true);
        expect(result.current.data).toEqual(freshData);
    });

    it("should handle error during manual refresh", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchFiles as Mock).mockResolvedValueOnce({ files: [] }).mockRejectedValueOnce(new Error("Refresh Error"));

        const { result } = renderHook(() => useFiles("root"), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        await React.act(async () => {
            await result.current.refresh();
        });

        expect(consoleSpy).toHaveBeenCalledWith("Refresh failed:", expect.any(Error));
        expect(result.current.isRefreshing).toBe(false);
        consoleSpy.mockRestore();
    });
});
