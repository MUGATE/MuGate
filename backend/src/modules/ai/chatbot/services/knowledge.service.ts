import { KnowledgeRepository } from "../../../system/scraper/knowledge.repository";
import { KnowledgeChunk, ScoredChunk } from "../../../system/scraper/scraper.types";
import { logger } from "../../../../core/logger/logger";
import { ragConfig } from "../../../../config/rag.config";
import { EmbeddingService } from "../../rag/embedding.service";
import { VectorRepository, VectorSearchResult } from "../../rag/vector.repository";
import { LiveSearchService } from "../../rag/live-search.service";

export interface RagRetrievalResult {
    context: string;
    sourcesFound: number;
    categories: string[];
    confidence: number;
    freshlyScraped: boolean;
}

/**
 * Knowledge Service — Hybrid RAG retrieval (vector + keyword) with live search fallback.
 */
export class KnowledgeService {

    private static STOP_WORDS = new Set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "as", "is", "are", "was", "were", "be",
        "been", "have", "has", "had", "do", "does", "did", "will", "would",
        "could", "should", "can", "shall", "this", "that", "these", "those",
        "it", "its", "they", "them", "their", "we", "us", "our", "you", "your",
        "he", "she", "him", "her", "his", "i", "me", "my", "not", "no",
        "so", "very", "just", "about", "all", "also", "any", "each", "how",
        "if", "more", "most", "much", "only", "other", "some", "such", "than",
        "then", "there", "what", "when", "where", "which", "who", "why",
        "tell", "know", "want", "need", "please", "hello", "hi", "hey",
        "thanks", "thank", "yes", "no", "ok", "okay", "sure",
        "can", "does", "many", "much", "get", "got", "give"
    ]);

    private static SYNONYMS: Record<string, string[]> = {
        "faculty": ["college", "school", "department", "faculties"],
        "program": ["major", "degree", "programs", "majors", "degrees"],
        "course": ["class", "subject", "courses", "classes", "subjects"],
        "tuition": ["fees", "cost", "payment", "price", "tuitions"],
        "admission": ["apply", "application", "enroll", "enrollment", "admissions", "register", "registration"],
        "scholarship": ["financial aid", "grant", "scholarships", "aid"],
        "calendar": ["dates", "deadline", "schedule", "semester", "deadlines"],
        "regulation": ["rule", "policy", "rules", "policies", "regulations", "bylaws"],
        "gpa": ["grades", "grade", "average", "cgpa"],
        "credit": ["credits", "hours", "credit hours"],
        "campus": ["location", "facilities", "building", "library"],
        "professor": ["instructor", "teacher", "dr", "doctor", "doctors", "professors", "instructors", "teachers", "dean", "deans", "staff", "lecturer", "lecturers"],
    };

    static async retrieveContext(question: string): Promise<RagRetrievalResult> {
        try {
            const searchTerms = this.extractSearchTerms(question);
            const expandedTerms = this.expandWithSynonyms(searchTerms);

            logger.info(`RAG Search terms: [${searchTerms.join(", ")}] → expanded: [${expandedTerms.join(", ")}]`);

            if (expandedTerms.length === 0) {
                return { context: "", sourcesFound: 0, categories: [], confidence: 0, freshlyScraped: false };
            }

            const [vectorResults, keywordChunks] = await Promise.all([
                this.vectorSearch(question),
                KnowledgeRepository.searchByKeywords(expandedTerms, ragConfig.keywordTopK),
            ]);

            const keywordScored = this.scoreResults(keywordChunks, searchTerms);
            const merged = this.reciprocalRankFusion(vectorResults, keywordScored);
            const relevant = merged.filter(c => (c.relevanceScore || 0) >= 2);

            let confidence = this.computeConfidence(merged);
            let context = "";
            let categories: string[] = [];
            let sourcesFound = 0;
            let freshlyScraped = false;

            if (relevant.length > 0) {
                context = this.formatContext(relevant.slice(0, 5));
                categories = [...new Set(relevant.map(c => c.category))];
                sourcesFound = relevant.length;
                logger.info(`RAG hybrid: ${sourcesFound} chunks, confidence=${confidence.toFixed(2)}`);
            }

            if (confidence < ragConfig.confidenceThreshold) {
                logger.info(`RAG confidence ${confidence.toFixed(2)} below threshold — triggering live search`);
                const liveResult = await LiveSearchService.searchAndIngest(question);

                if (liveResult.sourcesFound > 0) {
                    freshlyScraped = true;
                    if (context) {
                        context = `${context}\n\n---\n\n${liveResult.context}`;
                    } else {
                        context = liveResult.context;
                    }
                    categories = [...new Set([...categories, ...liveResult.categories])];
                    sourcesFound += liveResult.sourcesFound;
                    confidence = Math.max(confidence, 0.65);
                }
            }

            return { context, sourcesFound, categories, confidence, freshlyScraped };

        } catch (error: any) {
            logger.error(`RAG retrieval error: ${error.message}`);
            return { context: "", sourcesFound: 0, categories: [], confidence: 0, freshlyScraped: false };
        }
    }

    private static async vectorSearch(question: string): Promise<VectorSearchResult[]> {
        try {
            const embedding = await EmbeddingService.embedText(question);
            return await VectorRepository.search(embedding, ragConfig.vectorTopK);
        } catch (err: any) {
            logger.warn(`Vector search failed: ${err.message}`);
            return [];
        }
    }

    private static reciprocalRankFusion(
        vectorResults: VectorSearchResult[],
        keywordResults: ScoredChunk[],
        k: number = 60
    ): ScoredChunk[] {
        const scores = new Map<string, { chunk: ScoredChunk; score: number }>();

        vectorResults.forEach((vr, rank) => {
            const chunk: ScoredChunk = {
                id: vr.id,
                pageId: vr.metadata.pageId,
                chunkIndex: 0,
                content: vr.content,
                keywords: vr.metadata.keywords,
                category: vr.metadata.category as ScoredChunk["category"],
                title: vr.metadata.title,
                createdAt: new Date(),
                relevanceScore: vr.score * 100,
                matchedTerms: [],
            };
            const rrf = 1 / (k + rank + 1);
            scores.set(vr.id, { chunk, score: rrf + vr.score });
        });

        keywordResults.forEach((kr, rank) => {
            const rrf = 1 / (k + rank + 1);
            const existing = scores.get(kr.id);
            if (existing) {
                existing.score += rrf + (kr.relevanceScore || 0) / 100;
                existing.chunk.relevanceScore = (existing.chunk.relevanceScore || 0) + (kr.relevanceScore || 0);
            } else {
                scores.set(kr.id, { chunk: kr, score: rrf + (kr.relevanceScore || 0) / 100 });
            }
        });

        return [...scores.values()]
            .sort((a, b) => b.score - a.score)
            .map(s => ({ ...s.chunk, relevanceScore: s.score * 100 }));
    }

    private static computeConfidence(merged: ScoredChunk[]): number {
        if (merged.length === 0) return 0;
        const top = merged[0].relevanceScore || 0;
        return Math.min(top / 100, 1);
    }

    static extractSearchTerms(question: string): string[] {
        const terms = question
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, " ")
            .split(/\s+/)
            .filter(w => w.length > 2)
            .filter(w => !this.STOP_WORDS.has(w));
        return [...new Set(terms)];
    }

    private static expandWithSynonyms(terms: string[]): string[] {
        const expanded = new Set(terms);
        for (const term of terms) {
            for (const [key, synonyms] of Object.entries(this.SYNONYMS)) {
                if (term === key || synonyms.includes(term)) {
                    expanded.add(key);
                    synonyms.forEach(s => {
                        if (!s.includes(" ")) expanded.add(s);
                    });
                }
            }
        }
        return [...expanded];
    }

    private static scoreResults(chunks: any[], searchTerms: string[]): ScoredChunk[] {
        return chunks.map(chunk => {
            let score = chunk.relevanceScore || 0;
            const matchedTerms: string[] = [];
            const contentLower = (chunk.content || "").toLowerCase();
            const titleLower = (chunk.title || "").toLowerCase();
            const keywordsLower = (chunk.keywords || "").toLowerCase();

            for (const term of searchTerms) {
                if (titleLower.includes(term)) { score += 5; matchedTerms.push(term); }
                const contentMatches = (contentLower.match(new RegExp(term, "g")) || []).length;
                if (contentMatches > 0) {
                    score += Math.min(contentMatches * 2, 8);
                    if (!matchedTerms.includes(term)) matchedTerms.push(term);
                }
                if (keywordsLower.includes(term)) {
                    score += 3;
                    if (!matchedTerms.includes(term)) matchedTerms.push(term);
                }
            }

            return { ...chunk, relevanceScore: score, matchedTerms };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    private static formatContext(chunks: ScoredChunk[]): string {
        if (chunks.length === 0) return "";
        const sections: string[] = [];
        for (const chunk of chunks) {
            const header = chunk.title
                ? `[${chunk.category.toUpperCase()} — ${chunk.title}]`
                : `[${chunk.category.toUpperCase()}]`;
            sections.push(`${header}\n${chunk.content.trim()}`);
        }
        return sections.join("\n\n---\n\n");
    }

    static async hasKnowledgeBase(): Promise<boolean> {
        try {
            const stats = await KnowledgeRepository.getStats();
            return stats.totalChunks > 0;
        } catch {
            return false;
        }
    }
}
