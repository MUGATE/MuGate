import crypto from "crypto";

/**
 * Content Cleaner — Transforms raw HTML into clean, searchable text.
 * Removes noise (scripts, styles, navigation, footers), normalizes whitespace,
 * extracts keywords, and chunks content for RAG storage.
 */
export class ContentCleaner {

    // ─── Stop words for keyword extraction ─────────────────
    private static STOP_WORDS = new Set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "as", "is", "are", "was", "were", "be",
        "been", "being", "have", "has", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "can", "shall", "this",
        "that", "these", "those", "it", "its", "they", "them", "their",
        "we", "us", "our", "you", "your", "he", "she", "him", "her", "his",
        "i", "me", "my", "not", "no", "nor", "so", "too", "very", "just",
        "about", "above", "after", "again", "all", "also", "any", "each",
        "every", "few", "how", "if", "into", "more", "most", "much", "only",
        "other", "over", "same", "some", "such", "than", "then", "there",
        "through", "under", "up", "what", "when", "where", "which", "who",
        "whom", "why", "between", "during", "before", "out", "down",
        "here", "own", "both", "while", "because", "until", "once",
        "further", "then", "am", "been", "below", "above", "off",
        "need", "page", "click", "menu", "home", "skip", "read", "more",
        "back", "next", "previous", "copyright", "rights", "reserved",
        "contact", "follow", "share", "print", "search", "site", "map",
        "www", "http", "https", "com", "org", "edu", "lb"
    ]);

    /**
     * Full pipeline: HTML → clean text
     */
    static cleanHtml(html: string): string {
        let text = html;

        // 1. Remove entire blocks we don't want
        text = this.removeTagBlocks(text, "script");
        text = this.removeTagBlocks(text, "style");
        text = this.removeTagBlocks(text, "noscript");
        text = this.removeTagBlocks(text, "iframe");
        text = this.removeTagBlocks(text, "svg");
        text = this.removeTagBlocks(text, "nav");
        text = this.removeTagBlocks(text, "footer");
        text = this.removeTagBlocks(text, "header");

        // 2. Remove HTML comments
        text = text.replace(/<!--[\s\S]*?-->/g, "");

        // 3. Remove common noise patterns
        text = text.replace(/<aside[\s\S]*?<\/aside>/gi, "");
        text = text.replace(/<form[\s\S]*?<\/form>/gi, "");

        // 4. Convert certain elements to preserve structure
        // Convert headings to text with markers
        text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n\n$1\n");
        // Convert paragraphs and divs to separate blocks
        text = text.replace(/<\/p>/gi, "\n\n");
        text = text.replace(/<br\s*\/?>/gi, "\n");
        text = text.replace(/<\/div>/gi, "\n");
        text = text.replace(/<\/li>/gi, "\n");
        text = text.replace(/<\/tr>/gi, "\n");
        text = text.replace(/<\/td>/gi, " | ");
        text = text.replace(/<\/th>/gi, " | ");

        // 5. Remove all remaining HTML tags
        text = text.replace(/<[^>]+>/g, " ");

        // 6. Decode HTML entities
        text = this.decodeHtmlEntities(text);

        // 7. Normalize whitespace
        text = this.normalizeWhitespace(text);

        return text;
    }

    /**
     * Extract the <title> text from HTML
     */
    static extractTitle(html: string): string {
        const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (match) {
            return this.decodeHtmlEntities(match[1]).trim();
        }

        // Fallback: try first h1
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (h1Match) {
            return h1Match[1].replace(/<[^>]+>/g, "").trim();
        }

        return "Untitled Page";
    }

    /**
     * Decode common HTML entities
     */
    static decodeHtmlEntities(text: string): string {
        return text
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&nbsp;/g, " ")
            .replace(/&mdash;/g, "—")
            .replace(/&ndash;/g, "–")
            .replace(/&laquo;/g, "«")
            .replace(/&raquo;/g, "»")
            .replace(/&copy;/g, "©")
            .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
            .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }

    /**
     * Remove an entire HTML tag block (including nested instances)
     */
    private static removeTagBlocks(html: string, tag: string): string {
        const regex = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi");
        return html.replace(regex, "");
    }

    /**
     * Normalize whitespace: collapse multiple spaces/newlines, trim
     */
    static normalizeWhitespace(text: string): string {
        return text
            .replace(/\t/g, " ")
            .replace(/ +/g, " ")           // collapse spaces
            .replace(/\n\s*\n\s*\n/g, "\n\n") // max 2 newlines
            .replace(/\n /g, "\n")         // no leading spaces after newline
            .trim();
    }

    /**
     * Extract meaningful keywords from text for search indexing.
     * Returns deduplicated, sorted array of significant terms.
     */
    static extractKeywords(text: string): string[] {
        const words = text
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, " ")  // keep letters, numbers, Arabic, hyphens
            .split(/\s+/)
            .filter(w => w.length > 2)
            .filter(w => !this.STOP_WORDS.has(w));

        // Count word frequency
        const freq: Map<string, number> = new Map();
        for (const word of words) {
            freq.set(word, (freq.get(word) || 0) + 1);
        }

        // Sort by frequency, take top keywords
        return Array.from(freq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(([word]) => word);
    }

    /**
     * Split content into chunks of approximately maxWords each.
     * Tries to split at paragraph/sentence boundaries.
     */
    static chunkContent(text: string, maxWords: number = 500): string[] {
        if (!text || text.trim().length === 0) return [];

        const words = text.split(/\s+/);
        if (words.length <= maxWords) {
            return [text.trim()];
        }

        const chunks: string[] = [];
        const paragraphs = text.split(/\n\n+/);
        let currentChunk: string[] = [];
        let currentWordCount = 0;

        for (const paragraph of paragraphs) {
            const paragraphWords = paragraph.split(/\s+/).length;

            // If a single paragraph exceeds maxWords, split by sentences
            if (paragraphWords > maxWords) {
                // Flush current chunk
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.join("\n\n").trim());
                    currentChunk = [];
                    currentWordCount = 0;
                }

                // Split paragraph by sentences
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                let sentenceChunk: string[] = [];
                let sentenceWordCount = 0;

                for (const sentence of sentences) {
                    const sentenceWords = sentence.split(/\s+/).length;
                    if (sentenceWordCount + sentenceWords > maxWords && sentenceChunk.length > 0) {
                        chunks.push(sentenceChunk.join(" ").trim());
                        sentenceChunk = [];
                        sentenceWordCount = 0;
                    }
                    sentenceChunk.push(sentence);
                    sentenceWordCount += sentenceWords;
                }

                if (sentenceChunk.length > 0) {
                    chunks.push(sentenceChunk.join(" ").trim());
                }
                continue;
            }

            // If adding this paragraph exceeds limit, start new chunk
            if (currentWordCount + paragraphWords > maxWords && currentChunk.length > 0) {
                chunks.push(currentChunk.join("\n\n").trim());
                currentChunk = [];
                currentWordCount = 0;
            }

            currentChunk.push(paragraph);
            currentWordCount += paragraphWords;
        }

        // Flush remaining
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join("\n\n").trim());
        }

        return chunks.filter(c => c.length > 20); // Filter out tiny fragments
    }

    /**
     * Compute SHA-256 hash of content for change detection
     */
    static computeHash(content: string): string {
        return crypto.createHash("sha256").update(content).digest("hex");
    }

    /**
     * Check if content is meaningful (not just navigation/boilerplate)
     */
    static isContentMeaningful(text: string): boolean {
        const words = text.split(/\s+/).length;
        if (words < 30) return false;  // Too short
        if (text.length < 100) return false;

        // Check for excessive repetition (navigation menus)
        const lines = text.split("\n").filter(l => l.trim().length > 0);
        if (lines.length > 5) {
            const uniqueLines = new Set(lines.map(l => l.trim().toLowerCase()));
            const uniqueRatio = uniqueLines.size / lines.length;
            if (uniqueRatio < 0.3) return false; // Too many duplicate lines
        }

        return true;
    }

    /**
     * Detect primary language of text (simple heuristic)
     */
    static detectLanguage(text: string): "ar" | "en" | "fr" {
        const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
        const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
        const totalChars = arabicChars + latinChars;

        if (totalChars === 0) return "en";
        if (arabicChars / totalChars > 0.3) return "ar";

        // Check for French patterns
        const frenchPatterns = /\b(les|des|une|est|dans|pour|avec|qui|sur|pas|sont|cette|tous|aux)\b/gi;
        const frenchMatches = (text.match(frenchPatterns) || []).length;
        if (frenchMatches > 5) return "fr";

        return "en";
    }
}
