/**
 * App Component Tests
 *
 * Responsibilities:
 * - Verify that the PasscodeOverlay is shown when the site is locked
 * - Validate that the main application routes are accessible when unlocked
 *
 * Boundaries:
 * - Does not test individual page contents or feature logic
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { useAuth } from "../hooks/useAuth";
import { MemoryRouter } from "react-router-dom";


vi.mock("../hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

// Mock components to simplify App testing
vi.mock("../features/auth/PasscodeOverlay", () => ({
    PasscodeOverlay: () => <div data-testid="passcode-overlay">Passcode Overlay</div>,
}));

vi.mock("./pages/Home", () => ({
    default: () => <div data-testid="home-page">Home Page</div>,
}));

/** Main test suite for the root application component and routing gateway */
describe("App Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders PasscodeOverlay when not unlocked", () => {
        (useAuth as Mock).mockReturnValue({
            isUnlocked: false,
            unlock: vi.fn(),
            error: null,
        });

        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByTestId("passcode-overlay")).toBeDefined();
        expect(screen.queryByTestId("home-page")).toBeNull();
    });

    it("renders Home page when unlocked and on root path", () => {
        (useAuth as Mock).mockReturnValue({
            isUnlocked: true,
            unlock: vi.fn(),
            error: null,
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByTestId("home-page")).toBeDefined();
        expect(screen.queryByTestId("passcode-overlay")).toBeNull();
    });
});
