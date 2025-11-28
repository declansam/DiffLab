"use client";

import React from "react";
import DiffDisplay from "@/components/DiffDisplay";
import DiffMinimap from "@/components/DiffMinimap";
import { buildSideBySideFromLineDiff, computeLineDiff, computeWordDiff, calculateDiffStats } from "@/lib/diffUtils";
import { ArrowUp, ArrowLeftRight, Wand2 } from "lucide-react";
import { detectLanguage, formatCode, getLanguageDisplayName, getSupportedLanguages, type Language } from "@/lib/formatUtils";

type Mode = "side-by-side" | "inline";

export default function DiffChecker() {
    const [left, setLeft] = React.useState("");
    const [right, setRight] = React.useState("");
    const [mode, setMode] = React.useState<Mode>("side-by-side");
    const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(true);
    const [ignoreCase, setIgnoreCase] = React.useState(false);
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const [leftLanguage, setLeftLanguage] = React.useState<Language>("auto");
    const [rightLanguage, setRightLanguage] = React.useState<Language>("auto");
    const [detectedLeftLang, setDetectedLeftLang] = React.useState<Language>("text");
    const [detectedRightLang, setDetectedRightLang] = React.useState<Language>("text");
    const [isFormattingLeft, setIsFormattingLeft] = React.useState(false);
    const [isFormattingRight, setIsFormattingRight] = React.useState(false);
    const diffContainerRef = React.useRef<HTMLDivElement>(null);

    const clearAll = React.useCallback(() => {
        setLeft("");
        setRight("");
    }, []);

    const swapTexts = React.useCallback(() => {
        const temp = left;
        setLeft(right);
        setRight(temp);
        // Also swap languages
        const tempLang = leftLanguage;
        setLeftLanguage(rightLanguage);
        setRightLanguage(tempLang);
        const tempDetected = detectedLeftLang;
        setDetectedLeftLang(detectedRightLang);
        setDetectedRightLang(tempDetected);
    }, [left, right, leftLanguage, rightLanguage, detectedLeftLang, detectedRightLang]);

    const handleFormatLeft = React.useCallback(async () => {
        if (!left.trim()) return;
        setIsFormattingLeft(true);
        try {
            const langToUse = leftLanguage === "auto" ? detectedLeftLang : leftLanguage;
            const result = await formatCode(left, langToUse);
            if (result.error) {
                alert(`Formatting error: ${result.error}`);
            } else {
                setLeft(result.formatted);
            }
        } catch (error) {
            alert(`Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsFormattingLeft(false);
        }
    }, [left, leftLanguage, detectedLeftLang]);

    const handleFormatRight = React.useCallback(async () => {
        if (!right.trim()) return;
        setIsFormattingRight(true);
        try {
            const langToUse = rightLanguage === "auto" ? detectedRightLang : rightLanguage;
            const result = await formatCode(right, langToUse);
            if (result.error) {
                alert(`Formatting error: ${result.error}`);
            } else {
                setRight(result.formatted);
            }
        } catch (error) {
            alert(`Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsFormattingRight(false);
        }
    }, [right, rightLanguage, detectedRightLang]);

    const scrollToTop = React.useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleFileUpload = React.useCallback((file: File, setter: (value: string) => void) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setter(content);
        };
        reader.readAsText(file);
    }, []);

    const lineParts = React.useMemo(() => computeLineDiff(left, right, { ignoreWhitespace }), [left, right, ignoreWhitespace]);
    const sbsRows = React.useMemo(() => buildSideBySideFromLineDiff(lineParts), [lineParts]);
    const inlineParts = React.useMemo(() => computeWordDiff(left, right, { ignoreCase }), [left, right, ignoreCase]);
    const diffStats = React.useMemo(() => calculateDiffStats(lineParts), [lineParts]);

    // Expose clear function globally for DiffLab title click
    React.useEffect(() => {
        (window as Window & { clearDiffLab?: () => void }).clearDiffLab = clearAll;
        return () => {
            delete (window as Window & { clearDiffLab?: () => void }).clearDiffLab;
        };
    }, [clearAll]);

    // Auto-detect language when text changes
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (left.trim()) {
                const detection = detectLanguage(left);
                setDetectedLeftLang(detection.language);
            } else {
                setDetectedLeftLang("text");
            }
        }, 500); // Debounce for 500ms
        return () => clearTimeout(timer);
    }, [left]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (right.trim()) {
                const detection = detectLanguage(right);
                setDetectedRightLang(detection.language);
            } else {
                setDetectedRightLang("text");
            }
        }, 500); // Debounce for 500ms
        return () => clearTimeout(timer);
    }, [right]);

    // Handle scroll to show/hide scroll-to-top button
    React.useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
                    <option value="off" ${!ignoreWhitespace ? 'selected' : ''}>Sensitive</option>
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

            // Clear button
            const clearButton = document.createElement('button');
            clearButton.className = 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-red-500';
            clearButton.textContent = 'Clear';
            clearButton.addEventListener('click', clearAll);

            // Privacy Policy link
            const privacyLink = document.createElement('a');
            privacyLink.href = '/privacy-policy';
            privacyLink.className = 'text-sm text-slate-600 hover:text-slate-800 underline underline-offset-4 transition-colors';
            privacyLink.textContent = 'Privacy Policy';

            wrapper.appendChild(privacyLink);
            wrapper.appendChild(viewDiv);
            wrapper.appendChild(whitespaceDiv);
            wrapper.appendChild(caseDiv);
            wrapper.appendChild(clearButton);
            controlsContainer.appendChild(wrapper);
        }
    }, [mode, ignoreWhitespace, ignoreCase, clearAll]);

    return (
        <>
            <div className="w-full max-w-none mx-auto flex flex-col gap-4 sm:gap-6">
                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex flex-col gap-2 sm:gap-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="text-sm sm:text-base font-semibold text-slate-800">Original Text</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {diffStats.deletions > 0 && (
                                    <span className="text-xs sm:text-sm text-red-600 font-medium">
                                        {diffStats.deletions} deletion{diffStats.deletions !== 1 ? 's' : ''}
                                    </span>
                                )}
                                <select
                                    value={leftLanguage}
                                    onChange={(e) => setLeftLanguage(e.target.value as Language)}
                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    title={leftLanguage === "auto" ? `Detected: ${getLanguageDisplayName(detectedLeftLang)}` : undefined}
                                >
                                    {getSupportedLanguages().map(lang => (
                                        <option key={lang} value={lang}>
                                            {getLanguageDisplayName(lang)}
                                            {lang === "auto" && detectedLeftLang !== "text" ? ` (${getLanguageDisplayName(detectedLeftLang)})` : ""}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleFormatLeft}
                                    disabled={!left.trim() || isFormattingLeft}
                                    className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                                    title="Format code"
                                >
                                    <Wand2 className="w-3 h-3" />
                                    {isFormattingLeft ? "Formatting..." : "Format"}
                                </button>
                                <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors">
                                    Upload File
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.yml,.yaml"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileUpload(file, setLeft);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        <textarea
                            className="min-h-48 sm:min-h-64 h-48 sm:h-64 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            placeholder="Paste or type your original text here..."
                            value={left}
                            onChange={(e) => setLeft(e.target.value)}
                        />
                    </div>

                    {/* Swap Button */}
                    <div className="flex lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:z-10 justify-center lg:justify-start">
                        <button
                            onClick={swapTexts}
                            className="bg-slate-600 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                            aria-label="Swap texts"
                            title="Swap original and modified text"
                        >
                            <ArrowLeftRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="text-sm sm:text-base font-semibold text-slate-800">Modified Text</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    {diffStats.additions > 0 && (
                                        <span className="text-xs sm:text-sm text-green-600 font-medium">
                                            {diffStats.additions} addition{diffStats.additions !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {diffStats.modifications > 0 && (
                                        <span className="text-xs sm:text-sm text-blue-600 font-medium">
                                            {diffStats.modifications} modification{diffStats.modifications !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={rightLanguage}
                                    onChange={(e) => setRightLanguage(e.target.value as Language)}
                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    title={rightLanguage === "auto" ? `Detected: ${getLanguageDisplayName(detectedRightLang)}` : undefined}
                                >
                                    {getSupportedLanguages().map(lang => (
                                        <option key={lang} value={lang}>
                                            {getLanguageDisplayName(lang)}
                                            {lang === "auto" && detectedRightLang !== "text" ? ` (${getLanguageDisplayName(detectedRightLang)})` : ""}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleFormatRight}
                                    disabled={!right.trim() || isFormattingRight}
                                    className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                                    title="Format code"
                                >
                                    <Wand2 className="w-3 h-3" />
                                    {isFormattingRight ? "Formatting..." : "Format"}
                                </button>
                                <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors">
                                    Upload File
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.yml,.yaml"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileUpload(file, setRight);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        <textarea
                            className="min-h-48 sm:min-h-64 h-48 sm:h-64 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            placeholder="Paste or type your modified text here..."
                            value={right}
                            onChange={(e) => setRight(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4" ref={diffContainerRef}>
                    {mode === "side-by-side" ? (
                        <DiffDisplay mode="side-by-side" sideBySideRows={sbsRows} className="border border-slate-300 rounded-lg p-2 sm:p-4 bg-white shadow-sm overflow-x-auto" />
                    ) : (
                        <DiffDisplay mode="inline" inlineParts={inlineParts} className="border border-slate-300 rounded-lg p-2 sm:p-4 bg-white shadow-sm" />
                    )}
                </div>
            </div>

            {/* Minimap */}
            {mode === "side-by-side" && sbsRows.length > 0 && (
                <DiffMinimap sideBySideRows={sbsRows} containerRef={diffContainerRef} />
            )}

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="w-6 h-6" />
                </button>
            )}
        </>
    );
}


