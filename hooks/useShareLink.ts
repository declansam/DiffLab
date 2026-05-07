"use client";

import React from "react";
import LZString from "lz-string";

const MAX_URL_LENGTH = 8000;
const COPY_SUCCESS_DURATION_MS = 2000;

interface UseShareLinkOptions {
    left: string;
    right: string;
    setLeft: (value: string) => void;
    setRight: (value: string) => void;
}

interface UseShareLinkReturn {
    showCopySuccess: boolean;
    generateShareLink: () => Promise<void>;
}

/**
 * Handles share link generation (compress to URL) and
 * loading shared content from URL params on mount.
 */
export function useShareLink({ left, right, setLeft, setRight }: UseShareLinkOptions): UseShareLinkReturn {
    const [showCopySuccess, setShowCopySuccess] = React.useState(false);

    // Load shared content from URL on mount
    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const params = new URLSearchParams(window.location.search);
        const shareParam = params.get("share");

        if (shareParam) {
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(shareParam);
                if (decompressed) {
                    const data = JSON.parse(decompressed);
                    setLeft(data.left || "");
                    setRight(data.right || "");
                    window.history.replaceState({}, "", window.location.pathname);
                } else {
                    alert("Failed to load the shared comparison. The link may be corrupted.");
                }
            } catch (error) {
                console.error("Failed to load shared diff:", error);
                alert("Failed to load the shared comparison. The link may be invalid.");
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generateShareLink = React.useCallback(async () => {
        try {
            const data = JSON.stringify({ left, right });
            const compressed = LZString.compressToEncodedURIComponent(data);
            const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;

            if (url.length > MAX_URL_LENGTH) {
                alert("The content is too large to share via URL. Try sharing smaller text or use the file upload feature to compare locally.");
                return;
            }

            await navigator.clipboard.writeText(url);
            setShowCopySuccess(true);
            setTimeout(() => setShowCopySuccess(false), COPY_SUCCESS_DURATION_MS);
        } catch (error) {
            console.error("Failed to copy link:", error);
            alert("Failed to create share link. Please try again.");
        }
    }, [left, right]);

    return { showCopySuccess, generateShareLink };
}
