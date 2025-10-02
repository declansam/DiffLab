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

export type DiffStats = {
    deletions: number;
    additions: number;
    modifications: number;
};

export function calculateDiffStats(parts: DiffPart[]): DiffStats {
    let deletions = 0;
    let additions = 0;
    let modifications = 0;
    
    // Process parts to identify modifications (removed followed by added)
    for (let i = 0; i < parts.length; i++) {
        const current = parts[i];
        const next = i + 1 < parts.length ? parts[i + 1] : null;
        
        if (current.removed && next && next.added) {
            // This is a modification - count both as modifications
            const removedLines = current.value.split('\n').filter(line => line !== '').length;
            const addedLines = next.value.split('\n').filter(line => line !== '').length;
            modifications += Math.max(removedLines, addedLines);
            i++; // Skip the next part as we've processed it
        } else if (current.removed) {
            // Pure deletion
            deletions += current.value.split('\n').filter(line => line !== '').length;
        } else if (current.added) {
            // Pure addition
            additions += current.value.split('\n').filter(line => line !== '').length;
        }
    }
    
    return { deletions, additions, modifications };
}

export function buildSideBySideFromLineDiff(parts: DiffPart[]): SideBySideRow[] {
    const rows: SideBySideRow[] = [];
    let leftLine = 1;
    let rightLine = 1;
    
    // First pass: collect all removed and added sections
    const processedParts: Array<{type: 'unchanged' | 'removed' | 'added', lines: string[], part: DiffPart}> = [];
    
    for (const part of parts) {
        const lines = part.value.split("\n");
        const linesToRender = lines[lines.length - 1] === "" ? lines.slice(0, -1) : lines;
        
        if (part.added) {
            processedParts.push({type: 'added', lines: linesToRender, part});
        } else if (part.removed) {
            processedParts.push({type: 'removed', lines: linesToRender, part});
        } else {
            processedParts.push({type: 'unchanged', lines: linesToRender, part});
        }
    }
    
    // Second pass: pair up removed/added sections and create rows
    let i = 0;
    while (i < processedParts.length) {
        const current = processedParts[i];
        
        if (current.type === 'unchanged') {
            // Unchanged lines - show on both sides
            for (const line of current.lines) {
                rows.push({
                    leftLineNumber: leftLine++,
                    rightLineNumber: rightLine++,
                    leftText: line,
                    rightText: line,
                    changeType: "unchanged",
                });
            }
            i++;
        } else if (current.type === 'removed') {
            
            // Check if next part is added - if so, pair them up
            const next = i + 1 < processedParts.length ? processedParts[i + 1] : null;
            
            if (next && next.type === 'added') {
                
                // Pair removed and added lines
                const removedLines = current.lines;
                const addedLines = next.lines;
                const maxLines = Math.max(removedLines.length, addedLines.length);
                
                for (let j = 0; j < maxLines; j++) {
                    const removedLine = j < removedLines.length ? removedLines[j] : null;
                    const addedLine = j < addedLines.length ? addedLines[j] : null;
                    
                    rows.push({
                        leftLineNumber: removedLine !== null ? leftLine++ : null,
                        rightLineNumber: addedLine !== null ? rightLine++ : null,
                        leftText: removedLine,
                        rightText: addedLine,
                        changeType: "modified",
                    });
                }
                i += 2; // Skip both removed and added parts
            } else {
                
                // Only removed lines
                for (const line of current.lines) {
                    rows.push({
                        leftLineNumber: leftLine++,
                        rightLineNumber: null,
                        leftText: line,
                        rightText: null,
                        changeType: "removed",
                    });
                }
                i++;
            }
        } else if (current.type === 'added') {
            
            // Only added lines (not paired with removed)
            for (const line of current.lines) {
                rows.push({
                    leftLineNumber: null,
                    rightLineNumber: rightLine++,
                    leftText: null,
                    rightText: line,
                    changeType: "added",
                });
            }
            i++;
        } else {
            i++;
        }
    }

    return rows;
}


