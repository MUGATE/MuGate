import { logger } from "../../../core/logger/logger";
import { ragConfig } from "../../../config/rag.config";
import { ContentCleaner } from "../../system/scraper/content.cleaner";

const embeddingCache = new Map<string, number[]>();

/**
 * Embedding Service — generates text embeddings via Gemini API.
 */
export class EmbeddingService {
    private static async callGeminiEmbed(text: string): Promise<number[]> {
        const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "";
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY required for embeddings");
        }

        const models = [
            ragConfig.embeddingModel,
            "text-embedding-004",
            "embedding-001",
            "gemini-embedding-001",
        ].filter((m, i, arr) => arr.indexOf(m) === i);

        let lastError = "";

        for (const model of models) {
            for (const version of ["v1beta", "v1"]) {
                try {
                    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:embedContent?key=${apiKey}`;
                    const response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: `models/${model}`,
                            content: { parts: [{ text: text.substring(0, 8000) }] },
                        }),
                    });

                    if (!response.ok) {
                        lastError = await response.text();
                        continue;
                    }

                    const data = await response.json() as { embedding?: { values?: number[] } };
                    const values = data.embedding?.values;
                    if (values && values.length > 0) return values;
                } catch (err: any) {
                    lastError = err.message;
                }
            }
        }

        throw new Error(`Gemini embed failed: ${lastError}`);
    }

    /** Deterministic fallback when no API key — simple bag-of-words hash vector */
    private static fallbackEmbed(text: string): number[] {
        const dim = 384;
        const vec = new Array(dim).fill(0);
        const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        for (const word of words) {
            let hash = 0;
            for (let i = 0; i < word.length; i++) {
                hash = ((hash << 5) - hash) + word.charCodeAt(i);
                hash |= 0;
            }
            const idx = Math.abs(hash) % dim;
            vec[idx] += 1;
        }
        const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
        return vec.map(v => v / norm);
    }

    static async embedText(text: string): Promise<number[]> {
        const hash = ContentCleaner.computeHash(text);
        const cached = embeddingCache.get(hash);
        if (cached) return cached;

        let vector: number[];
        try {
            if (ragConfig.embeddingProvider === "gemini") {
                vector = await this.callGeminiEmbed(text);
            } else {
                vector = this.fallbackEmbed(text);
            }
        } catch (err: any) {
            logger.warn(`Embedding API failed, using fallback: ${err.message}`);
            vector = this.fallbackEmbed(text);
        }

        embeddingCache.set(hash, vector);
        return vector;
    }

    static async embedBatch(texts: string[]): Promise<number[][]> {
        const results: number[][] = [];
        for (const text of texts) {
            results.push(await this.embedText(text));
        }
        return results;
    }
}
