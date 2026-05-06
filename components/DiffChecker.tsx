"use client";

import React from "react";
import DiffDisplay from "@/components/DiffDisplay";
import DiffMinimap from "@/components/DiffMinimap";
import DiffNavigation from "@/components/DiffNavigation";
import { buildSideBySideFromLineDiff, computeLineDiff, computeWordDiff, calculateDiffStats } from "@/lib/diffUtils";
import { ArrowUp, ArrowLeftRight, Wand2, Files, X, Share2, Check } from "lucide-react";
import { detectLanguage, formatCode, getLanguageDisplayName, getSupportedLanguages, type Language } from "@/lib/formatUtils";
import LZString from "lz-string";

type Mode = "side-by-side" | "inline";

const ACCEPTED_FILE_TYPES = ".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.hpp,.cs,.php,.rb,.go,.rs,.kt,.swift,.scala,.sh,.bash,.zsh,.css,.scss,.sass,.less,.html,.xml,.json,.yaml,.yml,.toml,.ini,.cfg,.conf,.log,.sql,.r,.m,.mat,.v,.vhd,.vhdl,.sv,.svh,.asm,.s,.pl,.pm,.lua,.vim,.el,.clj,.ex,.exs,.erl,.hrl,.fs,.fsx,.ml,.mli,.hs,.lhs,.dart,.groovy,.gradle,.proto,.thrift";

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
    const [leftFilename, setLeftFilename] = React.useState<string>("");
    const [rightFilename, setRightFilename] = React.useState<string>("");
    const [isDraggingLeft, setIsDraggingLeft] = React.useState(false);
    const [isDraggingRight, setIsDraggingRight] = React.useState(false);
    const [showCopySuccess, setShowCopySuccess] = React.useState(false);
    const diffContainerRef = React.useRef<HTMLDivElement>(null);

    const clearAll = React.useCallback(() => {
        setLeft("");
        setRight("");
        setLeftFilename("");
        setRightFilename("");
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
        // Swap filenames
        const tempFilename = leftFilename;
        setLeftFilename(rightFilename);
        setRightFilename(tempFilename);
    }, [left, right, leftLanguage, rightLanguage, detectedLeftLang, detectedRightLang, leftFilename, rightFilename]);

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

    const handleFileUpload = React.useCallback((file: File, setter: (value: string) => void, filenameSetter: (value: string) => void) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setter(content);
            filenameSetter(file.name);
        };
        reader.onerror = () => {
            alert(`Failed to read file: ${file.name}`);
        };
        reader.readAsText(file);
    }, []);

    const handleDragOver = React.useCallback((e: React.DragEvent, side: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        if (side === 'left') {
            setIsDraggingLeft(true);
        } else {
            setIsDraggingRight(true);
        }
    }, []);

    const handleDragLeave = React.useCallback((e: React.DragEvent, side: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        if (side === 'left') {
            setIsDraggingLeft(false);
        } else {
            setIsDraggingRight(false);
        }
    }, []);

    const handleDrop = React.useCallback((e: React.DragEvent, side: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        if (side === 'left') {
            setIsDraggingLeft(false);
        } else {
            setIsDraggingRight(false);
        }

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (side === 'left') {
                handleFileUpload(file, setLeft, setLeftFilename);
            } else {
                handleFileUpload(file, setRight, setRightFilename);
            }
        }
    }, [handleFileUpload]);

    const handleCompareTwoFiles = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length >= 2) {
            handleFileUpload(files[0], setLeft, setLeftFilename);
            handleFileUpload(files[1], setRight, setRightFilename);
        } else if (files && files.length === 1) {
            handleFileUpload(files[0], setLeft, setLeftFilename);
        }
    }, [handleFileUpload]);

    const clearLeftFile = React.useCallback(() => {
        setLeft("");
        setLeftFilename("");
    }, []);

    const clearRightFile = React.useCallback(() => {
        setRight("");
        setRightFilename("");
    }, []);

    const generateShareLink = React.useCallback(async () => {
        try {
            const data = JSON.stringify({ left, right });
            const compressed = LZString.compressToEncodedURIComponent(data);
            
            const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;
            
            if (url.length > 8000) {
                alert('The content is too large to share via URL. Try sharing smaller text or use the file upload feature to compare locally.');
                return;
            }
            
            await navigator.clipboard.writeText(url);
            setShowCopySuccess(true);
            setTimeout(() => setShowCopySuccess(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            alert('Failed to create share link. Please try again.');
        }
    }, [left, right]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const shareParam = params.get('share');
            
            if (shareParam) {
                try {
                    const decompressed = LZString.decompressFromEncodedURIComponent(shareParam);
                    if (decompressed) {
                        const data = JSON.parse(decompressed);
                        setLeft(data.left || '');
                        setRight(data.right || '');
                        window.history.replaceState({}, '', window.location.pathname);
                    } else {
                        alert('Failed to load the shared comparison. The link may be corrupted.');
                    }
                } catch (error) {
                    console.error('Failed to load shared diff:', error);
                    alert('Failed to load the shared comparison. The link may be invalid.');
                }
            }
        }
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
                {/* Action Buttons */}
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
                        disabled={!left && !right}
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
                                        accept={ACCEPTED_FILE_TYPES}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileUpload(file, setLeft, setLeftFilename);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        
                        {leftFilename && (
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                <span className="text-xs text-blue-700 font-medium truncate flex-1">
                                    {leftFilename}
                                </span>
                                <button
                                    onClick={clearLeftFile}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Clear file"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div
                            className="relative"
                            onDragOver={(e) => handleDragOver(e, 'left')}
                            onDragLeave={(e) => handleDragLeave(e, 'left')}
                            onDrop={(e) => handleDrop(e, 'left')}
                        >
                            <textarea
                                className="min-h-48 sm:min-h-64 h-48 sm:h-64 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                placeholder="Paste or type your original text here, or drag & drop a file..."
                                value={left}
                                onChange={(e) => setLeft(e.target.value)}
                            />
                            {isDraggingLeft && (
                                <div className="absolute inset-0 bg-blue-100 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center pointer-events-none">
                                    <div className="text-blue-600 font-semibold text-lg">Drop file here</div>
                                </div>
                            )}
                        </div>
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
                                        accept={ACCEPTED_FILE_TYPES}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileUpload(file, setRight, setRightFilename);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        {rightFilename && (
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                <span className="text-xs text-blue-700 font-medium truncate flex-1">
                                    {rightFilename}
                                </span>
                                <button
                                    onClick={clearRightFile}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Clear file"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div
                            className="relative"
                            onDragOver={(e) => handleDragOver(e, 'right')}
                            onDragLeave={(e) => handleDragLeave(e, 'right')}
                            onDrop={(e) => handleDrop(e, 'right')}
                        >
                            <textarea
                                className="min-h-48 sm:min-h-64 h-48 sm:h-64 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                placeholder="Paste or type your modified text here, or drag & drop a file..."
                                value={right}
                                onChange={(e) => setRight(e.target.value)}
                            />
                            {isDraggingRight && (
                                <div className="absolute inset-0 bg-blue-100 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center pointer-events-none">
                                    <div className="text-blue-600 font-semibold text-lg">Drop file here</div>
                                </div>
                            )}
                        </div>
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

            {/* Change Navigation */}
            {mode === "side-by-side" && sbsRows.length > 0 && (
                <DiffNavigation
                    containerRef={diffContainerRef}
                    totalChanges={diffStats.additions + diffStats.deletions + diffStats.modifications}
                />
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


