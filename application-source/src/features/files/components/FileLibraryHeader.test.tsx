/**
 * FileLibraryHeader Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { FileLibraryHeader } from "./FileLibraryHeader";
vi.mock("../../accounts/components/AccountManager", () => ({
    AccountManager: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="mock-account-manager" /> : null,
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderWithClient = (ui: React.ReactElement) =>
    render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

describe("FileLibraryHeader Component", () => {
    const mockOnBreadcrumbClick = vi.fn();
    const mockOnColumnCountChange = vi.fn();

    it("renders correctly", () => {
        renderWithClient(
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
        renderWithClient(<FileLibraryHeader history={[]} columnCount={6} onBreadcrumbClick={mockOnBreadcrumbClick} onColumnCountChange={mockOnColumnCountChange} />);
        fireEvent.click(screen.getByText(/Cloud Accounts/i));
        expect(screen.getByTestId("mock-account-manager")).toBeDefined();
    });
});
