"use client";

import React from "react";

const MIN_RATIO = 0.2;
const MAX_RATIO = 0.8;

/**
 * Shared drag-to-resize state for a horizontal split. A single instance can
 * drive multiple side-by-side containers (e.g. the input panels and the diff
 * output) so dragging any of their dividers resizes them all in sync.
 */
export function useHorizontalSplit(initialRatio = 0.5) {
    const [ratio, setRatio] = React.useState(initialRatio);
    const activeContainerRef = React.useRef<HTMLElement | null>(null);
    const draggingRef = React.useRef(false);

    const updateFromClientX = React.useCallback((clientX: number) => {
        const rect = activeContainerRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        const next = (clientX - rect.left) / rect.width;
        setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, next)));
    }, []);

    React.useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!draggingRef.current) return;
            const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0]?.clientX;
            if (clientX === undefined) return;
            e.preventDefault();
            updateFromClientX(clientX);
        };
        const stopDragging = () => {
            if (!draggingRef.current) return;
            draggingRef.current = false;
            activeContainerRef.current = null;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("touchmove", handleMove, { passive: false });
        window.addEventListener("mouseup", stopDragging);
        window.addEventListener("touchend", stopDragging);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("mouseup", stopDragging);
            window.removeEventListener("touchend", stopDragging);
        };
    }, [updateFromClientX]);

    const startDragging = React.useCallback(
        (containerRef: React.RefObject<HTMLElement | null>) => (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault();
            activeContainerRef.current = containerRef.current;
            draggingRef.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        },
        [],
    );

    const resetRatio = React.useCallback(() => setRatio(initialRatio), [initialRatio]);

    return { ratio, startDragging, resetRatio };
}
