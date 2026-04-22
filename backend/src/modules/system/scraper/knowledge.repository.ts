import { pool } from "../../../core/database/connection";
import { logger } from "../../../core/logger/logger";
import { ContentCleaner } from "./content.cleaner";
import {
    ScrapedPage,
    KnowledgePage,
    KnowledgeChunk,
    ScraperRun,
} from "./scraper.types";

/**
 * Knowledge Repository — Handles all database operations for the RAG knowledge base.
 * Manages pages, chunks, and scraper run logs.
 */
export class KnowledgeRepository {

    // ─── Page Operations ──────────────────────────────────

    /**
     * Upsert a scraped page: insert if new, update if content changed, skip if unchanged.
     * Returns "new", "updated", or "unchanged".
     */
    static async upsertPage(page: ScrapedPage): Promise<"new" | "updated" | "unchanged"> {
        try {
            // Check if page already exists
            const existing = await pool.request()
                .input("url", page.url)
                .query("SELECT id, contentHash FROM KnowledgePages WHERE url = @url");

            if (existing.recordset.length === 0) {
                // INSERT new page
                const insertResult = await pool.request()
                    .input("url", page.url)
                    .input("title", page.title)
                    .input("content", page.cleanContent)
                    .input("contentHash", page.contentHash)
                    .input("category", page.category)
                    .input("subcategory", page.subcategory || null)
                    .input("language", page.language)
                    .input("wordCount", page.wordCount)
                    .query(`
                        INSERT INTO KnowledgePages (url, title, content, contentHash, category, subcategory, language, wordCount, lastScrapedAt)
                        OUTPUT INSERTED.id
                        VALUES (@url, @title, @content, @contentHash, @category, @subcategory, @language, @wordCount, GETDATE())
                    `);

                const pageId = insertResult.recordset[0].id;

                // Create chunks for the new page
                await this.createChunksForPage(pageId, page);

                logger.info(`New page stored: ${page.url}`);
                return "new";
            }

            const existingPage = existing.recordset[0];

            // Check if content has changed
            if (existingPage.contentHash === page.contentHash) {
                // Content unchanged — just update lastScrapedAt
                await pool.request()
                    .input("url", page.url)
                    .query("UPDATE KnowledgePages SET lastScrapedAt = GETDATE() WHERE url = @url");
                return "unchanged";
            }

            // Content changed — update page and re-chunk
            await pool.request()
                .input("id", existingPage.id)
                .input("title", page.title)
                .input("content", page.cleanContent)
                .input("contentHash", page.contentHash)
                .input("category", page.category)
                .input("subcategory", page.subcategory || null)
                .input("language", page.language)
                .input("wordCount", page.wordCount)
                .query(`
                    UPDATE KnowledgePages SET
                        title = @title,
                        content = @content,
                        contentHash = @contentHash,
                        category = @category,
                        subcategory = @subcategory,
                        language = @language,
                        wordCount = @wordCount,
                        lastScrapedAt = GETDATE(),
                        updatedAt = GETDATE()
                    WHERE id = @id
                `);

            // Delete old chunks and create new ones
            await pool.request()
                .input("pageId", existingPage.id)
                .query("DELETE FROM KnowledgeChunks WHERE pageId = @pageId");

            await this.createChunksForPage(existingPage.id, page);

            logger.info(`Updated page: ${page.url}`);
            return "updated";

        } catch (error: any) {
            logger.error(`Failed to upsert page ${page.url}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create searchable chunks for a page
     */
    private static async createChunksForPage(pageId: string, page: ScrapedPage): Promise<void> {
        const chunks = ContentCleaner.chunkContent(page.cleanContent, 500);
        const pageKeywords = ContentCleaner.extractKeywords(page.cleanContent);

        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const chunkKeywords = ContentCleaner.extractKeywords(chunkContent);

            // Merge page-level and chunk-level keywords
            const allKeywords = [...new Set([...chunkKeywords, ...pageKeywords.slice(0, 10)])];

            await pool.request()
                .input("pageId", pageId)
                .input("chunkIndex", i)
                .input("content", chunkContent)
                .input("keywords", allKeywords.join(","))
                .input("category", page.category)
                .input("title", page.title)
                .query(`
                    INSERT INTO KnowledgeChunks (pageId, chunkIndex, content, keywords, category, title)
                    VALUES (@pageId, @chunkIndex, @content, @keywords, @category, @title)
                `);
        }
    }

    // ─── Search Operations ────────────────────────────────

    /**
     * Search knowledge chunks by keywords using SQL LIKE queries.
     * Returns chunks sorted by relevance score.
     */
    static async searchByKeywords(keywords: string[], maxResults: number = 10): Promise<KnowledgeChunk[]> {
        if (keywords.length === 0) return [];

        try {
            // Build dynamic WHERE clause: match any keyword in content or keywords column
            const conditions: string[] = [];
            const request = pool.request();

            keywords.forEach((kw, i) => {
                const paramName = `kw${i}`;
                conditions.push(`(c.content LIKE @${paramName} OR c.keywords LIKE @${paramName} OR c.title LIKE @${paramName})`);
                request.input(paramName, `%${kw}%`);
            });

            // Build relevance scoring: count how many keywords match
            const scoreParts = keywords.map((_, i) => {
                const p = `kw${i}`;
                return `(CASE WHEN c.content LIKE @${p} THEN 2 ELSE 0 END) + (CASE WHEN c.keywords LIKE @${p} THEN 3 ELSE 0 END) + (CASE WHEN c.title LIKE @${p} THEN 4 ELSE 0 END)`;
            });
            const scoreExpr = scoreParts.join(" + ");

            const query = `
                SELECT TOP ${maxResults}
                    c.*,
                    (${scoreExpr}) as relevanceScore
                FROM KnowledgeChunks c
                INNER JOIN KnowledgePages p ON c.pageId = p.id
                WHERE p.isActive = 1
                  AND (${conditions.join(" OR ")})
                ORDER BY relevanceScore DESC, c.chunkIndex ASC
            `;

            const result = await request.query(query);
            return result.recordset;

        } catch (error: any) {
            logger.error(`Knowledge search failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Search by category + keywords for more targeted retrieval
     */
    static async searchByCategory(
        category: string,
        keywords: string[],
        maxResults: number = 5
    ): Promise<KnowledgeChunk[]> {
        try {
            const request = pool.request().input("category", category);

            let whereClause = "p.isActive = 1 AND c.category = @category";

            if (keywords.length > 0) {
                const kwConditions: string[] = [];
                keywords.forEach((kw, i) => {
                    const paramName = `kw${i}`;
                    kwConditions.push(`(c.content LIKE @${paramName} OR c.keywords LIKE @${paramName})`);
                    request.input(paramName, `%${kw}%`);
                });
                whereClause += ` AND (${kwConditions.join(" OR ")})`;
            }

            const result = await request.query(`
                SELECT TOP ${maxResults} c.*
                FROM KnowledgeChunks c
                INNER JOIN KnowledgePages p ON c.pageId = p.id
                WHERE ${whereClause}
                ORDER BY c.chunkIndex ASC
            `);

            return result.recordset;

        } catch (error: any) {
            logger.error(`Category search failed: ${error.message}`);
            return [];
        }
    }

    // ─── Stats & Management ───────────────────────────────

    /**
     * Get knowledge base statistics
     */
    static async getStats(): Promise<{
        totalPages: number;
        activePages: number;
        totalChunks: number;
        categoryBreakdown: Array<{ category: string; count: number }>;
        lastScrapedAt: Date | null;
    }> {
        try {
            const pagesResult = await pool.request().query(`
                SELECT 
                    COUNT(*) as totalPages,
                    SUM(CAST(isActive AS INT)) as activePages
                FROM KnowledgePages
            `);

            const chunksResult = await pool.request().query(
                "SELECT COUNT(*) as totalChunks FROM KnowledgeChunks"
            );

            const categoryResult = await pool.request().query(`
                SELECT category, COUNT(*) as count 
                FROM KnowledgePages 
                WHERE isActive = 1 
                GROUP BY category 
                ORDER BY count DESC
            `);

            const lastScraped = await pool.request().query(
                "SELECT MAX(lastScrapedAt) as lastScrapedAt FROM KnowledgePages"
            );

            return {
                totalPages: pagesResult.recordset[0].totalPages,
                activePages: pagesResult.recordset[0].activePages,
                totalChunks: chunksResult.recordset[0].totalChunks,
                categoryBreakdown: categoryResult.recordset,
                lastScrapedAt: lastScraped.recordset[0].lastScrapedAt,
            };
        } catch (error: any) {
            logger.error(`Failed to get KB stats: ${error.message}`);
            throw error;
        }
    }

    /**
     * Deactivate pages that were not seen in the latest crawl
     */
    static async deactivateStalePages(activeUrls: string[]): Promise<number> {
        if (activeUrls.length === 0) return 0;

        try {
            // Build a table of active URLs for efficient comparison
            // Using a simple approach: deactivate pages not scraped recently
            const result = await pool.request()
                .query(`
                    UPDATE KnowledgePages 
                    SET isActive = 0, updatedAt = GETDATE()
                    WHERE isActive = 1 
                      AND lastScrapedAt < DATEADD(day, -7, GETDATE())
                `);

            const deactivated = result.rowsAffected[0];
            if (deactivated > 0) {
                logger.info(`Deactivated ${deactivated} stale knowledge pages.`);
            }
            return deactivated;
        } catch (error: any) {
            logger.error(`Failed to deactivate stale pages: ${error.message}`);
            return 0;
        }
    }

    // ─── Scraper Run Logging ──────────────────────────────

    /**
     * Create a new scraper run log entry
     */
    static async createScraperRun(runType: "full" | "incremental" | "full_rescrape", baseUrl: string): Promise<string> {
        const result = await pool.request()
            .input("runType", runType)
            .input("status", "running")
            .input("baseUrl", baseUrl)
            .query(`
                INSERT INTO ScraperRuns (runType, status, baseUrl)
                OUTPUT INSERTED.id
                VALUES (@runType, @status, @baseUrl)
            `);
        return result.recordset[0].id;
    }

    /**
     * Update a scraper run with final results
     */
    static async completeScraperRun(
        runId: string,
        status: "completed" | "failed",
        stats: Partial<ScraperRun>
    ): Promise<void> {
        await pool.request()
            .input("id", runId)
            .input("status", status)
            .input("pagesScraped", stats.pagesScraped || 0)
            .input("pagesUpdated", stats.pagesUpdated || 0)
            .input("pagesNew", stats.pagesNew || 0)
            .input("pagesUnchanged", stats.pagesUnchanged || 0)
            .input("errorCount", stats.errorCount || 0)
            .input("errorDetails", stats.errorDetails || null)
            .query(`
                UPDATE ScraperRuns SET
                    status = @status,
                    pagesScraped = @pagesScraped,
                    pagesUpdated = @pagesUpdated,
                    pagesNew = @pagesNew,
                    pagesUnchanged = @pagesUnchanged,
                    errorCount = @errorCount,
                    errorDetails = @errorDetails,
                    completedAt = GETDATE()
                WHERE id = @id
            `);
    }

    /**
     * Get recent scraper runs
     */
    static async getRecentRuns(limit: number = 10): Promise<ScraperRun[]> {
        const result = await pool.request().query(`
            SELECT TOP ${limit} * FROM ScraperRuns ORDER BY startedAt DESC
        `);
        return result.recordset;
    }

    /**
     * Get all active pages (for sync check)
     */
    static async getAllActivePages(): Promise<KnowledgePage[]> {
        const result = await pool.request().query(
            "SELECT * FROM KnowledgePages WHERE isActive = 1 ORDER BY category, title"
        );
        return result.recordset;
    }
}
