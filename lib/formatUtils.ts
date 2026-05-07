import * as yaml from "js-yaml";

export type Language = "auto" | "json" | "yaml" | "javascript" | "typescript" | "python" | "c" | "cpp" | "css" | "html" | "markdown" | "text";

export interface DetectionResult {
    language: Language;
    confidence: "high" | "medium" | "low";
}

/**
 * Map file extension to language
 */
export function detectLanguageFromFilename(filename: string): Language | null {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext) return null;

    const map: Record<string, Language> = {
        json: "json",
        yaml: "yaml", yml: "yaml",
        js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
        ts: "typescript", tsx: "typescript", mts: "typescript", cts: "typescript",
        py: "python", pyw: "python",
        c: "c", h: "c",
        cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hxx: "cpp", hh: "cpp",
        css: "css", scss: "css", sass: "css", less: "css",
        html: "html", htm: "html", xhtml: "html", xml: "html", svg: "html",
        md: "markdown", mdx: "markdown", markdown: "markdown",
    };

    return map[ext] ?? null;
}

/**
 * Auto-detect the language of the given text using a weighted scoring system.
 * Each language gets a score based on how many characteristic patterns match.
 * The language with the highest score wins.
 */
export function detectLanguage(text: string): DetectionResult {
    if (!text || text.trim().length === 0) {
        return { language: "text", confidence: "high" };
    }

    const trimmed = text.trim();
    const lines = trimmed.split("\n");

    // --- Try definitive JSON parse first (very reliable) ---
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
            JSON.parse(trimmed);
            return { language: "json", confidence: "high" };
        } catch {
            // Not valid JSON
        }
    }

    // --- Scoring system: each language accumulates points ---
    const scores: Partial<Record<Language, number>> = {};
    const add = (lang: Language, points: number) => {
        scores[lang] = (scores[lang] || 0) + points;
    };

    // ========== HTML ==========
    // Require actual HTML tags, not just angle brackets
    const htmlDoctype = /<!DOCTYPE\s+html/i.test(trimmed);
    const htmlTags = /<\/?(?:html|head|body|div|span|p|a|ul|ol|li|table|tr|td|th|form|input|button|script|style|link|meta|img|h[1-6]|section|article|nav|header|footer|main|aside)\b[^>]*>/i;
    const hasHtmlTags = htmlTags.test(trimmed);
    const closingTags = (trimmed.match(/<\/[a-z][a-z0-9]*>/gi) || []).length;

    if (htmlDoctype) add("html", 20);
    if (hasHtmlTags) add("html", 10);
    if (closingTags >= 2) add("html", 5);
    // Self-closing tags like <br/>, <img ... />
    if (/<[a-z][a-z0-9]*\b[^>]*\/>/i.test(trimmed)) add("html", 3);

    // ========== CSS ==========
    // Look for actual CSS selectors + property declarations
    const cssBlockPattern = /(?:^|\n)\s*(?:[.#@][\w-]|[\w-]+\s*[,{]|:root|::?\w)/m;
    const cssPropertyPattern = /\b(?:color|background|margin|padding|border|font|display|position|width|height|flex|grid|align|justify|overflow|opacity|transform|transition|animation|z-index|cursor|text-align|line-height|box-shadow)\s*:/;
    const cssAtRule = /@(?:media|keyframes|import|font-face|supports|charset|layer)\b/;

    if (cssBlockPattern.test(trimmed) && cssPropertyPattern.test(trimmed)) add("css", 12);
    if (cssAtRule.test(trimmed)) add("css", 8);
    if ((trimmed.match(cssPropertyPattern) || []).length >= 3) add("css", 6);

    // ========== Python ==========
    const pyKeywords = /\b(?:def|elif|except|finally|from\s+\S+\s+import|with\s+\S+\s+as|lambda|yield|nonlocal|global)\b/;
    const pyBuiltins = /\b(?:print|range|len|str|int|float|list|dict|tuple|set|enumerate|zip|map|filter|isinstance|hasattr|getattr|super)\s*\(/;
    const pyMainGuard = /if\s+__name__\s*==\s*["']__main__["']/;
    const pyDecorator = /^\s*@\w+/m;
    const pyColonBlock = /:\s*$/m;
    const pyImport = /^(?:import\s+\w|from\s+\w)/m;
    const pyFString = /f["'][^"']*\{[^}]+\}[^"']*["']/;
    const pyTripleQuote = /"""|'''/;
    const pyIndentBlock = /:\s*\n\s{4,}\S/;

    if (pyKeywords.test(trimmed)) add("python", 10);
    if (pyBuiltins.test(trimmed)) add("python", 8);
    if (pyMainGuard.test(trimmed)) add("python", 15);
    if (pyDecorator.test(trimmed)) add("python", 6);
    if (pyImport.test(trimmed)) add("python", 7);
    if (pyFString.test(trimmed)) add("python", 8);
    if (pyTripleQuote.test(trimmed)) add("python", 4);
    if (pyIndentBlock.test(trimmed)) add("python", 5);
    // Colon blocks are common in Python but also in YAML — only mild signal
    if (pyColonBlock.test(trimmed) && (pyKeywords.test(trimmed) || pyBuiltins.test(trimmed))) {
        add("python", 3);
    }

    // ========== C++ ==========
    const cppIncludes = /#include\s*<(?:iostream|vector|string|algorithm|map|set|queue|stack|deque|array|list|unordered_map|unordered_set|memory|functional|numeric|fstream|sstream|chrono|thread|mutex|regex|utility|tuple|optional|variant|filesystem)>/;
    const cppKeywords = /\b(?:namespace|template|typename|class\s+\w+\s*[:{]|public:|private:|protected:|virtual|override|nullptr|constexpr|decltype|static_cast|dynamic_cast|reinterpret_cast|const_cast|noexcept)\b/;
    const cppStd = /\b(?:std::|cout|cin|endl|cerr|clog|string_view|unique_ptr|shared_ptr|make_unique|make_shared|vector<|map<|set<|pair<)\b/;
    const cppUsing = /using\s+namespace\s+std/;

    if (cppIncludes.test(trimmed)) add("cpp", 15);
    if (cppKeywords.test(trimmed)) add("cpp", 10);
    if (cppStd.test(trimmed)) add("cpp", 10);
    if (cppUsing.test(trimmed)) add("cpp", 8);

    // ========== C ==========
    const cIncludes = /#include\s*<(?:stdio|stdlib|string|math|time|ctype|errno|signal|stdarg|stddef|limits|float|assert|locale|setjmp|stdbool|stdint|inttypes|unistd|fcntl|sys\/\w+)\.h>/;
    const cKeywords = /\b(?:printf|scanf|malloc|calloc|realloc|free|sizeof|NULL|typedef\s+struct|FILE\s*\*|fopen|fclose|fprintf|fscanf|fgets|fputs|fread|fwrite|sprintf|sscanf|memcpy|memset|strcpy|strcat|strcmp|strlen|atoi|atof|exit)\b/;
    const cMain = /\b(?:int|void)\s+main\s*\(\s*(?:void|int\s+argc|)\s*[,)]/;

    if (cIncludes.test(trimmed)) add("c", 15);
    if (cKeywords.test(trimmed)) add("c", 10);
    if (cMain.test(trimmed)) add("c", 8);
    // If we also have C++ signals, downweight C
    if ((scores["c"] || 0) > 0 && (scores["cpp"] || 0) > 0) {
        // C++ subsumes C — prefer C++ when both match
        scores["c"] = Math.floor((scores["c"] || 0) * 0.5);
    }

    // ========== TypeScript ==========
    const tsTypeAnnotations = /:\s*(?:string|number|boolean|any|void|unknown|never|null|undefined)\b/;
    const tsKeywords = /\b(?:interface\s+\w+|type\s+\w+\s*=|enum\s+\w+|namespace\s+\w+|declare\s+|as\s+\w+|readonly\s+|keyof\s+|typeof\s+|infer\s+)\b/;
    const tsGenerics = /<(?:string|number|boolean|any|unknown|T|K|V|Props|State)\s*[,>]/;
    const tsNonNull = /!\./;

    if (tsTypeAnnotations.test(trimmed)) add("typescript", 8);
    if (tsKeywords.test(trimmed)) add("typescript", 12);
    if (tsGenerics.test(trimmed)) add("typescript", 6);
    if (tsNonNull.test(trimmed)) add("typescript", 4);

    // ========== JavaScript (also contributes to TypeScript) ==========
    const jsKeywords = /\b(?:function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|class\s+\w+|async\s+function|await\s+|export\s+(?:default\s+)?(?:function|class|const)|import\s+.*\s+from\s+)/;
    const jsConsole = /\bconsole\.(?:log|error|warn|info|debug|trace)\s*\(/;
    const jsDom = /\b(?:document|window|localStorage|sessionStorage|addEventListener|getElementById|querySelector)\b/;
    const jsModules = /\b(?:require|module\.exports|exports\.)\b/;
    const jsArrow = /(?:=>)/;
    const jsPromise = /\.(?:then|catch|finally)\s*\(/;
    const jsDestructure = /(?:const|let|var)\s*(?:\{[^}]+\}|\[[^\]]+\])\s*=/;
    const jsSpread = /\.\.\.\w+/;

    if (jsKeywords.test(trimmed)) add("javascript", 8);
    if (jsConsole.test(trimmed)) add("javascript", 6);
    if (jsDom.test(trimmed)) add("javascript", 6);
    if (jsModules.test(trimmed)) add("javascript", 6);
    if (jsArrow.test(trimmed)) add("javascript", 3);
    if (jsPromise.test(trimmed)) add("javascript", 4);
    if (jsDestructure.test(trimmed)) add("javascript", 4);
    if (jsSpread.test(trimmed)) add("javascript", 3);

    // If TypeScript has signals, boost from JS signals (TS is a superset)
    if ((scores["typescript"] || 0) > 0 && (scores["javascript"] || 0) > 0) {
        scores["typescript"] = (scores["typescript"] || 0) + Math.floor((scores["javascript"] || 0) * 0.6);
        scores["javascript"] = Math.floor((scores["javascript"] || 0) * 0.4);
    }

    // ========== YAML ==========
    // Much stricter: require multiple key-value lines and nested indentation
    const yamlKeyValueLines = lines.filter(l => /^\s*[\w][\w.-]*\s*:\s*.+/.test(l)).length;
    const yamlNestedIndent = lines.filter(l => /^\s{2,}[\w][\w.-]*\s*:/.test(l)).length;
    const yamlListItems = lines.filter(l => /^\s*-\s+\w/.test(l)).length;
    const yamlDocMarker = /^---\s*$/m.test(trimmed);
    const yamlMultilineScalar = /[|>]-?\s*$/m.test(trimmed);

    // Only consider YAML if there's enough structure and it actually parses
    const yamlLikeEnough = yamlKeyValueLines >= 2 || yamlDocMarker;
    if (yamlLikeEnough) {
        try {
            const parsed = yaml.load(trimmed);
            if (parsed && typeof parsed === "object") {
                if (yamlDocMarker) add("yaml", 10);
                if (yamlKeyValueLines >= 5) add("yaml", 8);
                else if (yamlKeyValueLines >= 2) add("yaml", 4);
                if (yamlNestedIndent >= 2) add("yaml", 6);
                if (yamlListItems >= 2) add("yaml", 4);
                if (yamlMultilineScalar) add("yaml", 5);

                // Penalize YAML if other languages score higher — YAML parser eats almost anything
                const otherMax = Math.max(
                    scores["python"] || 0,
                    scores["javascript"] || 0,
                    scores["typescript"] || 0,
                    scores["css"] || 0,
                    scores["html"] || 0,
                    scores["c"] || 0,
                    scores["cpp"] || 0,
                );
                if (otherMax > (scores["yaml"] || 0)) {
                    scores["yaml"] = Math.floor((scores["yaml"] || 0) * 0.3);
                }
            }
        } catch {
            // Not valid YAML — no points
        }
    }

    // ========== Markdown ==========
    const mdHeadings = lines.filter(l => /^#{1,6}\s+.+/.test(l)).length;
    const mdLinks = (trimmed.match(/\[.+?\]\(.+?\)/g) || []).length;
    const mdCodeBlocks = (trimmed.match(/^```/gm) || []).length;
    const mdBold = (trimmed.match(/\*\*.+?\*\*/g) || []).length;
    const mdBlockquote = lines.filter(l => /^>\s+/.test(l)).length;

    if (mdHeadings >= 2) add("markdown", 10);
    else if (mdHeadings === 1) add("markdown", 4);
    if (mdLinks >= 2) add("markdown", 5);
    if (mdCodeBlocks >= 2) add("markdown", 8);
    if (mdBold >= 1) add("markdown", 3);
    if (mdBlockquote >= 1) add("markdown", 3);

    // Penalize markdown if code languages score higher
    if ((scores["markdown"] || 0) > 0) {
        const codeMax = Math.max(
            scores["python"] || 0,
            scores["javascript"] || 0,
            scores["typescript"] || 0,
            scores["css"] || 0,
            scores["c"] || 0,
            scores["cpp"] || 0,
        );
        if (codeMax > (scores["markdown"] || 0)) {
            scores["markdown"] = Math.floor((scores["markdown"] || 0) * 0.3);
        }
    }

    // --- Pick the winner ---
    let bestLang: Language = "text";
    let bestScore = 0;

    for (const [lang, score] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestLang = lang as Language;
        }
    }

    // Require a minimum score threshold to avoid weak guesses
    if (bestScore < 5) {
        return { language: "text", confidence: "low" };
    }

    const confidence: DetectionResult["confidence"] =
        bestScore >= 15 ? "high" :
        bestScore >= 8 ? "medium" : "low";

    return { language: bestLang, confidence };
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
