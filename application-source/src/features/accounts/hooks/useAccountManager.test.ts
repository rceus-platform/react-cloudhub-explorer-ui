/**
 * useAccountManager Hook Tests
 *
 * Responsibilities:
 * - Validate Google Drive login flow initiation
 * - Verify MEGA account submission and form reset logic
 * - Test storage byte formatting utility
 * - Verify message event listener for cross-tab login success
 *
 * Boundaries:
 * - Does not test AuthContext internal state
 * - Does not test individual component rendering
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useAccountManager } from "./useAccountManager";
import { useAuth } from "../../../hooks/useAuth";
import { apiClient } from "../../../services/apiClient";

vi.mock("../../../hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../../../services/apiClient", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

/** Main test suite for the account management orchestration hook */
describe("useAccountManager Hook", () => {
    const mockRefreshAccounts = vi.fn();
    const mockLogoutAccount = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as Mock).mockReturnValue({
            connectedAccounts: [],
            isLoadingAccounts: false,
            refreshAccounts: mockRefreshAccounts,
            logoutAccount: mockLogoutAccount,
        });
        vi.stubGlobal("window", {
            ...window,
            open: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    it("should format bytes correctly", () => {
        const { result } = renderHook(() => useAccountManager());
        expect(result.current.formatBytes(0)).toBe("0 B");
        expect(result.current.formatBytes(1024)).toBe("1 KB");
        expect(result.current.formatBytes(1024 * 1024)).toBe("1 MB");
        expect(result.current.formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should handle Google Drive login initiation", async () => {
        const mockAuthUrl = "https://google.com/auth";
        (apiClient.get as Mock).mockResolvedValue({ auth_url: mockAuthUrl });
        const { result } = renderHook(() => useAccountManager());

        await act(async () => {
            await result.current.handleAddGDrive();
        });

        expect(apiClient.get).toHaveBeenCalledWith("/accounts/google/login");
        expect(window.open).toHaveBeenCalledWith(mockAuthUrl, "_blank");
    });

    it("should handle MEGA account submission", async () => {
        (apiClient.post as Mock).mockResolvedValue({});
        const { result } = renderHook(() => useAccountManager());

        act(() => {
            result.current.setMegaEmail("test@mega.nz");
            result.current.setMegaPassword("password123");
        });

        await act(async () => {
            const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
            await result.current.handleAddMega(e);
        });

        expect(apiClient.post).toHaveBeenCalledWith("/accounts/add", {
            email: "test@mega.nz",
            password: "password123",
            provider: "mega",
        });
        expect(mockRefreshAccounts).toHaveBeenCalled();
        expect(result.current.isAddingMega).toBe(false);
        expect(result.current.megaEmail).toBe("");
    });

    it("should toggle MEGA form visibility", () => {
        const { result } = renderHook(() => useAccountManager());
        expect(result.current.isAddingMega).toBe(false);

        act(() => {
            result.current.toggleMegaForm();
        });
        expect(result.current.isAddingMega).toBe(true);
    });

    it("should listen for google-login-success message", () => {
        renderHook(() => useAccountManager());
        expect(window.addEventListener).toHaveBeenCalledWith("message", expect.any(Function));

        const messageHandler = (window.addEventListener as Mock).mock.calls.find(c => c[0] === "message")?.[1];

        act(() => {
            messageHandler({ data: "google-login-success" } as MessageEvent);
        });

        expect(mockRefreshAccounts).toHaveBeenCalled();
    });

    it("should handle error during Google Drive login initiation", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        (apiClient.get as Mock).mockRejectedValue(new Error("Login Error"));
        const { result } = renderHook(() => useAccountManager());

        await act(async () => {
            await result.current.handleAddGDrive();
        });

        expect(result.current.error).toBe("Failed to start Google Drive login flow.");
        expect(consoleSpy).toHaveBeenCalledWith("Failed to start Google login:", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it("should handle error during MEGA account submission", async () => {
        (apiClient.post as Mock).mockRejectedValue(new Error("Submit Error"));
        const { result } = renderHook(() => useAccountManager());

        await act(async () => {
            const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
            await result.current.handleAddMega(e);
        });

        expect(result.current.error).toBe("Failed to link MEGA account. Please check your credentials.");
        expect(result.current.isSubmitting).toBe(false);
    });
});
