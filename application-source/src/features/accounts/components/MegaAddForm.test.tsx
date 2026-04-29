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

    it("renders correctly and handles input changes", () => {
        render(
            <MegaAddForm
                email="test@mega.nz"
                setEmail={mockSetEmail}
                password="pass"
                setPassword={mockSetPassword}
                isSubmitting={false}
                error={null}
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.getByPlaceholderText("MEGA Email")).toBeDefined();
        expect((screen.getByPlaceholderText("MEGA Email") as HTMLInputElement).value).toBe("test@mega.nz");

        fireEvent.change(screen.getByPlaceholderText("MEGA Email"), { target: { value: "new@mega.nz" } });
        expect(mockSetEmail).toHaveBeenCalledWith("new@mega.nz");

        fireEvent.change(screen.getByPlaceholderText("MEGA Password"), { target: { value: "newpass" } });
        expect(mockSetPassword).toHaveBeenCalledWith("newpass");
    });

    it("triggers onSubmit when form is submitted", () => {
        render(
            <MegaAddForm
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
});
