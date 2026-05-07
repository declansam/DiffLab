"use client";

import React from "react";
import { Files, Share2, Check } from "lucide-react";
import type { TextPanelState } from "@/hooks/useTextPanel";

const ACCEPTED_FILE_TYPES = ".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.hpp,.cs,.php,.rb,.go,.rs,.kt,.swift,.scala,.sh,.bash,.zsh,.css,.scss,.sass,.less,.html,.xml,.json,.yaml,.yml,.toml,.ini,.cfg,.conf,.log,.sql,.r,.m,.mat,.v,.vhd,.vhdl,.sv,.svh,.asm,.s,.pl,.pm,.lua,.vim,.el,.clj,.ex,.exs,.erl,.hrl,.fs,.fsx,.ml,.mli,.hs,.lhs,.dart,.groovy,.gradle,.proto,.thrift";

interface ActionBarProps {
    leftPanel: TextPanelState;
    rightPanel: TextPanelState;
    showCopySuccess: boolean;
    generateShareLink: () => Promise<void>;
}

/**
 * Action buttons row: "Compare Two Files" and "Share Link".
 */
export default function ActionBar({ leftPanel, rightPanel, showCopySuccess, generateShareLink }: ActionBarProps) {
    const handleCompareTwoFiles = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length >= 2) {
            leftPanel.handleFileUpload(files[0]);
            rightPanel.handleFileUpload(files[1]);
        } else if (files && files.length === 1) {
            leftPanel.handleFileUpload(files[0]);
        }
    }, [leftPanel, rightPanel]);

    return (
        <div className="flex justify-center items-center gap-3 flex-wrap">
            <label className="cursor-pointer bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                <Files className="w-4 h-4" />
                Compare Two Files
                <input
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_FILE_TYPES}
                    multiple
                    onChange={handleCompareTwoFiles}
                />
            </label>

            <button
                onClick={generateShareLink}
                disabled={!leftPanel.text && !rightPanel.text}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                title="Copy shareable link to clipboard"
            >
                {showCopySuccess ? (
                    <>
                        <Check className="w-4 h-4" />
                        Link Copied!
                    </>
                ) : (
                    <>
                        <Share2 className="w-4 h-4" />
                        Share Link
                    </>
                )}
            </button>
        </div>
    );
}
