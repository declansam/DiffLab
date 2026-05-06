"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export type DiffNavigationProps = {
    containerRef: React.RefObject<HTMLDivElement | null>;
    totalChanges: number;
};

export default function DiffNavigation({ containerRef, totalChanges }: DiffNavigationProps) {
    const [currentIndex, setCurrentIndex] = React.useState(-1);
    const [hunks, setHunks] = React.useState<HTMLElement[][]>([]);

    // Build hunks from DOM after render
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current) {
                setHunks([]);
                return;
            }

            const elements = Array.from(
                containerRef.current.querySelectorAll<HTMLElement>("[data-diff-change]")
            );

            if (elements.length === 0) {
                setHunks([]);
                return;
            }

            // Group consecutive changed rows into hunks
            const result: HTMLElement[][] = [];
            let currentHunk: HTMLElement[] = [elements[0]];

            for (let i = 1; i < elements.length; i++) {
                const prevIdx = parseInt(elements[i - 1].getAttribute("data-diff-row-idx") || "0", 10);
                const curIdx = parseInt(elements[i].getAttribute("data-diff-row-idx") || "0", 10);

                if (curIdx - prevIdx <= 1) {
                    currentHunk.push(elements[i]);
                } else {
                    result.push(currentHunk);
                    currentHunk = [elements[i]];
                }
            }
            result.push(currentHunk);
            setHunks(result);
        }, 150);

        return () => clearTimeout(timer);
    }, [containerRef, totalChanges]);

    // Reset index when diff content changes
    React.useEffect(() => {
        setCurrentIndex(-1);
    }, [totalChanges]);

    const scrollToHunk = React.useCallback((hunkIdx: number) => {
        if (hunks.length === 0 || hunkIdx < 0 || hunkIdx >= hunks.length) return;

        const target = hunks[hunkIdx][0];
        const rect = target.getBoundingClientRect();
        const targetTop = rect.top + window.scrollY - window.innerHeight / 3;

        window.scrollTo({ top: targetTop, behavior: "smooth" });

        // Briefly highlight the hunk
        for (const el of hunks[hunkIdx]) {
            el.style.transition = "box-shadow 0.3s ease";
            el.style.boxShadow = "inset 0 0 0 2px rgba(59, 130, 246, 0.6)";
            setTimeout(() => {
                el.style.boxShadow = "";
            }, 1200);
        }
    }, [hunks]);

    const goToNextChange = React.useCallback(() => {
        if (hunks.length === 0) return;
        const nextIdx = currentIndex + 1 >= hunks.length ? 0 : currentIndex + 1;
        setCurrentIndex(nextIdx);
        scrollToHunk(nextIdx);
    }, [hunks, currentIndex, scrollToHunk]);

    const goToPrevChange = React.useCallback(() => {
        if (hunks.length === 0) return;
        const prevIdx = currentIndex <= 0 ? hunks.length - 1 : currentIndex - 1;
        setCurrentIndex(prevIdx);
        scrollToHunk(prevIdx);
    }, [hunks, currentIndex, scrollToHunk]);

    // Keyboard shortcuts: Alt + Up/Down
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (totalChanges === 0) return;

            if (e.altKey && e.key === "ArrowDown") {
                e.preventDefault();
                goToNextChange();
            } else if (e.altKey && e.key === "ArrowUp") {
                e.preventDefault();
                goToPrevChange();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNextChange, goToPrevChange, totalChanges]);

    if (totalChanges === 0) return null;

    return (
        <div className="fixed bottom-24 right-8 z-40 flex flex-col items-center gap-1">
            <div className="flex flex-col items-center bg-white border border-slate-300 rounded-2xl shadow-lg p-1.5 gap-0.5">
                {/* Previous change button */}
                <button
                    onClick={goToPrevChange}
                    className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                    aria-label="Previous change"
                    title="Previous change (Alt + ↑)"
                >
                    <ChevronUp className="w-5 h-5" />
                </button>

                {/* Change counter badge */}
                <div className="flex items-center justify-center w-10 py-1">
                    <span className="text-[10px] font-bold text-slate-700 tabular-nums leading-none">
                        {currentIndex >= 0 ? currentIndex + 1 : "–"}/{hunks.length}
                    </span>
                </div>

                {/* Next change button */}
                <button
                    onClick={goToNextChange}
                    className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                    aria-label="Next change"
                    title="Next change (Alt + ↓)"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
