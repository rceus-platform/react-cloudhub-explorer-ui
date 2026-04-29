/**
 * Skeleton UI Module
 *
 * Responsibilities:
 * - Provide reusable pulsing placeholder components for loading states
 * - Define standard skeleton layouts for complex UI elements (e.g., FileCard)
 *
 * Boundaries:
 * - Does not handle loading state logic (stateless)
 */

import React from "react";

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
}

/** Basic pulsing placeholder for loading states */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = "100%",
    height = "100%",
    borderRadius = "8px",
    className = ""
}) => {
    return (
        <div
            className={`skeleton-pulse ${className}`}
            style={{
                width,
                height,
                borderRadius
            }}
        />
    );
};

/** Pre-defined skeleton layout for FileCard components */
export const FileCardSkeleton = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Skeleton height="150px" />
        <Skeleton height="20px" width="70%" />
        <Skeleton height="14px" width="40%" />
    </div>
);
