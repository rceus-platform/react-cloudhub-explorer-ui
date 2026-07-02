/**
 * FileLibraryHeader Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileLibraryHeader } from "./FileLibraryHeader";
vi.mock("../../accounts/components/AccountManager", () => ({
    AccountManager: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="mock-account-manager" /> : null,
}));

describe("FileLibraryHeader Component", () => {
    const mockOnBreadcrumbClick = vi.fn();
    const mockOnColumnCountChange = vi.fn();

    it("renders correctly", () => {
        render(
            <FileLibraryHeader
                history={[{ id: "root", name: "Home" }]}
                columnCount={6}
                onBreadcrumbClick={mockOnBreadcrumbClick}
                onColumnCountChange={mockOnColumnCountChange}
            />
        );
        expect(screen.getByText("Home")).toBeDefined();
    });

    it("opens account manager", () => {
        render(<FileLibraryHeader history={[]} columnCount={6} onBreadcrumbClick={mockOnBreadcrumbClick} onColumnCountChange={mockOnColumnCountChange} />);
        fireEvent.click(screen.getByText(/Cloud Accounts/i));
        expect(screen.getByTestId("mock-account-manager")).toBeDefined();
    });
});
