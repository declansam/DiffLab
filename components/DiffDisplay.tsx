"use client";

import React from "react";
import type { DiffPart, SideBySideRow } from "@/lib/diffUtils";

type InlinePart = {
    text: string;
    status: "added" | "removed" | "unchanged";
};

function renderInline(parts: DiffPart[]): InlinePart[] {
    const rendered: InlinePart[] = [];
    for (const p of parts) {
        const status: InlinePart["status"] = p.added ? "added" : p.removed ? "removed" : "unchanged";
        const value = p.value;
        if (value.length === 0) continue;
        rendered.push({ text: value, status });
    }
    return rendered;
}

export type DiffDisplayProps = {
    mode: "side-by-side" | "inline";
    sideBySideRows?: SideBySideRow[];
    inlineParts?: DiffPart[];
    className?: string;
};

export default function DiffDisplay({ mode, sideBySideRows, inlineParts, className }: DiffDisplayProps) {
    if (mode === "side-by-side") {
        return (
            <div className={className}>
                <div className="grid grid-cols-2 gap-4 w-full text-sm">
                    <div className="font-medium opacity-80">Left</div>
                    <div className="font-medium opacity-80">Right</div>
                    {sideBySideRows?.map((row, idx) => {
                        const leftClasses =
                            row.changeType === "removed"
                                ? "bg-rose-50 dark:bg-rose-900/40 border-l-4 border-rose-500/80"
                                : row.changeType === "unchanged"
                                    ? ""
                                    : "";
                        const rightClasses =
                            row.changeType === "added"
                                ? "bg-emerald-50 dark:bg-emerald-900/40 border-l-4 border-emerald-500/80"
                                : row.changeType === "unchanged"
                                    ? ""
                                    : "";
                        return (
                            <React.Fragment key={idx}>
                                <div className={`flex gap-3 items-start whitespace-pre-wrap font-mono ${leftClasses}`}>
                                    <span className="select-none w-10 text-right pr-2 opacity-50">{row.leftLineNumber ?? ""}</span>
                                    <span className="flex-1">{row.leftText ?? ""}</span>
                                </div>
                                <div className={`flex gap-3 items-start whitespace-pre-wrap font-mono ${rightClasses}`}>
                                    <span className="select-none w-10 text-right pr-2 opacity-50">{row.rightLineNumber ?? ""}</span>
                                    <span className="flex-1">{row.rightText ?? ""}</span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        );
    }

    // inline
    const inline = renderInline(inlineParts ?? []);
    return (
        <div className={className}>
            <div className="prose prose-sm max-w-none font-mono whitespace-pre-wrap">
                {inline.map((p, i) => {
                    const cls =
                        p.status === "added"
                            ? "text-emerald-200 bg-emerald-900/40 underline decoration-emerald-400/60"
                            : p.status === "removed"
                                ? "text-rose-200 bg-rose-900/40 line-through decoration-rose-400/60"
                                : "";
                    return (
                        <span key={i} className={cls}>
                            {p.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}


