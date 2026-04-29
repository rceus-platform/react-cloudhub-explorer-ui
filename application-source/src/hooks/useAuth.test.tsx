/**
 * useAuth Hook Tests
 *
 * Responsibilities:
 * - Verify that useAuth correctly accesses context when within a provider
 * - Ensure proper error throwing when used outside an AuthProvider scope
 *
 * Boundaries:
 * - Does not test AuthContext internal logic
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { AuthProvider } from "../app/context/AuthContext";
import React from "react";

/** Main test suite for the useAuth convenience hook */
describe("useAuth Hook", () => {
    it("should throw error when used outside AuthProvider", () => {
        // Suppress console.error for the expected error
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within an AuthProvider");

        consoleSpy.mockRestore();
    });

    it("should return context value when used within AuthProvider", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current).toBeDefined();
        expect(result.current.isUnlocked).toBeDefined();
    });
});
