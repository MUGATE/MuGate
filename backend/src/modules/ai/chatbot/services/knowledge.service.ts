import { KnowledgeRepository } from "../../../system/scraper/knowledge.repository";
import { KnowledgeChunk, ScoredChunk } from "../../../system/scraper/scraper.types";
import { logger } from "../../../../core/logger/logger";

/**
 * Knowledge Service — RAG Retrieval Layer.
 * Handles searching the knowledge base and formatting context for the AI.
 */
export class KnowledgeService {

    // Stop words to filter from search queries
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

    // Academic term synonyms for query expansion
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

    /**
     * Main retrieval method: search knowledge base for relevant context.
     * Returns formatted context string ready for the AI prompt.
     */
    static async retrieveContext(question: string): Promise<{
        context: string;
        sourcesFound: number;
        categories: string[];
    }> {
        try {
            // 1. Extract and expand search terms
            const searchTerms = this.extractSearchTerms(question);
            const expandedTerms = this.expandWithSynonyms(searchTerms);

            logger.info(`RAG Search terms: [${searchTerms.join(", ")}] → expanded: [${expandedTerms.join(", ")}]`);

            if (expandedTerms.length === 0) {
                return { context: "", sourcesFound: 0, categories: [] };
            }

            // 2. Search knowledge base
            const chunks = await KnowledgeRepository.searchByKeywords(expandedTerms, 8);

            if (chunks.length === 0) {
                logger.info("RAG: No matching knowledge found.");
                return { context: "", sourcesFound: 0, categories: [] };
            }

            // 3. Re-score and rank results with application-level scoring
            const scored = this.scoreResults(chunks, searchTerms);

            // 4. Filter by minimum relevance threshold
            const relevant = scored.filter(c => c.relevanceScore >= 2);

            if (relevant.length === 0) {
                logger.info("RAG: Chunks found but below relevance threshold.");
                return { context: "", sourcesFound: 0, categories: [] };
            }

            // 5. Format context for the AI
            const context = this.formatContext(relevant.slice(0, 5));
            const categories = [...new Set(relevant.map(c => c.category))];

            logger.info(`RAG: Retrieved ${relevant.length} relevant chunks from categories: [${categories.join(", ")}]`);

            return {
                context,
                sourcesFound: relevant.length,
                categories,
            };

        } catch (error: any) {
            logger.error(`RAG retrieval error: ${error.message}`);
            return { context: "", sourcesFound: 0, categories: [] };
        }
    }

    /**
     * Extract meaningful search terms from a question
     */
    static extractSearchTerms(question: string): string[] {
        const terms = question
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, " ")  // Keep letters, numbers, Arabic, hyphens
            .split(/\s+/)
            .filter(w => w.length > 2)
            .filter(w => !this.STOP_WORDS.has(w));

        // Deduplicate
        return [...new Set(terms)];
    }

    /**
     * Expand search terms with synonyms for broader retrieval
     */
    private static expandWithSynonyms(terms: string[]): string[] {
        const expanded = new Set(terms);

        for (const term of terms) {
            // Check if the term matches any synonym key
            for (const [key, synonyms] of Object.entries(this.SYNONYMS)) {
                if (term === key || synonyms.includes(term)) {
                    expanded.add(key);
                    synonyms.forEach(s => {
                        if (!s.includes(" ")) expanded.add(s); // Only add single-word synonyms to SQL search
                    });
                }
            }
        }

        return [...expanded];
    }

    /**
     * Score search results for relevance.
     * Combines SQL-level scoring with application-level term analysis.
     */
    private static scoreResults(chunks: any[], searchTerms: string[]): ScoredChunk[] {
        return chunks.map(chunk => {
            let score = chunk.relevanceScore || 0;
            const matchedTerms: string[] = [];

            const contentLower = (chunk.content || "").toLowerCase();
            const titleLower = (chunk.title || "").toLowerCase();
            const keywordsLower = (chunk.keywords || "").toLowerCase();

            for (const term of searchTerms) {
                // Title match (highest weight)
                if (titleLower.includes(term)) {
                    score += 5;
                    matchedTerms.push(term);
                }

                // Content match with frequency bonus
                const contentMatches = (contentLower.match(new RegExp(term, "g")) || []).length;
                if (contentMatches > 0) {
                    score += Math.min(contentMatches * 2, 8); // Cap at 8 for frequency
                    if (!matchedTerms.includes(term)) matchedTerms.push(term);
                }

                // Keyword match
                if (keywordsLower.includes(term)) {
                    score += 3;
                    if (!matchedTerms.includes(term)) matchedTerms.push(term);
                }
            }

            return {
                ...chunk,
                relevanceScore: score,
                matchedTerms,
            };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Format retrieved chunks into a clean context string for the AI prompt.
     */
    private static formatContext(chunks: ScoredChunk[]): string {
        if (chunks.length === 0) return "";

        const sections: string[] = [];

        for (const chunk of chunks) {
            const header = chunk.title ? `[${chunk.category.toUpperCase()} — ${chunk.title}]` : `[${chunk.category.toUpperCase()}]`;
            sections.push(`${header}\n${chunk.content.trim()}`);
        }

        return sections.join("\n\n---\n\n");
    }

    /**
     * Quick check: does the knowledge base have any content?
     */
    static async hasKnowledgeBase(): Promise<boolean> {
        try {
            const stats = await KnowledgeRepository.getStats();
            return stats.totalChunks > 0;
        } catch {
            return false;
        }
    }
}
