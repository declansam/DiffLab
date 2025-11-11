"use client";

import React from "react";
import type { SideBySideRow } from "@/lib/diffUtils";

export type DiffMinimapProps = {
    sideBySideRows?: SideBySideRow[];
    containerRef: React.RefObject<HTMLDivElement | null>;
};

export default function DiffMinimap({ sideBySideRows, containerRef }: DiffMinimapProps) {
    const minimapRef = React.useRef<HTMLDivElement>(null);
    const [viewportPosition, setViewportPosition] = React.useState(0);
    const [viewportHeight, setViewportHeight] = React.useState(0);

    // Update viewport position and height on scroll
    React.useEffect(() => {
        const updateViewport = () => {
            if (!containerRef.current || !minimapRef.current) return;

            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const containerTop = containerRect.top + window.scrollY;
            const containerHeight = container.scrollHeight;
            const windowHeight = window.innerHeight;
            const scrollTop = window.scrollY;

            // Calculate viewport position relative to container
            const relativeScrollTop = scrollTop - containerTop;
            const viewportPercentage = relativeScrollTop / containerHeight;
            const viewportHeightPercentage = windowHeight / containerHeight;

            setViewportPosition(viewportPercentage * 100);
            setViewportHeight(viewportHeightPercentage * 100);
        };

        updateViewport();
        window.addEventListener("scroll", updateViewport);
        window.addEventListener("resize", updateViewport);

        return () => {
            window.removeEventListener("scroll", updateViewport);
            window.removeEventListener("resize", updateViewport);
        };
    }, [containerRef]);

    // Handle click on minimap to scroll to position
    const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !minimapRef.current) return;

        const minimap = minimapRef.current;
        const rect = minimap.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const percentage = clickY / rect.height;

        const container = containerRef.current;
        const containerTop = container.getBoundingClientRect().top + window.scrollY;
        const containerHeight = container.scrollHeight;
        const targetScroll = containerTop + (percentage * containerHeight) - (window.innerHeight / 2);

        window.scrollTo({ top: targetScroll, behavior: "smooth" });
    };

    if (!sideBySideRows || sideBySideRows.length === 0) {
        return null;
    }

    return (
        <div
            ref={minimapRef}
            className="fixed right-0 top-16 bottom-0 w-3 bg-slate-100/50 border-l border-slate-200 z-30 cursor-pointer hover:w-4 transition-all duration-200 group"
            onClick={handleMinimapClick}
        >
            {/* Render change indicators */}
            {sideBySideRows.map((row, idx) => {
                const positionPercent = (idx / sideBySideRows.length) * 100;
                const heightPercent = (1 / sideBySideRows.length) * 100;

                let colorClass = "";
                if (row.changeType === "added") {
                    colorClass = "bg-green-500/70 hover:bg-green-500";
                } else if (row.changeType === "removed") {
                    colorClass = "bg-red-500/70 hover:bg-red-500";
                } else if (row.changeType === "modified") {
                    colorClass = "bg-blue-500/70 hover:bg-blue-500";
                } else {
                    return null; // Don't render unchanged lines
                }

                return (
                    <div
                        key={idx}
                        className={`absolute left-0 right-0 ${colorClass} transition-colors`}
                        style={{
                            top: `${positionPercent}%`,
                            height: `${Math.max(heightPercent, 0.5)}%`,
                        }}
                        title={
                            row.changeType === "added"
                                ? "Addition"
                                : row.changeType === "removed"
                                    ? "Deletion"
                                    : "Modification"
                        }
                    />
                );
            })}

            {/* Viewport indicator */}
            <div
                className="absolute left-0 right-0 bg-slate-800/20 border-y border-slate-800/40 pointer-events-none"
                style={{
                    top: `${Math.max(0, Math.min(100, viewportPosition))}%`,
                    height: `${Math.max(0, Math.min(100, viewportHeight))}%`,
                }}
            />
        </div>
    );
}
