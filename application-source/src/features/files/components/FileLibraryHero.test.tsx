/**
 * FileLibraryHero Component Tests
 *
 * Responsibilities:
 * - Verify rendering of folder title and item count
 * - Validate loading vs ready state display
 * - Test status indicator color and text changes
 *
 * Boundaries:
 * - Does not test framer-motion animations or gradients
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileLibraryHero } from "./FileLibraryHero";


/** Main test suite for the explorer hero section */
describe("FileLibraryHero Component", () => {
    it("renders title and item count correctly", () => {
        render(<FileLibraryHero title="Movies" itemCount={120} isLoading={false} />);
        
        expect(screen.getByText("Movies")).toBeDefined();
        expect(screen.getByText("120 media assets available")).toBeDefined();
        expect(screen.getByText("Library Ready")).toBeDefined();
    });

    it("shows loading state correctly", () => {
        render(<FileLibraryHero title="Home" itemCount={0} isLoading={true} />);
        
        expect(screen.getByText("Synchronizing")).toBeDefined();
        expect(screen.getByText("Fetching cloud data...")).toBeDefined();
    });
});
