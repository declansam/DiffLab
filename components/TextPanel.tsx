"use client";

import React from "react";
import { Wand2, X } from "lucide-react";
import { getLanguageDisplayName, getSupportedLanguages, type Language } from "@/lib/formatUtils";
import type { TextPanelState } from "@/hooks/useTextPanel";

const ACCEPTED_FILE_TYPES = ".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.hpp,.cs,.php,.rb,.go,.rs,.kt,.swift,.scala,.sh,.bash,.zsh,.css,.scss,.sass,.less,.html,.xml,.json,.yaml,.yml,.toml,.ini,.cfg,.conf,.log,.sql,.r,.m,.mat,.v,.vhd,.vhdl,.sv,.svh,.asm,.s,.pl,.pm,.lua,.vim,.el,.clj,.ex,.exs,.erl,.hrl,.fs,.fsx,.ml,.mli,.hs,.lhs,.dart,.groovy,.gradle,.proto,.thrift";

interface StatBadge {
    count: number;
    label: string;
    color: "red" | "green" | "blue";
}

interface TextPanelProps {
    label: string;
    placeholder: string;
    panel: TextPanelState;
    stats?: StatBadge[];
}

const colorMap = {
    red: "text-red-600",
    green: "text-green-600",
    blue: "text-blue-600",
};

/**
 * A reusable text panel with language selector, format button,
 * file upload, drag-drop overlay, and filename badge.
 * Used for both "Original Text" and "Modified Text" sides.
 */
export default function TextPanel({ label, placeholder, panel, stats = [] }: TextPanelProps) {
    return (
        <div className="flex flex-col gap-2 sm:gap-3">
            {/* Header Row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-sm sm:text-base font-semibold text-slate-800">
                    {label}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Stat Badges */}
                    {stats.map((stat) =>
                        stat.count > 0 ? (
                            <span
                                key={stat.label}
                                className={`text-xs sm:text-sm font-medium ${colorMap[stat.color]}`}
                            >
                                {stat.count} {stat.label}{stat.count !== 1 ? "s" : ""}
                            </span>
                        ) : null,
                    )}

                    {/* Language Selector */}
                    <select
                        value={panel.language}
                        onChange={(e) => panel.setLanguage(e.target.value as Language)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        title={panel.language === "auto" ? `Detected: ${getLanguageDisplayName(panel.detectedLang)}` : undefined}
                    >
                        {getSupportedLanguages().map((lang) => (
                            <option key={lang} value={lang}>
                                {getLanguageDisplayName(lang)}
                                {lang === "auto" && panel.detectedLang !== "text"
                                    ? ` (${getLanguageDisplayName(panel.detectedLang)})`
                                    : ""}
                            </option>
                        ))}
                    </select>

                    {/* Format Button */}
                    <button
                        onClick={panel.handleFormat}
                        disabled={!panel.text.trim() || panel.isFormatting}
                        className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                        title="Format code"
                    >
                        <Wand2 className="w-3 h-3" />
                        {panel.isFormatting ? "Formatting..." : "Format"}
                    </button>

                    {/* Upload Button */}
                    <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors">
                        Upload File
                        <input
                            type="file"
                            className="hidden"
                            accept={ACCEPTED_FILE_TYPES}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) panel.handleFileUpload(file);
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* Filename Badge */}
            {panel.filename && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                    <span className="text-xs text-blue-700 font-medium truncate flex-1">
                        {panel.filename}
                    </span>
                    <button
                        onClick={panel.clearFile}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Clear file"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Textarea with Drag-Drop */}
            <div
                className="relative"
                onDragOver={panel.handleDragOver}
                onDragLeave={panel.handleDragLeave}
                onDrop={panel.handleDrop}
            >
                <textarea
                    className="min-h-48 sm:min-h-64 h-48 sm:h-64 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder={placeholder}
                    value={panel.text}
                    onChange={(e) => panel.setText(e.target.value)}
                />
                {panel.isDragging && (
                    <div className="absolute inset-0 bg-blue-100 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center pointer-events-none">
                        <div className="text-blue-600 font-semibold text-lg">Drop file here</div>
                    </div>
                )}
            </div>
        </div>
    );
}
