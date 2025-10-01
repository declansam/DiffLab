"use client";

import React from "react";

function getInitialTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
}

export default function ThemeToggle() {
    const [theme, setTheme] = React.useState<"light" | "dark">(() => getInitialTheme());

    React.useEffect(() => {
        const root = document.documentElement; // <html>
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        window.localStorage.setItem("theme", theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    }

    const isDark = theme === "dark";
    const label = isDark ? "Light" : "Dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Toggle color theme"
            title="Toggle color theme"
        >
            <span className="w-4 h-4 inline-block" aria-hidden>
                {isDark ? (
                    // sun icon
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.45 14.32l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 4V1h-0v3h0zm0 19v-3h0v3h0zM4 12H1v0h3v0zm19 0h-3v0h3v0zM6.76 19.16l-1.42 1.42-1.79-1.8 1.41-1.41 1.8 1.79zM19.16 6.76l1.4-1.4 1.8 1.79-1.41 1.41-1.79-1.8zM12 6a6 6 0 100 12 6 6 0 000-12z" /></svg>
                ) : (
                    // moon icon
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M21.64 13A9 9 0 1111 2.36 7 7 0 0021.64 13z" /></svg>
                )}
            </span>
            <span>{label}</span>
        </button>
    );
}


