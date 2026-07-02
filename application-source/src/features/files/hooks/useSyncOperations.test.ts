import React from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { normalizeFolderId, useSyncOperations } from "./useSyncOperations";

vi.mock("../../../services/apiClient", () => ({
    apiClient: {
        post: vi.fn().mockResolvedValue({}),
    },
}));

describe("normalizeFolderId", () => {
    it("returns root for empty and root values", () => {
        expect(normalizeFolderId("")).toBe("root");
        expect(normalizeFolderId("root")).toBe("root");
    });

    it("normalizes JSON object key ordering", () => {
        const input = '{"mega":["m:1"],"gdrive":["g:1"]}';
        const expected = '{"gdrive":["g:1"],"mega":["m:1"]}';
        expect(normalizeFolderId(input)).toBe(expected);
    });

    it("returns raw folder id when not valid JSON", () => {
        expect(normalizeFolderId("plain-folder-id")).toBe("plain-folder-id");
    });
});

describe("useSyncOperations", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
    });

    it("invalidates refresh query with normalized folder key", async () => {
        const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(QueryClientProvider, { client: queryClient }, children);

        const { result } = renderHook(() => useSyncOperations(), { wrapper });
        const input = '{"mega":["m:1"],"gdrive":["g:1"]}';

        await result.current.refreshFolder(input);

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ["files", '{"gdrive":["g:1"],"mega":["m:1"]}'],
        });
    });
});
