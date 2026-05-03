/**
 * FileLibrary Component Tests
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FileLibrary } from "./FileLibrary";
import { useFiles } from "../hooks/useFiles";
import { useNavigate, useLocation } from "react-router-dom";
vi.mock("../hooks/useFiles");
vi.mock("../../../hooks/useAuth", () => ({
    useAuth: () => ({
        token: "token123",
        connectedAccounts: [],
        isLoadingAccounts: false,
        refreshAccounts: vi.fn(),
        logoutAccount: vi.fn(),
    })
}));
vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
}));

describe("FileLibrary Component", () => {
    const mockNavigate = vi.fn();
    const mockRefresh = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as Mock).mockReturnValue(mockNavigate);
        (useLocation as Mock).mockReturnValue({ pathname: "/Home", search: "" });
        (useFiles as Mock).mockReturnValue({
            data: { files: [] },
            isLoading: false,
            refresh: mockRefresh,
        });
    });

    it("renders loading state", () => {
        (useFiles as Mock).mockReturnValue({ isLoading: true });
        render(<FileLibrary />);
        expect(screen.getByTestId("skeleton-grid")).toBeDefined();
    });

    it("renders files and handles folder navigation", async () => {
        const mockFiles = [
            { name: "Folder A", type: "folder", ids: { gdrive: "f1" }, providers: ["gdrive"] },
        ];
        (useFiles as Mock).mockReturnValue({
            data: { files: mockFiles, folder_id: "root", path_names: ["Home"] },
            isLoading: false,
            refresh: mockRefresh,
        });

        render(<FileLibrary />);
        expect(screen.getByText("Folder A")).toBeDefined();

        fireEvent.click(screen.getByText("Folder A"));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });

    it("opens image viewer when image file is clicked", () => {
        const mockFiles = [
            { name: "photo.jpg", type: "file", ids: { gdrive: "img1" }, providers: ["gdrive"] },
        ];

        (useFiles as Mock).mockReturnValue({
            data: { files: mockFiles, folder_id: "root" },
            isLoading: false,
            refresh: mockRefresh,
        });

        render(<FileLibrary />);
        fireEvent.click(screen.getByText("photo.jpg"));

        expect(screen.getByRole("dialog")).toBeDefined();
    });
});
