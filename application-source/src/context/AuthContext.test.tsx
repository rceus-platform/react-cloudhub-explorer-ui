/**
 * AuthContext Tests
 *
 * Responsibilities:
 * - Validate site unlocking logic with correct/incorrect passcodes
 * - Verify account fetching and state management
 * - Test account logout and state synchronization
 * - Ensure session persistence via sessionStorage
 *
 * Boundaries:
 * - Does not test individual account provider login flows
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import React from "react";

vi.mock("../services/apiClient", () => ({
    apiClient: {
        get: vi.fn(),
        delete: vi.fn(),
    },
}));

/** Main test suite for the global authentication and account management context */
describe("AuthContext", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        // Reset environment variable mock if needed, but here it's static
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    it("should initialize with locked state by default", () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.isUnlocked).toBe(false);
    });

    it("should unlock correctly with valid passcode", async () => {
        (apiClient.get as Mock).mockResolvedValue([]);
        const { result } = renderHook(() => useAuth(), { wrapper });
        
        // Assuming VITE_SITE_PASSCODE is "8080" based on previous .env check
        await act(async () => {
            const success = result.current.unlock("8080");
            expect(success).toBe(true);
        });

        expect(result.current.isUnlocked).toBe(true);
        expect(sessionStorage.getItem("site_unlocked")).toBe("true");
        await waitFor(() => {
            expect(result.current.isLoadingAccounts).toBe(false);
        });
    });

    it("should set error state with invalid passcode", async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        
        await act(async () => {
            const success = result.current.unlock("wrong");
            expect(success).toBe(false);
        });

        expect(result.current.isUnlocked).toBe(false);
        expect(result.current.error).toBe("Incorrect passcode. Please try again.");
    });

    it("should fetch accounts when unlocked", async () => {
        const mockAccounts = [{ id: 1, email: "test@mega.nz", provider: "mega", label: "Work" }];
        (apiClient.get as Mock).mockResolvedValue(mockAccounts);

        const { result } = renderHook(() => useAuth(), { wrapper });
        
        await act(async () => {
            result.current.unlock("8080");
        });

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith("/accounts/");
            expect(result.current.connectedAccounts).toEqual(mockAccounts);
        });
    });

    it("should handle account logout", async () => {
        const mockAccounts = [{ id: 1, email: "test@mega.nz", provider: "mega", label: "Work" }];
        (apiClient.get as Mock).mockResolvedValue(mockAccounts);

        const { result } = renderHook(() => useAuth(), { wrapper });
        
        await act(async () => {
            result.current.unlock("8080");
        });

        (apiClient.get as Mock).mockResolvedValue([]); // Next fetch returns empty

        await act(async () => {
            await result.current.logoutAccount(1);
        });

        expect(apiClient.delete).toHaveBeenCalledWith("/accounts/1");
        await waitFor(() => {
            expect(result.current.connectedAccounts).toEqual([]);
        });
    });

    it("should handle error during account fetching", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (apiClient.get as Mock).mockRejectedValue(new Error("Network Error"));

        const { result } = renderHook(() => useAuth(), { wrapper });
        
        await act(async () => {
            result.current.unlock("8080");
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch accounts:", expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it("should handle error during account logout", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (apiClient.delete as Mock).mockRejectedValue(new Error("Delete Failed"));

        const { result } = renderHook(() => useAuth(), { wrapper });
        
        await act(async () => {
            result.current.unlock("8080");
        });

        await expect(result.current.logoutAccount(1)).rejects.toThrow("Delete Failed");
        expect(consoleSpy).toHaveBeenCalledWith("Failed to logout account:", expect.any(Error));
        
        consoleSpy.mockRestore();
    });
});
