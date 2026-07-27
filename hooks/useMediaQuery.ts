"use client";

import React from "react";

/** Tracks a CSS media query on the client; defaults to false during SSR. */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = React.useState(false);

    React.useEffect(() => {
        const mql = window.matchMedia(query);
        setMatches(mql.matches);
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener("change", listener);
        return () => mql.removeEventListener("change", listener);
    }, [query]);

    return matches;
}
