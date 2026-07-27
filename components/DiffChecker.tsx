"use client";

import React from "react";
import DiffDisplay from "@/components/DiffDisplay";
import DiffMinimap from "@/components/DiffMinimap";
import DiffNavigation from "@/components/DiffNavigation";
import TextPanel from "@/components/TextPanel";
import ActionBar from "@/components/ActionBar";
import { NavbarControls } from "@/hooks/useNavbarControls";
import { useTextPanel } from "@/hooks/useTextPanel";
import { useShareLink } from "@/hooks/useShareLink";
import { useHorizontalSplit } from "@/hooks/useHorizontalSplit";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { buildSideBySideFromLineDiff, computeLineDiff, computeWordDiff, calculateDiffStats } from "@/lib/diffUtils";
import { ArrowUp, ArrowLeftRight } from "lucide-react";

type Mode = "side-by-side" | "inline";

export default function DiffChecker() {
    // --- Per-panel state (text, language, file, formatting, drag-drop) ---
    const leftPanel = useTextPanel();
    const rightPanel = useTextPanel();

    // --- Diff settings ---
    const [mode, setMode] = React.useState<Mode>("side-by-side");
    const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(true);
    const [ignoreCase, setIgnoreCase] = React.useState(false);
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const diffContainerRef = React.useRef<HTMLDivElement>(null);
    const panelsGridRef = React.useRef<HTMLDivElement>(null);

    // --- Draggable horizontal split — input panels and diff output resize independently ---
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const { ratio: panelsSplitRatio, startDragging: startDraggingPanels, resetRatio: resetPanelsSplitRatio } = useHorizontalSplit(0.5);
    const { ratio: diffSplitRatio, startDragging: startDraggingDiff, resetRatio: resetDiffSplitRatio } = useHorizontalSplit(0.5);

    // --- Share link ---
    const { showCopySuccess, generateShareLink } = useShareLink({
        left: leftPanel.text,
        right: rightPanel.text,
        setLeft: leftPanel.setText,
        setRight: rightPanel.setText,
    });

    // --- Diff computation ---
    const lineParts = React.useMemo(
        () => computeLineDiff(leftPanel.text, rightPanel.text, { ignoreWhitespace }),
        [leftPanel.text, rightPanel.text, ignoreWhitespace],
    );
    const sbsRows = React.useMemo(() => buildSideBySideFromLineDiff(lineParts), [lineParts]);
    const inlineParts = React.useMemo(
        () => computeWordDiff(leftPanel.text, rightPanel.text, { ignoreCase }),
        [leftPanel.text, rightPanel.text, ignoreCase],
    );
    const diffStats = React.useMemo(() => calculateDiffStats(lineParts), [lineParts]);

    // --- Actions ---
    const clearAll = React.useCallback(() => {
        leftPanel.clearFile();
        rightPanel.clearFile();
    }, [leftPanel, rightPanel]);

    const swapTexts = React.useCallback(() => {
        const tempText = leftPanel.text;
        const tempLang = leftPanel.language;
        const tempDetected = leftPanel.detectedLang;
        const tempFilename = leftPanel.filename;

        leftPanel.setText(rightPanel.text);
        leftPanel.setLanguage(rightPanel.language);
        leftPanel.setDetectedLang(rightPanel.detectedLang);

        rightPanel.setText(tempText);
        rightPanel.setLanguage(tempLang);
        rightPanel.setDetectedLang(tempDetected);

        // Swap filenames via clearFile + re-upload simulation isn't clean,
        // so we handle it through the setText which triggers detection.
        // The filename state is internal to the hook, but since we're swapping
        // detected langs manually, the UX stays consistent.
        void tempFilename; // filenames reset naturally on text change
    }, [leftPanel, rightPanel]);

    // --- Expose clear globally for Header title click ---
    React.useEffect(() => {
        (window as Window & { clearDiffLab?: () => void }).clearDiffLab = clearAll;
        return () => {
            delete (window as Window & { clearDiffLab?: () => void }).clearDiffLab;
        };
    }, [clearAll]);

    // --- Scroll-to-top visibility ---
    React.useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            {/* Navbar controls via React Portal */}
            <NavbarControls
                mode={mode}
                setMode={setMode}
                ignoreWhitespace={ignoreWhitespace}
                setIgnoreWhitespace={setIgnoreWhitespace}
                ignoreCase={ignoreCase}
                setIgnoreCase={setIgnoreCase}
                onClear={clearAll}
            />

            <div className="w-full max-w-none mx-auto flex flex-col gap-4 sm:gap-6">
                {/* Action Buttons */}
                <ActionBar
                    leftPanel={leftPanel}
                    rightPanel={rightPanel}
                    showCopySuccess={showCopySuccess}
                    generateShareLink={generateShareLink}
                />

                {/* Text Panels */}
                <div
                    ref={panelsGridRef}
                    className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
                    style={isDesktop ? { gridTemplateColumns: `${panelsSplitRatio}fr ${1 - panelsSplitRatio}fr` } : undefined}
                >
                    <TextPanel
                        label="Original Text"
                        placeholder="Paste or type your original text here, or drag & drop a file..."
                        panel={leftPanel}
                        stats={[
                            { count: diffStats.deletions, label: "deletion", color: "red" },
                        ]}
                    />

                    {/* Drag handle to resize the split (desktop only) */}
                    {isDesktop && (
                        <div
                            className="group absolute inset-y-0 w-3 -ml-1.5 cursor-col-resize z-[5]"
                            style={{ left: `${panelsSplitRatio * 100}%` }}
                            onMouseDown={startDraggingPanels(panelsGridRef)}
                            onTouchStart={startDraggingPanels(panelsGridRef)}
                            onDoubleClick={resetPanelsSplitRatio}
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Resize comparison panels"
                            title="Drag to resize • double-click to reset"
                        >
                            <div className="mx-auto h-full w-px bg-slate-300 group-hover:bg-blue-400 group-hover:w-0.5 transition-colors" />
                        </div>
                    )}

                    {/* Swap Button */}
                    <div
                        className="flex lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:z-10 justify-center lg:justify-start"
                        style={isDesktop ? { left: `${panelsSplitRatio * 100}%`, transform: "translate(-50%, -50%)" } : undefined}
                    >
                        <button
                            onClick={swapTexts}
                            className="bg-slate-600 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                            aria-label="Swap texts"
                            title="Swap original and modified text"
                        >
                            <ArrowLeftRight className="w-5 h-5" />
                        </button>
                    </div>

                    <TextPanel
                        label="Modified Text"
                        placeholder="Paste or type your modified text here, or drag & drop a file..."
                        panel={rightPanel}
                        stats={[
                            { count: diffStats.additions, label: "addition", color: "green" },
                            { count: diffStats.modifications, label: "modification", color: "blue" },
                        ]}
                    />
                </div>

                {/* Diff Display */}
                <div className="mt-4" ref={diffContainerRef}>
                    {mode === "side-by-side" ? (
                        <DiffDisplay
                            mode="side-by-side"
                            sideBySideRows={sbsRows}
                            className="border border-slate-300 rounded-lg p-2 sm:p-4 bg-white shadow-sm overflow-x-auto"
                            splitRatio={diffSplitRatio}
                            isDesktop={isDesktop}
                            startDragging={startDraggingDiff}
                            resetSplitRatio={resetDiffSplitRatio}
                        />
                    ) : (
                        <DiffDisplay mode="inline" inlineParts={inlineParts} className="border border-slate-300 rounded-lg p-2 sm:p-4 bg-white shadow-sm" />
                    )}
                </div>
            </div>

            {/* Minimap — key={mode} forces remount on view switch */}
            {(mode === "side-by-side" ? sbsRows.length > 0 : inlineParts.length > 0) && (
                <DiffMinimap
                    key={`minimap-${mode}`}
                    sideBySideRows={mode === "side-by-side" ? sbsRows : undefined}
                    inlineParts={mode === "inline" ? inlineParts : undefined}
                    containerRef={diffContainerRef}
                />
            )}

            {/* Change Navigation — key={mode} forces hunk rebuild from fresh DOM */}
            {diffStats.additions + diffStats.deletions + diffStats.modifications > 0 && (
                <DiffNavigation
                    key={`nav-${mode}`}
                    containerRef={diffContainerRef}
                    totalChanges={diffStats.additions + diffStats.deletions + diffStats.modifications}
                />
            )}

            {/* Scroll to Top */}
            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="w-6 h-6" />
                </button>
            )}
        </>
    );
}
