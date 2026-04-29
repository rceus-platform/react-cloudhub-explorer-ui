/**
 * Home Page Tests
 *
 * Responsibilities:
 * - Verify that the Home page correctly mounts the FileLibrary component
 *
 * Boundaries:
 * - Does not test FileLibrary internal logic
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./Home";


vi.mock("../../features/files", () => ({
    FileLibrary: () => <div data-testid="file-library">File Library</div>,
}));

/** Main test suite for the root library explorer page */
describe("Home Page", () => {
    it("renders FileLibrary component", () => {
        render(<Home />);
        expect(screen.getByTestId("file-library")).toBeDefined();
    });
});
