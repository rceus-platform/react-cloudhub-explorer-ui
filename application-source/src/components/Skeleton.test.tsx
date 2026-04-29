/**
 * Skeleton Component Tests
 *
 * Responsibilities:
 * - Verify rendering of pulse placeholders
 * - Validate style prop application (width, height, borderRadius)
 * - Test composite FileCardSkeleton structure
 *
 * Boundaries:
 * - Does not test CSS animation performance
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton, FileCardSkeleton } from "./Skeleton";


/** Main test suite for loading placeholder components */
describe("Skeleton Component", () => {
    it("renders with custom dimensions", () => {
        const { container } = render(<Skeleton width="100px" height="50px" borderRadius="10px" />);
        const div = container.firstChild as HTMLElement;

        expect(div.style.width).toBe("100px");
        expect(div.style.height).toBe("50px");
        expect(div.style.borderRadius).toBe("10px");
    });

    it("renders FileCardSkeleton correctly", () => {
        const { container } = render(<FileCardSkeleton />);
        const skeletons = container.querySelectorAll(".skeleton-pulse");
        expect(skeletons.length).toBe(3);
    });
});
