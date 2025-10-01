import { diffLines, diffWords } from "diff";

export type DiffPart = {
    value: string;
    added?: boolean;
    removed?: boolean;
    count?: number;
};

export type LineDiffOptions = {
    ignoreWhitespace?: boolean;
};

export type WordDiffOptions = {
    ignoreCase?: boolean;
};

export function computeLineDiff(
    left: string,
    right: string,
    options: LineDiffOptions = {}
): DiffPart[] {
    return diffLines(left, right, {
        ignoreWhitespace: options.ignoreWhitespace === true,
    }) as DiffPart[];
}

export function computeWordDiff(
    left: string,
    right: string,
    options: WordDiffOptions = {}
): DiffPart[] {
    return diffWords(left, right, {
        ignoreCase: options.ignoreCase === true,
    }) as DiffPart[];
}

export type SideBySideRow = {
    leftLineNumber: number | null;
    rightLineNumber: number | null;
    leftText: string | null;
    rightText: string | null;
    changeType: "unchanged" | "added" | "removed" | "modified";
};

export function buildSideBySideFromLineDiff(parts: DiffPart[]): SideBySideRow[] {
    const rows: SideBySideRow[] = [];
    let leftLine = 1;
    let rightLine = 1;

    for (const part of parts) {
        const lines = part.value.split("\n");
        // The last split is empty when value ends with a newline; ignore it for display
        const linesToRender = lines[lines.length - 1] === "" ? lines.slice(0, -1) : lines;

        if (part.added) {
            for (const line of linesToRender) {
                rows.push({
                    leftLineNumber: null,
                    rightLineNumber: rightLine++,
                    leftText: null,
                    rightText: line,
                    changeType: "added",
                });
            }
            continue;
        }

        if (part.removed) {
            for (const line of linesToRender) {
                rows.push({
                    leftLineNumber: leftLine++,
                    rightLineNumber: null,
                    leftText: line,
                    rightText: null,
                    changeType: "removed",
                });
            }
            continue;
        }

        // Unchanged chunk – align both sides
        for (const line of linesToRender) {
            rows.push({
                leftLineNumber: leftLine++,
                rightLineNumber: rightLine++,
                leftText: line,
                rightText: line,
                changeType: "unchanged",
            });
        }
    }

    return rows;
}


