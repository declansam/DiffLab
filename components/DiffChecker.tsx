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

    // Render controls to navbar
    React.useEffect(() => {
        const controlsContainer = document.getElementById('diff-controls');
        if (controlsContainer) {
            // Clear existing controls
            controlsContainer.innerHTML = '';
            
            // Create controls wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-wrap items-center gap-2 sm:gap-4';
            
            // View control
            const viewDiv = document.createElement('div');
            viewDiv.className = 'flex items-center gap-1 sm:gap-2';
            viewDiv.innerHTML = `
                <label class="text-xs sm:text-sm font-medium text-slate-700">View:</label>
                <select class="bg-white border border-slate-300 rounded px-2 py-1 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="side-by-side" ${mode === 'side-by-side' ? 'selected' : ''}>Side by side</option>
                    <option value="inline" ${mode === 'inline' ? 'selected' : ''}>Inline</option>
                </select>
            `;
            viewDiv.querySelector('select')?.addEventListener('change', (e) => setMode((e.target as HTMLSelectElement).value as Mode));
            
            // Whitespace control
            const whitespaceDiv = document.createElement('div');
            whitespaceDiv.className = 'flex items-center gap-1 sm:gap-2';
            whitespaceDiv.innerHTML = `
                <label class="text-xs sm:text-sm font-medium text-slate-700">Whitespace:</label>
                <select class="bg-white border border-slate-300 rounded px-2 py-1 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="on" ${ignoreWhitespace ? 'selected' : ''}>Ignore</option>
                    <option value="off" ${!ignoreWhitespace ? 'selected' : ''}>Respect</option>
                </select>
            `;
            whitespaceDiv.querySelector('select')?.addEventListener('change', (e) => setIgnoreWhitespace((e.target as HTMLSelectElement).value === 'on'));
            
            // Case control
            const caseDiv = document.createElement('div');
            caseDiv.className = 'flex items-center gap-1 sm:gap-2';
            caseDiv.innerHTML = `
                <label class="text-xs sm:text-sm font-medium text-slate-700">Case:</label>
                <select class="bg-white border border-slate-300 rounded px-2 py-1 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="on" ${ignoreCase ? 'selected' : ''}>Ignore</option>
                    <option value="off" ${!ignoreCase ? 'selected' : ''}>Sensitive</option>
                </select>
            `;
            caseDiv.querySelector('select')?.addEventListener('change', (e) => setIgnoreCase((e.target as HTMLSelectElement).value === 'on'));
            
            wrapper.appendChild(viewDiv);
            wrapper.appendChild(whitespaceDiv);
            wrapper.appendChild(caseDiv);
            controlsContainer.appendChild(wrapper);
        }
    }, [mode, ignoreWhitespace, ignoreCase]);

    return (
        <div className="w-full max-w-none xl:max-w-screen-2xl mx-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex flex-col gap-2 sm:gap-3">
                    <label className="text-sm sm:text-base font-semibold text-slate-800">Original Text</label>
                    <textarea
            className="min-h-48 sm:min-h-64 h-48 sm:h-64 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        placeholder="Paste or type your original text here..."
                        value={left}
                        onChange={(e) => setLeft(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                    <label className="text-sm sm:text-base font-semibold text-slate-800">Modified Text</label>
                    <textarea
            className="min-h-48 sm:min-h-64 h-48 sm:h-64 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        placeholder="Paste or type your modified text here..."
                        value={right}
                        onChange={(e) => setRight(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-4">
                {mode === "side-by-side" ? (
                    <DiffDisplay mode="side-by-side" sideBySideRows={sbsRows} className="border border-slate-300 rounded-lg p-2 sm:p-4 bg-white shadow-sm overflow-x-auto" />
                ) : (
                    <DiffDisplay mode="inline" inlineParts={inlineParts} className="border border-slate-300 rounded-lg p-2 sm:p-4 bg-white shadow-sm" />
                )}
            </div>
        </div>
    );
}


