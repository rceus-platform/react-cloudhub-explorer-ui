/**
 * FileLibraryHero Component
 *
 * Responsibilities:
 * - Render a high-impact cinematic hero section for the current folder
 * - Display library synchronization status and item counts
 *
 * Boundaries:
 * - Does not manage navigation or file grid state
 */

import React from "react";
import { motion } from "framer-motion";

interface FileLibraryHeroProps {
    title: string;
    itemCount: number;
    isLoading: boolean;
}

/** Premium hero section with Netflix-style cinematic typography */
export const FileLibraryHero: React.FC<FileLibraryHeroProps> = ({
    title, itemCount, isLoading
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{
                marginTop: "60px",
                marginBottom: "40px",
                textAlign: "left",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        textTransform: "uppercase",
                        letterSpacing: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-secondary)"
                    }}
                >
                    {isLoading ? "Synchronizing" : "Exploring Library"}
                </motion.span>
 
                <h1 style={{
                    fontSize: "clamp(32px, 6vw, 56px)",
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                    lineHeight: 0.9,
                    background: "linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.6) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "12px"
                }}>
                    {title}
                </h1>

                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: isLoading ? "var(--accent-color)" : "#4ade80",
                            boxShadow: `0 0 12px ${isLoading ? "var(--accent-color)" : "#4ade80"}`
                        }} />
                        <span style={{ fontSize: "14px", fontWeight: 600, opacity: 0.8 }}>
                            {isLoading ? "Fetching cloud data..." : "Library Ready"}
                        </span>
                    </div>

                    <div style={{ height: "16px", width: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />

                    <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>
                        {itemCount} media assets available
                    </span>
                </div>
            </div>
        </motion.div>
    );
};
