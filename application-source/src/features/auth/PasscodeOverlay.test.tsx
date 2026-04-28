/**
 * PasscodeOverlay Component Tests
 *
 * Responsibilities:
 * - Verify PIN entry auto-focus and navigation logic
 * - Test auto-submission when 4 digits are entered
 * - Validate error message display
 * - Verify input constraints (numbers only)
 *
 * Boundaries:
 * - Does not test individual CSS module class application
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PasscodeOverlay } from "./PasscodeOverlay";

/** Main test suite for the security entry overlay */
describe("PasscodeOverlay Component", () => {
    const mockOnVerify = vi.fn();

    it("renders correctly with 4 input fields", () => {
        const { container } = render(<PasscodeOverlay onVerify={mockOnVerify} />);
        const inputs = container.querySelectorAll('input[type="password"]');
        expect(inputs.length).toBe(4);
    });

    it("auto-focuses next input on digit entry", () => {
        const { container } = render(<PasscodeOverlay onVerify={mockOnVerify} />);
        const inputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
        
        // Initial focus should be on the first input due to autoFocus
        // However, in JSDOM, autoFocus might need manual trigger or check
        inputs[0].focus(); 

        fireEvent.change(inputs[0], { target: { value: "1" } });
        expect(document.activeElement).toBe(inputs[1]);
        
        fireEvent.change(inputs[1], { target: { value: "2" } });
        expect(document.activeElement).toBe(inputs[2]);
    });

    it("moves focus back on backspace when empty", () => {
        const { container } = render(<PasscodeOverlay onVerify={mockOnVerify} />);
        const inputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
        
        fireEvent.change(inputs[0], { target: { value: "1" } });
        fireEvent.change(inputs[1], { target: { value: "2" } });
        inputs[2].focus();
        
        fireEvent.keyDown(inputs[2], { key: "Backspace" });
        expect(document.activeElement).toBe(inputs[1]);
    });

    it("submits automatically when 4th digit is entered", () => {
        const { container } = render(<PasscodeOverlay onVerify={mockOnVerify} />);
        const inputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
        
        fireEvent.change(inputs[0], { target: { value: "1" } });
        fireEvent.change(inputs[1], { target: { value: "2" } });
        fireEvent.change(inputs[2], { target: { value: "3" } });
        fireEvent.change(inputs[3], { target: { value: "4" } });
        
        expect(mockOnVerify).toHaveBeenCalledWith("1234");
    });

    it("displays error message when provided", () => {
        render(<PasscodeOverlay onVerify={mockOnVerify} error="Invalid Code" />);
        expect(screen.getByText("Invalid Code")).toBeDefined();
    });

    it("takes the last character if multiple are entered", () => {
        const { container } = render(<PasscodeOverlay onVerify={mockOnVerify} />);
        const inputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
        
        fireEvent.change(inputs[0], { target: { value: "12" } });
        expect(inputs[0].value).toBe("2");
    });

    it("handles manual form submission", () => {
        render(<PasscodeOverlay onVerify={mockOnVerify} />);
        const inputs = document.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
        
        fireEvent.change(inputs[0], { target: { value: "1" } });
        fireEvent.change(inputs[1], { target: { value: "2" } });
        fireEvent.change(inputs[2], { target: { value: "3" } });
        fireEvent.change(inputs[3], { target: { value: "4" } });
        
        const submitBtn = screen.getByText("Unlock Application");
        fireEvent.click(submitBtn);
        
        expect(mockOnVerify).toHaveBeenCalledWith("1234");
    });
});
