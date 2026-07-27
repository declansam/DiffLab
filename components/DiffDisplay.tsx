"use client";

import React from "react";
import type { DiffPart, SideBySideRow } from "@/lib/diffUtils";

/** A single line in the inline view, composed of styled segments. */
interface InlineLine {
    lineNumber: number;
    segments: { text: string; status: "added" | "removed" | "unchanged" }[];
    hasChange: boolean;
}

/**
 * Convert word-level diff parts into line-based structure so we can
 * add data-diff-change attributes and support navigation/minimap.
 */
function buildInlineLines(parts: DiffPart[]): InlineLine[] {
    const lines: InlineLine[] = [];
    let currentLine: InlineLine["segments"] = [];
    let lineNum = 1;
    let lineHasChange = false;

    const flushLine = () => {
        lines.push({ lineNumber: lineNum, segments: currentLine, hasChange: lineHasChange });
        lineNum++;
        currentLine = [];
        lineHasChange = false;
    };

    for (const part of parts) {
        const status: "added" | "removed" | "unchanged" = part.added ? "added" : part.removed ? "removed" : "unchanged";
        if (status !== "unchanged") lineHasChange = true;

        const text = part.value;
        const subLines = text.split("\n");

        for (let i = 0; i < subLines.length; i++) {
            if (i > 0) {
                // A newline boundary — flush the current line
                flushLine();
                if (status !== "unchanged") lineHasChange = true;
            }
            if (subLines[i].length > 0) {
                currentLine.push({ text: subLines[i], status });
            }
        }
    }

    // Flush any remaining content
    if (currentLine.length > 0) {
        flushLine();
    }

    return lines;
}

export type DiffDisplayProps = {
    mode: "side-by-side" | "inline";
    sideBySideRows?: SideBySideRow[];
    inlineParts?: DiffPart[];
    className?: string;
    splitRatio?: number;
    isDesktop?: boolean;
    startDragging?: (containerRef: React.RefObject<HTMLElement | null>) => (e: React.MouseEvent | React.TouchEvent) => void;
    resetSplitRatio?: () => void;
};

export default function DiffDisplay({
    mode,
    sideBySideRows,
    inlineParts,
    className,
    splitRatio,
    isDesktop,
    startDragging,
    resetSplitRatio,
}: DiffDisplayProps) {
    const gridRef = React.useRef<HTMLDivElement>(null);
    const showDivider = isDesktop && splitRatio !== undefined && startDragging;

    if (mode === "side-by-side") {
        return (
            <div className={className}>
                <div
                    ref={gridRef}
                    className="relative grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 w-full text-xs"
                    style={isDesktop && splitRatio !== undefined ? { gridTemplateColumns: `${splitRatio}fr ${1 - splitRatio}fr` } : undefined}
                >
                    <div className="font-semibold text-slate-800 pb-2 border-b border-slate-200">Original</div>
                    <div className="font-semibold text-slate-800 pb-2 border-b border-slate-200 lg:hidden">Modified</div>
                    <div className="font-semibold text-slate-800 pb-2 border-b border-slate-200 hidden lg:block">Modified</div>
                    {sideBySideRows?.map((row, idx) => {
                        const isChanged = row.changeType !== "unchanged";
                        const leftClasses =
                            row.changeType === "removed"
                                ? "bg-red-50 border-l-4 border-red-400 text-red-800"
                                : row.changeType === "modified" && row.leftText !== null
                                    ? "bg-red-50 border-l-4 border-red-400 text-red-800"
                                    : row.changeType === "unchanged"
                                        ? "text-slate-700"
                                        : "text-slate-700";
                        const rightClasses =
                            row.changeType === "added"
                                ? "bg-green-50 border-l-4 border-green-400 text-green-800"
                                : row.changeType === "modified" && row.rightText !== null
                                    ? "bg-green-50 border-l-4 border-green-400 text-green-800"
                                    : row.changeType === "unchanged"
                                        ? "text-slate-700"
                                        : "text-slate-700";
                        return (
                            <React.Fragment key={idx}>
                                <div
                                    className={`flex gap-2 sm:gap-3 items-start font-mono px-2 -mb-2 rounded-md ${leftClasses}`}
                                    {...(isChanged ? { "data-diff-change": row.changeType, "data-diff-row-idx": idx } : {})}
                                >
                                    <span className="select-none w-8 text-right pr-2 text-slate-500 font-medium text-xs leading-none flex-shrink-0">{row.leftLineNumber ?? ""}</span>
                                    <span className="flex-1 leading-none text-xs break-words whitespace-pre-wrap">{row.leftText ?? ""}</span>
                                </div>
                                <div className={`flex gap-2 sm:gap-3 items-start font-mono px-2 -mb-2 rounded-md ${rightClasses}`}>
                                    <span className="select-none w-8 text-right pr-2 text-slate-500 font-medium text-xs leading-none flex-shrink-0">{row.rightLineNumber ?? ""}</span>
                                    <span className="flex-1 leading-none text-xs break-words whitespace-pre-wrap">{row.rightText ?? ""}</span>
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {/* Drag handle to resize the split (desktop only) */}
                    {showDivider && (
                        <div
                            className="group absolute inset-y-0 w-3 -ml-1.5 cursor-col-resize z-[5]"
                            style={{ left: `${splitRatio! * 100}%` }}
                            onMouseDown={startDragging!(gridRef)}
                            onTouchStart={startDragging!(gridRef)}
                            onDoubleClick={resetSplitRatio}
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Resize diff columns"
                            title="Drag to resize • double-click to reset"
                        >
                            <div className="mx-auto h-full w-px bg-slate-300 group-hover:bg-blue-400 group-hover:w-0.5 transition-colors" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Inline view — line-based with data attributes for navigation
    const inlineLines = buildInlineLines(inlineParts ?? []);

    const statusClasses = {
        added: "text-green-800 bg-green-100 px-1 py-px rounded font-medium",
        removed: "text-red-800 bg-red-100 px-1 py-px rounded line-through font-medium",
        unchanged: "text-slate-800",
    };

    return (
        <div className={className}>
            <div className="font-mono text-xs sm:text-sm leading-relaxed text-slate-800">
                {inlineLines.map((line, idx) => (
                    <div
                        key={idx}
                        className={`flex items-start gap-2 px-2 py-0.5 rounded-sm ${
                            line.hasChange ? "bg-amber-50/60" : ""
                        }`}
                        {...(line.hasChange ? { "data-diff-change": "modified", "data-diff-row-idx": idx } : {})}
                    >
                        <span className="select-none w-8 text-right pr-2 text-slate-400 font-medium text-xs leading-relaxed flex-shrink-0">
                            {line.lineNumber}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-words">
                            {line.segments.map((seg, i) => (
                                <span key={i} className={statusClasses[seg.status]}>
                                    {seg.text}
                                </span>
                            ))}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
