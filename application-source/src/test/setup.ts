/**
 * Test Setup Module
 *
 * Responsibilities:
 * - Configure testing environment (Vitest/DOM)
 * - Provide global mocks and helpers
 *
 * Boundaries:
 * - Does not contain actual test cases
 */

import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// Cache for mock components to avoid re-renders and identity issues
const componentCache: Record<string, React.FC<unknown>> = {};

const getMockComponent = (tag: string) => {
    if (!componentCache[tag]) {
        componentCache[tag] = React.forwardRef(({ children, ...props }: React.PropsWithChildren<unknown>, ref: React.ForwardedRef<HTMLElement>) => {
            const domProps = { ...props } as Record<string, unknown>;
            const framerProps = ['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'whileInView', 'viewport', 'layout'];
            framerProps.forEach(prop => delete domProps[prop]);
            return React.createElement(tag, { ...domProps, ref }, children);
        }) as unknown as React.FC<unknown>;
        componentCache[tag].displayName = `motion.${tag}`;
    }
    return componentCache[tag];
};

vi.mock("framer-motion", () => ({
    motion: new Proxy({}, {
        get: (_target, prop: string) => {
            return getMockComponent(prop);
        }
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren<unknown>) => children,
    useAnimation: () => ({
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn(),
        set: vi.fn(),
    }),
    useInView: () => [vi.fn(), true],
    useScroll: () => ({ scrollY: { get: () => 0 }, scrollYProgress: { get: () => 0 } }),
    useTransform: (val: unknown) => val,
    useSpring: (val: unknown) => val,
}));
