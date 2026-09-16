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
import { fetchFiles, streamFiles } from "../services/fileService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("../services/fileService", () => ({
    fetchFiles: vi.fn(),
    streamFiles: vi.fn(),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

/** Helper to mock streamFiles with immediate SSE-style callback */
function mockStreamSuccess(data: { folder_id: string; files: unknown[] }) {
    (streamFiles as Mock).mockImplementation(
        (_folderId, onEvent) => {
            setTimeout(() => {
                onEvent({
                    files: data.files,
                    done: true,
                    account_count: 1,
                    accounts_received: 1,
                });
            }, 0);
            return () => {};
        },
    );
}

/** Main test suite for the files data fetching hook */
describe("useFiles Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it("should fetch files via SSE and return data", async () => {
        const mockData = { folder_id: "root", files: [] };
        mockStreamSuccess(mockData);

        const { result } = renderHook(
            () => useFiles("root"),
            { wrapper },
        );

        await waitFor(() =>
            expect(result.current.isSuccess).toBe(true),
        );
        expect(result.current.data?.files).toEqual([]);
        expect(streamFiles).toHaveBeenCalled();
    });

    it("should handle loading states", async () => {
        // Stream never calls back
        (streamFiles as Mock).mockImplementation(() => () => {});

        const { result } = renderHook(
            () => useFiles("root"),
            { wrapper },
        );

        expect(result.current.isLoading).toBe(true);
    });

    it("should fall back to fetchFiles on SSE error", async () => {
        const mockData = { folder_id: "root", files: [] };

        // SSE errors immediately, triggering fallback
        (streamFiles as Mock).mockImplementation(
            (_folderId, _onEvent, onError) => {
                setTimeout(() => onError?.(new Event("error")), 0);
                return () => {};
            },
        );
        (fetchFiles as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(
            () => useFiles("root"),
            { wrapper },
        );

        await waitFor(() =>
            expect(result.current.isSuccess).toBe(true),
        );
        expect(fetchFiles).toHaveBeenCalledWith("root");
    });

    it("should force refresh data when refresh is called", async () => {
        const initialData = {
            folder_id: "root",
            files: [{ name: "A" }],
        };
        const freshData = {
            folder_id: "root",
            files: [{ name: "B" }],
        };

        mockStreamSuccess(initialData);

        const { result } = renderHook(
            () => useFiles("root"),
            { wrapper },
        );
        await waitFor(() =>
            expect(result.current.isSuccess).toBe(true),
        );

        // Refresh uses fetchFiles directly
        (fetchFiles as Mock).mockResolvedValueOnce(freshData);

        await React.act(async () => {
            await result.current.refresh();
        });

        expect(fetchFiles).toHaveBeenCalledWith("root", true);
        expect(result.current.data).toEqual(freshData);
    });

    it("should handle error during manual refresh", async () => {
        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        mockStreamSuccess({ folder_id: "root", files: [] });

        const { result } = renderHook(
            () => useFiles("root"),
            { wrapper },
        );
        await waitFor(() =>
            expect(result.current.isSuccess).toBe(true),
        );

        (fetchFiles as Mock).mockRejectedValueOnce(
            new Error("Refresh Error"),
        );

        await React.act(async () => {
            await result.current.refresh();
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            "Refresh failed:",
            expect.any(Error),
        );
        expect(result.current.isRefreshing).toBe(false);
        consoleSpy.mockRestore();
    });
});
