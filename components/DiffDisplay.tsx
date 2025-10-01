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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 lg:gap-3 w-full text-xs sm:text-sm">
                    <div className="font-semibold text-slate-800 pb-2 border-b border-slate-200">Original</div>
                    <div className="font-semibold text-slate-800 pb-2 border-b border-slate-200 lg:hidden">Modified</div>
                    <div className="font-semibold text-slate-800 pb-2 border-b border-slate-200 hidden lg:block">Modified</div>
                    {sideBySideRows?.map((row, idx) => {
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
                                <div className={`flex gap-2 sm:gap-3 items-start font-mono px-1.5 sm:px-2 rounded-md ${leftClasses}`}>
                                    <span className="select-none w-8 sm:w-10 text-right pr-1 sm:pr-2 text-slate-500 font-medium text-xs leading-none flex-shrink-0">{row.leftLineNumber ?? ""}</span>
                                    <span className="flex-1 leading-none text-xs sm:text-sm break-words">{row.leftText ?? ""}</span>
                                </div>
                                <div className={`flex gap-2 sm:gap-3 items-start font-mono px-1.5 sm:px-2 rounded-md ${rightClasses}`}>
                                    <span className="select-none w-8 sm:w-10 text-right pr-1 sm:pr-2 text-slate-500 font-medium text-xs leading-none flex-shrink-0">{row.rightLineNumber ?? ""}</span>
                                    <span className="flex-1 leading-none text-xs sm:text-sm break-words">{row.rightText ?? ""}</span>
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
            <div className="font-mono text-xs sm:text-sm leading-none text-slate-800 p-2 sm:p-3 break-words">
                {inline.map((p, i) => {
                    const cls =
                        p.status === "added"
                            ? "text-green-800 bg-green-100 px-1 py-0.5 rounded font-medium"
                            : p.status === "removed"
                                ? "text-red-800 bg-red-100 px-1 py-0.5 rounded line-through font-medium"
                                : "text-slate-800";
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


