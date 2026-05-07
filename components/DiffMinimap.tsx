"use client";

import React from "react";
import type { DiffPart, SideBySideRow } from "@/lib/diffUtils";

/** A simplified change indicator for minimap rendering. */
interface MinimapEntry {
    changeType: "unchanged" | "added" | "removed" | "modified";
}

/**
 * Convert inline diff parts into line-based minimap entries.
 * Mirrors the logic in DiffDisplay's buildInlineLines.
 */
function buildMinimapFromInline(parts: DiffPart[]): MinimapEntry[] {
    const entries: MinimapEntry[] = [];
    let lineHasAdded = false;
    let lineHasRemoved = false;

    const flushLine = () => {
        let changeType: MinimapEntry["changeType"] = "unchanged";
        if (lineHasAdded && lineHasRemoved) changeType = "modified";
        else if (lineHasAdded) changeType = "added";
        else if (lineHasRemoved) changeType = "removed";
        entries.push({ changeType });
        lineHasAdded = false;
        lineHasRemoved = false;
    };

    for (const part of parts) {
        const isAdded = !!part.added;
        const isRemoved = !!part.removed;
        if (isAdded) lineHasAdded = true;
        if (isRemoved) lineHasRemoved = true;

        const subLines = part.value.split("\n");
        for (let i = 0; i < subLines.length; i++) {
            if (i > 0) {
                flushLine();
                if (isAdded) lineHasAdded = true;
                if (isRemoved) lineHasRemoved = true;
            }
        }
    }

    // Flush remaining
    flushLine();

    return entries;
}

function buildMinimapFromSbs(rows: SideBySideRow[]): MinimapEntry[] {
    return rows.map((row) => ({ changeType: row.changeType }));
}

export type DiffMinimapProps = {
    sideBySideRows?: SideBySideRow[];
    inlineParts?: DiffPart[];
    containerRef: React.RefObject<HTMLDivElement | null>;
};

export default function DiffMinimap({ sideBySideRows, inlineParts, containerRef }: DiffMinimapProps) {
    const minimapRef = React.useRef<HTMLDivElement>(null);
    const [viewportPosition, setViewportPosition] = React.useState(0);
    const [viewportHeight, setViewportHeight] = React.useState(0);

    const entries = React.useMemo(() => {
        if (sideBySideRows && sideBySideRows.length > 0) {
            return buildMinimapFromSbs(sideBySideRows);
        }
        if (inlineParts && inlineParts.length > 0) {
            return buildMinimapFromInline(inlineParts);
        }
        return [];
    }, [sideBySideRows, inlineParts]);

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

    if (entries.length === 0) return null;

    const colorMap: Record<string, string> = {
        added: "bg-green-500/70 hover:bg-green-500",
        removed: "bg-red-500/70 hover:bg-red-500",
        modified: "bg-blue-500/70 hover:bg-blue-500",
    };

    const titleMap: Record<string, string> = {
        added: "Addition",
        removed: "Deletion",
        modified: "Modification",
    };

    return (
        <div
            ref={minimapRef}
            className="fixed right-0 top-16 bottom-0 w-3 bg-slate-100/50 border-l border-slate-200 z-30 cursor-pointer hover:w-4 transition-all duration-200 group"
            onClick={handleMinimapClick}
        >
            {/* Render change indicators */}
            {entries.map((entry, idx) => {
                if (entry.changeType === "unchanged") return null;

                const positionPercent = (idx / entries.length) * 100;
                const heightPercent = (1 / entries.length) * 100;
                const colorClass = colorMap[entry.changeType] || "";

                return (
                    <div
                        key={idx}
                        className={`absolute left-0 right-0 ${colorClass} transition-colors`}
                        style={{
                            top: `${positionPercent}%`,
                            height: `${Math.max(heightPercent, 0.5)}%`,
                        }}
                        title={titleMap[entry.changeType] || ""}
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
