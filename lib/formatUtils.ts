import * as yaml from "js-yaml";

export type Language = "auto" | "json" | "yaml" | "javascript" | "typescript" | "python" | "c" | "cpp" | "css" | "html" | "markdown" | "text";

export interface DetectionResult {
    language: Language;
    confidence: "high" | "medium" | "low";
}

/**
 * Auto-detect the language of the given text using heuristics
 */
export function detectLanguage(text: string): DetectionResult {
    if (!text || text.trim().length === 0) {
        return { language: "text", confidence: "high" };
    }

    const trimmed = text.trim();

    // Try JSON detection
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
            JSON.parse(trimmed);
            return { language: "json", confidence: "high" };
        } catch {
            // Not valid JSON, continue checking
        }
    }

    // Try YAML detection
    if (trimmed.includes(":") && /^[\w-]+:\s*.+$/m.test(trimmed)) {
        try {
            yaml.load(trimmed);
            // Check if it looks more like YAML than just key:value pairs
            if (trimmed.includes("\n") && /^\s+/m.test(trimmed)) {
                return { language: "yaml", confidence: "high" };
            }
            return { language: "yaml", confidence: "medium" };
        } catch {
            // Not valid YAML
        }
    }

    // Check for HTML
    if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
        return { language: "html", confidence: "high" };
    }

    // Check for CSS
    if (/[.#]?[\w-]+\s*\{[^}]*\}/m.test(trimmed) && trimmed.includes(":")) {
        return { language: "css", confidence: "medium" };
    }

    // Check for Python - enhanced with more keywords
    if (/\b(def|import|from|class|elif|with|as|lambda)\b/.test(trimmed) ||
        /\bprint\s*\(/.test(trimmed) ||
        /\b(range|len|str|int|list|dict|tuple)\s*\(/.test(trimmed) ||
        /if __name__/.test(trimmed) ||
        /:\s*$\n\s+/m.test(trimmed)) {
        return { language: "python", confidence: "high" };
    }

    // Check for C++ - enhanced with more keywords
    if (/#include\s*<(iostream|vector|string|algorithm|map|set|queue|stack)>/.test(trimmed) ||
        /\b(std::|cout|cin|endl|cerr)\b/.test(trimmed) ||
        /\b(namespace|using namespace|template|typename)\b/.test(trimmed) ||
        /\b(class|public:|private:|protected:|virtual)\b/.test(trimmed)) {
        return { language: "cpp", confidence: "high" };
    }

    // Check for C - enhanced with more keywords
    if (/#include\s*<(stdio|stdlib|string|math|time|ctype)\.h>/.test(trimmed) ||
        /\bint\s+main\s*\(/.test(trimmed) ||
        /\b(printf|scanf|malloc|free|sizeof|NULL)\s*\(/.test(trimmed) ||
        /\b(FILE|fopen|fclose|fprintf|fscanf)\b/.test(trimmed)) {
        return { language: "c", confidence: "high" };
    }

    // Check for JavaScript/TypeScript patterns - enhanced with more keywords
    const jsPatterns = [
        /\b(function|const|let|var|class|import|export|async|await|return)\b/,
        /\bconsole\.(log|error|warn|info)\s*\(/,
        /\b(document|window|localStorage|sessionStorage)\./,
        /\b(require|module\.exports|exports)\b/,
        /=>/,
        /\$\{.*\}/,  // Template literals
        /\bnew\s+\w+\s*\(/,
        /\.(then|catch|finally)\s*\(/,
    ];

    if (jsPatterns.some(pattern => pattern.test(trimmed))) {
        // Check for TypeScript-specific patterns
        if (/:\s*(string|number|boolean|any|void|unknown|never)\b/.test(trimmed) ||
            /\b(interface|type\s+\w+\s*=|enum|namespace)\b/.test(trimmed) ||
            /<\w+>/.test(trimmed) && /\bfunction\b/.test(trimmed)) {
            return { language: "typescript", confidence: "high" };
        }
        return { language: "javascript", confidence: "high" };
    }

    // Check for Markdown
    if (/^#{1,6}\s+.+$/m.test(trimmed) ||
        /\[.+\]\(.+\)/.test(trimmed) ||
        /^[-*+]\s+.+$/m.test(trimmed) ||
        /^```/.test(trimmed)) {
        return { language: "markdown", confidence: "medium" };
    }

    return { language: "text", confidence: "low" };
}

/**
 * Format code using the specified language
 */
export async function formatCode(text: string, language: Language): Promise<{ formatted: string; error?: string }> {
    if (!text || text.trim().length === 0) {
        return { formatted: text };
    }

    try {
        switch (language) {
            case "json": {
                const parsed = JSON.parse(text);
                return { formatted: JSON.stringify(parsed, null, 2) };
            }

            case "yaml": {
                const parsed = yaml.load(text);
                return { formatted: yaml.dump(parsed, { indent: 2, lineWidth: -1 }) };
            }

            case "javascript":
            case "typescript": {
                try {
                    const prettier = await import("prettier/standalone");
                    const parserBabel = await import("prettier/plugins/babel");
                    const parserEstree = await import("prettier/plugins/estree");
                    const parserTypescript = await import("prettier/plugins/typescript");

                    const formatted = await prettier.format(text, {
                        parser: language === "typescript" ? "typescript" : "babel",
                        plugins: [parserBabel.default, parserEstree.default, parserTypescript.default],
                        semi: true,
                        singleQuote: false,
                        tabWidth: 2,
                        trailingComma: "es5",
                    });
                    return { formatted };
                } catch (error) {
                    return {
                        formatted: text,
                        error: `Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }

            case "css": {
                try {
                    const prettier = await import("prettier/standalone");
                    const parserPostcss = await import("prettier/plugins/postcss");

                    const formatted = await prettier.format(text, {
                        parser: "css",
                        plugins: [parserPostcss.default],
                        tabWidth: 2,
                    });
                    return { formatted };
                } catch (error) {
                    return {
                        formatted: text,
                        error: `Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }

            case "html": {
                try {
                    const prettier = await import("prettier/standalone");
                    const parserHtml = await import("prettier/plugins/html");

                    const formatted = await prettier.format(text, {
                        parser: "html",
                        plugins: [parserHtml.default],
                        tabWidth: 2,
                        printWidth: 80,
                    });
                    return { formatted };
                } catch (error) {
                    return {
                        formatted: text,
                        error: `Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }

            case "markdown": {
                try {
                    const prettier = await import("prettier/standalone");
                    const parserMarkdown = await import("prettier/plugins/markdown");

                    const formatted = await prettier.format(text, {
                        parser: "markdown",
                        plugins: [parserMarkdown.default],
                        tabWidth: 2,
                        proseWrap: "preserve",
                    });
                    return { formatted };
                } catch (error) {
                    return {
                        formatted: text,
                        error: `Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }

            case "python": {
                // Basic Python formatting: normalize indentation and whitespace
                try {
                    const lines = text.split('\n');
                    const formatted = lines
                        .map(line => line.trimEnd()) // Remove trailing whitespace
                        .join('\n')
                        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive blank lines
                        .trim();
                    return { formatted };
                } catch (error) {
                    return {
                        formatted: text,
                        error: `Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }

            case "c":
            case "cpp": {
                // Basic C/C++ formatting: normalize whitespace and basic indentation
                try {
                    const formatted = text
                        // Normalize spaces around operators
                        .replace(/\s*([+\-*/%=<>!&|^])\s*/g, ' $1 ')
                        .replace(/\s+([;,])/g, '$1')
                        .replace(/([;,])(\S)/g, '$1 $2')
                        // Normalize braces
                        .replace(/\{\s+/g, '{\n')
                        .replace(/\s+\}/g, '\n}')
                        // Remove trailing whitespace
                        .split('\n')
                        .map(line => line.trimEnd())
                        .join('\n')
                        // Max 2 consecutive blank lines
                        .replace(/\n{3,}/g, '\n\n')
                        .trim();

                    return { formatted };
                } catch (error) {
                    return {
                        formatted: text,
                        error: `Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }

            case "auto": {
                const detection = detectLanguage(text);
                if (detection.language !== "auto" && detection.language !== "text") {
                    return formatCode(text, detection.language);
                }
                return { formatted: text, error: "Could not auto-detect language" };
            }

            case "text":
            default:
                return { formatted: text };
        }
    } catch (error) {
        return {
            formatted: text,
            error: error instanceof Error ? error.message : "Formatting failed"
        };
    }
}

/**
 * Get display name for language
 */
export function getLanguageDisplayName(language: Language): string {
    const names: Record<Language, string> = {
        auto: "Auto-detect",
        json: "JSON",
        yaml: "YAML",
        javascript: "JavaScript",
        typescript: "TypeScript",
        python: "Python",
        c: "C",
        cpp: "C++",
        css: "CSS",
        html: "HTML",
        markdown: "Markdown",
        text: "Plain Text",
    };
    return names[language];
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Language[] {
    return ["auto", "json", "yaml", "python", "c", "cpp", "javascript", "typescript", "css", "html", "markdown", "text"];
}
