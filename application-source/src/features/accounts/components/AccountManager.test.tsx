/**
 * AccountManager Component Tests
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccountManager } from "./AccountManager";
import { useAccountManager } from "../hooks/useAccountManager";

// Mock the hook
vi.mock("../hooks/useAccountManager", () => ({
    useAccountManager: vi.fn(),
}));

describe("AccountManager Component", () => {
    const mockOnClose = vi.fn();
    const mockSetMegaEmail = vi.fn();
    const mockSetMegaPassword = vi.fn();
    const mockHandleAddGDrive = vi.fn();
    const mockHandleAddMega = vi.fn();
    const mockToggleMegaForm = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAccountManager as Mock).mockReturnValue({
            connectedAccounts: [],
            isLoadingAccounts: false,
            megaEmail: "",
            megaPassword: "",
            isAddingMega: false,
            setMegaEmail: mockSetMegaEmail,
            setMegaPassword: mockSetMegaPassword,
            isSubmitting: false,
            error: null,
            formatBytes: (b: number) => `${b} B`,
            handleAddGDrive: mockHandleAddGDrive,
            handleAddMega: mockHandleAddMega,
            toggleMegaForm: mockToggleMegaForm,
        });
    });

    it("does not render when isOpen is false", () => {
        render(<AccountManager isOpen={false} onClose={mockOnClose} />);
        expect(screen.queryByText("Cloud Accounts")).toBeNull();
    });

    it("renders correctly when open", () => {
        render(<AccountManager isOpen={true} onClose={mockOnClose} />);
        expect(screen.getByText("Cloud Accounts")).toBeDefined();
    });

    it("calls handleAddGDrive when clicking Google Drive button", () => {
        render(<AccountManager isOpen={true} onClose={mockOnClose} />);
        fireEvent.click(screen.getByText("Link Google Drive"));
        expect(mockHandleAddGDrive).toHaveBeenCalled();
    });

    it("shows MEGA form when isAddingMega is true", () => {
        (useAccountManager as Mock).mockReturnValue({
            ...useAccountManager(),
            isAddingMega: true,
        });
        render(<AccountManager isOpen={true} onClose={mockOnClose} />);
        expect(screen.getByPlaceholderText("MEGA Email")).toBeDefined();
    });

    it("calls handleAddMega on form submission", () => {
        (useAccountManager as Mock).mockReturnValue({
            ...useAccountManager(),
            isAddingMega: true,
        });
        const { container } = render(<AccountManager isOpen={true} onClose={mockOnClose} />);
        fireEvent.submit(container.querySelector('form')!);
        expect(mockHandleAddMega).toHaveBeenCalled();
    });
});
