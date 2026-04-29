/**
 * AccountCard Component Tests
 *
 * Responsibilities:
 * - Verify display of account email and provider type
 * - Validate storage usage calculation and progress bar width
 * - Test status badge rendering (Active vs Expired)
 * - Verify disconnect button triggers callback with correct ID
 *
 * Boundaries:
 * - Does not test framer-motion layout transitions
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccountCard } from "./AccountCard";
import type { Account } from "../../../context/AuthContext";

/** Main test suite for the individual account status card */
describe("AccountCard Component", () => {
    const mockFormatBytes = vi.fn((b) => `${b} bytes`);
    const mockOnDisconnect = vi.fn();

    const mockAccount: Account = {
        id: 1,
        email: "test@example.com",
        provider: "gdrive",
        is_active: true,
        storage_used: 50,
        storage_total: 100
    };

    it("renders account information correctly", () => {
        render(
            <AccountCard
                account={mockAccount}
                formatBytes={mockFormatBytes}
                onDisconnect={mockOnDisconnect}
            />
        );

        expect(screen.getByText("test@example.com")).toBeDefined();
        expect(screen.getByText("Google Drive")).toBeDefined();
        expect(screen.getByText("Active")).toBeDefined();
    });

    it("displays storage usage and percentage", () => {
        render(
            <AccountCard
                account={mockAccount}
                formatBytes={mockFormatBytes}
                onDisconnect={mockOnDisconnect}
            />
        );

        expect(screen.getByText(/50 bytes \/ 100 bytes/)).toBeDefined();
        expect(screen.getByText("50%")).toBeDefined();
    });

    it("shows expired status when inactive", () => {
        const inactiveAccount = { ...mockAccount, is_active: false };
        render(
            <AccountCard
                account={inactiveAccount}
                formatBytes={mockFormatBytes}
                onDisconnect={mockOnDisconnect}
            />
        );

        expect(screen.getByText("Expired")).toBeDefined();
    });

    it("calls onDisconnect with account ID when button clicked", () => {
        render(
            <AccountCard
                account={mockAccount}
                formatBytes={mockFormatBytes}
                onDisconnect={mockOnDisconnect}
            />
        );

        fireEvent.click(screen.getByText("Disconnect"));
        expect(mockOnDisconnect).toHaveBeenCalledWith(mockAccount.id);
    });
});
