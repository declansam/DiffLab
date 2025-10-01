"use client";

import React from "react";
import DiffDisplay from "@/components/DiffDisplay";
import { buildSideBySideFromLineDiff, computeLineDiff, computeWordDiff } from "@/lib/diffUtils";

type Mode = "side-by-side" | "inline";

export default function DiffChecker() {
    const [left, setLeft] = React.useState("");
    const [right, setRight] = React.useState("");
    const [mode, setMode] = React.useState<Mode>("side-by-side");
    const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(true);
    const [ignoreCase, setIgnoreCase] = React.useState(false);

    const lineParts = React.useMemo(() => computeLineDiff(left, right, { ignoreWhitespace }), [left, right, ignoreWhitespace]);
    const sbsRows = React.useMemo(() => buildSideBySideFromLineDiff(lineParts), [lineParts]);
    const inlineParts = React.useMemo(() => computeWordDiff(left, right, { ignoreCase }), [left, right, ignoreCase]);

  return (
    <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 p-2 rounded-md border border-black/10 dark:border-white/15">
          <label className="text-xs opacity-80">View</label>
          <select
            className="bg-transparent border border-black/10 dark:border-white/15 rounded px-2 py-1 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="side-by-side">Side by side</option>
            <option value="inline">Inline</option>
          </select>
          <label className="text-xs opacity-80 ml-3">Whitespace</label>
          <select
            className="bg-transparent border border-black/10 dark:border-white/15 rounded px-2 py-1 text-sm"
            value={ignoreWhitespace ? "on" : "off"}
            onChange={(e) => setIgnoreWhitespace(e.target.value === "on")}
          >
            <option value="on">Ignore</option>
            <option value="off">Respect</option>
          </select>
          <label className="text-xs opacity-80 ml-3">Case (inline)</label>
          <select
            className="bg-transparent border border-black/10 dark:border-white/15 rounded px-2 py-1 text-sm"
            value={ignoreCase ? "on" : "off"}
            onChange={(e) => setIgnoreCase(e.target.value === "on")}
          >
            <option value="on">Ignore</option>
            <option value="off">Sensitive</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Left</label>
                    <textarea
            className="min-h-64 h-64 w-full resize-y rounded-md border border-black/10 dark:border-white/15 bg-transparent p-3 font-mono"
                        placeholder="Paste or type text here..."
                        value={left}
                        onChange={(e) => setLeft(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Right</label>
                    <textarea
            className="min-h-64 h-64 w-full resize-y rounded-md border border-black/10 dark:border-white/15 bg-transparent p-3 font-mono"
                        placeholder="Paste or type text here..."
                        value={right}
                        onChange={(e) => setRight(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-2">
                {mode === "side-by-side" ? (
                    <DiffDisplay mode="side-by-side" sideBySideRows={sbsRows} className="border border-black/10 dark:border-white/15 rounded-md p-3" />
                ) : (
                    <DiffDisplay mode="inline" inlineParts={inlineParts} className="border border-black/10 dark:border-white/15 rounded-md p-3" />
                )}
            </div>
        </div>
    );
}


