"use client";

import React from "react";
import ReactDOM from "react-dom";

type Mode = "side-by-side" | "inline";

interface NavbarControlsProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
    ignoreWhitespace: boolean;
    setIgnoreWhitespace: (value: boolean) => void;
    ignoreCase: boolean;
    setIgnoreCase: (value: boolean) => void;
    onClear: () => void;
}

const selectClassName = "bg-white border border-slate-300 rounded px-2 py-1 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
const labelClassName = "text-xs sm:text-sm font-medium text-slate-700";

/**
 * Renders diff controls (view mode, whitespace, case, clear) into the
 * Header's #diff-controls container via React Portal.
 */
export function NavbarControls({
    mode, setMode,
    ignoreWhitespace, setIgnoreWhitespace,
    ignoreCase, setIgnoreCase,
    onClear,
}: NavbarControlsProps) {
    const [container, setContainer] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        setContainer(document.getElementById("diff-controls"));
    }, []);

    if (!container) return null;

    return ReactDOM.createPortal(
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <a
                href="/privacy-policy"
                className="text-sm text-slate-600 hover:text-slate-800 underline underline-offset-4 transition-colors"
            >
                Privacy Policy
            </a>

            <div className="flex items-center gap-1 sm:gap-2">
                <label className={labelClassName}>View:</label>
                <select
                    className={selectClassName}
                    value={mode}
                    onChange={(e) => setMode(e.target.value as Mode)}
                >
                    <option value="side-by-side">Side by side</option>
                    <option value="inline">Inline</option>
                </select>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                <label className={labelClassName}>Whitespace:</label>
                <select
                    className={selectClassName}
                    value={ignoreWhitespace ? "on" : "off"}
                    onChange={(e) => setIgnoreWhitespace(e.target.value === "on")}
                >
                    <option value="on">Ignore</option>
                    <option value="off">Sensitive</option>
                </select>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                <label className={labelClassName}>Case:</label>
                <select
                    className={selectClassName}
                    value={ignoreCase ? "on" : "off"}
                    onChange={(e) => setIgnoreCase(e.target.value === "on")}
                >
                    <option value="on">Ignore</option>
                    <option value="off">Sensitive</option>
                </select>
            </div>

            <button
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
                onClick={onClear}
            >
                Clear
            </button>
        </div>,
        container,
    );
}
