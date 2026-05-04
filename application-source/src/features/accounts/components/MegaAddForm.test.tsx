/**
 * MegaAddForm Component Tests
 *
 * Responsibilities:
 * - Verify synchronization of email and password inputs with props
 * - Validate form submission triggers the onSubmit callback
 * - Test display of loading state during submission
 * - Verify rendering of error messages
 *
 * Boundaries:
 * - Does not test framer-motion animations
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MegaAddForm } from "./MegaAddForm";

/** Main test suite for the MEGA account credential entry form */
describe("MegaAddForm Component", () => {
    const mockSetEmail = vi.fn();
    const mockSetPassword = vi.fn();
    const mockOnSubmit = vi.fn((e) => e.preventDefault());
    const mockOnClose = vi.fn();

    it("renders correctly and handles input changes", () => {
        render(
            <MegaAddForm
                isOpen={true}
                onClose={mockOnClose}
                email="test@mega.nz"
                setEmail={mockSetEmail}
                password="pass"
                setPassword={mockSetPassword}
                isSubmitting={false}
                error={null}
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.getByPlaceholderText("Email Address")).toBeDefined();
        expect((screen.getByPlaceholderText("Email Address") as HTMLInputElement).value).toBe("test@mega.nz");

        fireEvent.change(screen.getByPlaceholderText("Email Address"), { target: { value: "new@mega.nz" } });
        expect(mockSetEmail).toHaveBeenCalledWith("new@mega.nz");

        fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "newpass" } });
        expect(mockSetPassword).toHaveBeenCalledWith("newpass");
    });

    it("triggers onSubmit when form is submitted", () => {
        render(
            <MegaAddForm
                isOpen={true}
                onClose={mockOnClose}
                email="test@mega.nz"
                setEmail={mockSetEmail}
                password="pass"
                setPassword={mockSetPassword}
                isSubmitting={false}
                error={null}
                onSubmit={mockOnSubmit}
            />
        );

        fireEvent.submit(screen.getByRole("button", { name: /Connect MEGA Account/i }));
        expect(mockOnSubmit).toHaveBeenCalled();
    });

    it("shows loading state when isSubmitting is true", () => {
        render(
            <MegaAddForm
                isOpen={true}
                onClose={mockOnClose}
                email=""
                setEmail={mockSetEmail}
                password=""
                setPassword={mockSetPassword}
                isSubmitting={true}
                error={null}
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("displays error message when provided", () => {
        render(
            <MegaAddForm
                isOpen={true}
                onClose={mockOnClose}
                email=""
                setEmail={mockSetEmail}
                password=""
                setPassword={mockSetPassword}
                isSubmitting={false}
                error="Invalid credentials"
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.getByText("Invalid credentials")).toBeDefined();
    });

    it("does not render when isOpen is false", () => {
        render(
            <MegaAddForm
                isOpen={false}
                onClose={mockOnClose}
                email=""
                setEmail={mockSetEmail}
                password=""
                setPassword={mockSetPassword}
                isSubmitting={false}
                error={null}
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.queryByText("Link MEGA Storage")).toBeNull();
    });
});
