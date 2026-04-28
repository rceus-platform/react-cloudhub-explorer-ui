/**
 * Formatters Utility Tests
 *
 * Responsibilities:
 * - Validate file size formatting for KB, MB, and GB thresholds
 * - Verify duration formatting for short and long videos
 *
 * Boundaries:
 * - Does not test UI rendering
 */

import { describe, it, expect } from "vitest";
import { formatSize, formatDuration } from "./formatters";

describe("Formatters Utility", () => {
    describe("formatSize", () => {
        it("should format KB correctly", () => {
            expect(formatSize(1024)).toBe("1 KB");
            expect(formatSize(500 * 1024)).toBe("500 KB");
        });

        it("should format MB correctly", () => {
            expect(formatSize(1024 * 1024)).toBe("1.0 MB");
            expect(formatSize(5.5 * 1024 * 1024)).toBe("5.5 MB");
        });

        it("should format GB correctly", () => {
            expect(formatSize(1024 * 1024 * 1024)).toBe("1.00 GB");
            expect(formatSize(1.23 * 1024 * 1024 * 1024)).toBe("1.23 GB");
        });

        it("should handle zero or negative inputs", () => {
            expect(formatSize(0)).toBe("0 KB");
            expect(formatSize(-100)).toBe("0 KB");
        });
    });

    describe("formatDuration", () => {
        it("should format minutes and seconds", () => {
            expect(formatDuration(65)).toBe("1:05");
            expect(formatDuration(59)).toBe("0:59");
        });

        it("should format hours, minutes, and seconds", () => {
            expect(formatDuration(3661)).toBe("1:01:01");
            expect(formatDuration(7200)).toBe("2:00:00");
        });

        it("should return empty string for zero or negative inputs", () => {
            expect(formatDuration(0)).toBe("");
            expect(formatDuration(-10)).toBe("");
        });
    });
});
