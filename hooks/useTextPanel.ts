"use client";

import React from "react";
import { detectLanguage, detectLanguageFromFilename, formatCode, type Language } from "@/lib/formatUtils";

const DEBOUNCE_MS = 500;

export interface TextPanelState {
    text: string;
    setText: (value: string) => void;
    language: Language;
    setLanguage: (value: Language) => void;
    detectedLang: Language;
    setDetectedLang: (value: Language) => void;
    filename: string;
    isFormatting: boolean;
    isDragging: boolean;
    handleFormat: () => Promise<void>;
    handleFileUpload: (file: File) => void;
    clearFile: () => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
}

/**
 * Encapsulates all state and logic for a single text panel (left or right).
 * Handles text, language detection, file upload, drag-drop, and formatting.
 */
export function useTextPanel(): TextPanelState {
    const [text, setText] = React.useState("");
    const [language, setLanguage] = React.useState<Language>("auto");
    const [detectedLang, setDetectedLang] = React.useState<Language>("text");
    const [filename, setFilename] = React.useState("");
    const [isFormatting, setIsFormatting] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);

    // Auto-detect language when text changes (debounced)
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (text.trim()) {
                const detection = detectLanguage(text);
                setDetectedLang(detection.language);
            } else {
                setDetectedLang("text");
            }
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [text]);

    const handleFormat = React.useCallback(async () => {
        if (!text.trim()) return;
        setIsFormatting(true);
        try {
            const langToUse = language === "auto" ? detectedLang : language;
            const result = await formatCode(text, langToUse);
            if (result.error) {
                alert(`Formatting error: ${result.error}`);
            } else {
                setText(result.formatted);
            }
        } catch (error) {
            alert(`Formatting failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsFormatting(false);
        }
    }, [text, language, detectedLang]);

    const handleFileUpload = React.useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setText(content);
            setFilename(file.name);
            const langFromExt = detectLanguageFromFilename(file.name);
            if (langFromExt) {
                setDetectedLang(langFromExt);
            }
        };
        reader.onerror = () => {
            alert(`Failed to read file: ${file.name}`);
        };
        reader.readAsText(file);
    }, []);

    const clearFile = React.useCallback(() => {
        setText("");
        setFilename("");
    }, []);

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result as string;
                setText(content);
                setFilename(file.name);
                const langFromExt = detectLanguageFromFilename(file.name);
                if (langFromExt) {
                    setDetectedLang(langFromExt);
                }
            };
            reader.onerror = () => {
                alert(`Failed to read file: ${file.name}`);
            };
            reader.readAsText(file);
        }
    }, []);

    return {
        text, setText,
        language, setLanguage,
        detectedLang, setDetectedLang,
        filename,
        isFormatting,
        isDragging,
        handleFormat,
        handleFileUpload,
        clearFile,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}
