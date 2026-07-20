import { pool } from "../../../core/database/connection";
import { logger } from "../../../core/logger/logger";
import { ContentCleaner } from "./content.cleaner";
import { ragConfig } from "../../../config/rag.config";
import {
    ScrapedPage,
    KnowledgePage,
    KnowledgeChunk,
    ScraperRun,
} from "./scraper.types";

function extractSourceDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return "www.mu.edu.lb";
    }
}

function detectEntityType(url: string, title: string, content: string): string | null {
    const combined = `${url} ${title} ${content.substring(0, 300)}`.toLowerCase();
    if (/\/(staff|people|instructors?|faculty|professors?)/i.test(url) || /\bdr\.|professor|instructor|lecturer\b/i.test(combined)) {
        return "instructor";
    }
    if (/\/(course|curriculum|syllabus)/i.test(url) || /\bcourse code\b/i.test(combined)) {
        return "course";
    }
    if (/\/(facult|department|college)/i.test(url)) {
        return "faculty";
    }
    return null;
}

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
    /**
     * Upsert a scraped page. Returns status and pageId for vector sync.
     */
    static async upsertPage(page: ScrapedPage): Promise<{ status: "new" | "updated" | "unchanged"; pageId: string }> {
        try {
            const existing = await pool.request()
                .input("url", page.url)
                .query("SELECT id, contentHash FROM KnowledgePages WHERE url = @url");

            if (existing.recordset.length === 0) {
                const insertResult = await pool.request()
                    .input("url", page.url)
                    .input("title", page.title)
                    .input("content", page.cleanContent)
                    .input("contentHash", page.contentHash)
                    .input("category", page.category)
                    .input("subcategory", page.subcategory || null)
                    .input("language", page.language)
                    .input("wordCount", page.wordCount)
                    .input("sourceDomain", extractSourceDomain(page.url))
                    .query(`
                        INSERT INTO KnowledgePages (url, title, content, contentHash, category, subcategory, language, wordCount, sourceDomain, lastScrapedAt)
                        VALUES (@url, @title, @content, @contentHash, @category, @subcategory, @language, @wordCount, @sourceDomain, GETDATE())
                        RETURNING id
                    `);

                const pageId = insertResult.recordset[0].id;

                // Create chunks for the new page
                await this.createChunksForPage(pageId, page);

                logger.info(`New page stored: ${page.url}`);
                return { status: "new", pageId };
            }

            const existingPage = existing.recordset[0];

            if (existingPage.contentHash === page.contentHash) {
                await pool.request()
                    .input("url", page.url)
                    .query("UPDATE KnowledgePages SET lastScrapedAt = GETDATE(), isActive = 1 WHERE url = @url");
                return { status: "unchanged", pageId: existingPage.id };
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
            return { status: "updated", pageId: existingPage.id };

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
        const entityType = detectEntityType(page.url, page.title, page.cleanContent);

        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const chunkKeywords = ContentCleaner.extractKeywords(chunkContent);
            const allKeywords = [...new Set([...chunkKeywords, ...pageKeywords.slice(0, 10)])];

            await pool.request()
                .input("pageId", pageId)
                .input("chunkIndex", i)
                .input("content", chunkContent)
                .input("keywords", allKeywords.join(","))
                .input("category", page.category)
                .input("title", page.title)
                .input("entityType", entityType)
                .query(`
                    INSERT INTO KnowledgeChunks (pageId, chunkIndex, content, keywords, category, title, entityType)
                    VALUES (@pageId, @chunkIndex, @content, @keywords, @category, @title, @entityType)
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
                SELECT
                    c.*,
                    (${scoreExpr}) as relevanceScore
                FROM KnowledgeChunks c
                INNER JOIN KnowledgePages p ON c.pageId = p.id
                WHERE p.isActive = 1
                  AND (${conditions.join(" OR ")})
                ORDER BY relevanceScore DESC, c.chunkIndex ASC
                LIMIT ${maxResults}
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
                SELECT c.*
                FROM KnowledgeChunks c
                INNER JOIN KnowledgePages p ON c.pageId = p.id
                WHERE ${whereClause}
                ORDER BY c.chunkIndex ASC
                LIMIT ${maxResults}
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
                    COALESCE(SUM(CAST(isActive AS INT)), 0) as activePages
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
                totalPages: Number(pagesResult.recordset[0].totalPages) || 0,
                activePages: Number(pagesResult.recordset[0].activePages) || 0,
                totalChunks: Number(chunksResult.recordset[0].totalChunks) || 0,
                categoryBreakdown: categoryResult.recordset || [],
                lastScrapedAt: lastScraped.recordset[0].lastScrapedAt || null,
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
            const normalized = activeUrls.map(u => u.replace(/\/$/, ""));
            let deactivated = 0;

            const allActive = await pool.request().query(
                "SELECT id, url FROM KnowledgePages WHERE isActive = 1"
            );

            for (const row of allActive.recordset) {
                const url = String(row.url).replace(/\/$/, "");
                if (!normalized.includes(url)) {
                    await pool.request()
                        .input("id", row.id)
                        .query("UPDATE KnowledgePages SET isActive = 0, updatedAt = GETDATE() WHERE id = @id");
                    deactivated++;
                }
            }

            if (deactivated > 0) {
                logger.info(`Deactivated ${deactivated} pages not seen in latest crawl.`);
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
    static async createScraperRun(runType: "full" | "incremental" | "full_rescrape" | "sitemap", baseUrl: string): Promise<string> {
        const result = await pool.request()
            .input("runType", runType)
            .input("status", "running")
            .input("baseUrl", baseUrl)
            .query(`
                INSERT INTO ScraperRuns (runType, status, baseUrl)
                VALUES (@runType, @status, @baseUrl)
                RETURNING id
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
            SELECT * FROM ScraperRuns ORDER BY startedAt DESC
            LIMIT ${limit}
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

    static async getPageById(pageId: string): Promise<KnowledgePage | null> {
        const result = await pool.request()
            .input("id", pageId)
            .query("SELECT * FROM KnowledgePages WHERE id = @id");
        return result.recordset[0] || null;
    }

    static async getChunksByPageId(pageId: string): Promise<KnowledgeChunk[]> {
        const result = await pool.request()
            .input("pageId", pageId)
            .query("SELECT * FROM KnowledgeChunks WHERE pageId = @pageId ORDER BY chunkIndex");
        return result.recordset;
    }

    static async getUnsyncedChunks(limit: number = 50): Promise<KnowledgeChunk[]> {
        const result = await pool.request().query(`
            SELECT c.*
            FROM KnowledgeChunks c
            INNER JOIN KnowledgePages p ON c.pageId = p.id
            WHERE p.isActive = 1 AND c.chromaSyncedAt IS NULL
            ORDER BY c.createdAt ASC
            LIMIT ${limit}
        `);
        return result.recordset;
    }

    static async getUnsyncedCount(): Promise<number> {
        const result = await pool.request().query(`
            SELECT COUNT(*) as cnt
            FROM KnowledgeChunks c
            INNER JOIN KnowledgePages p ON c.pageId = p.id
            WHERE p.isActive = 1 AND c.chromaSyncedAt IS NULL
        `);
        return result.recordset[0]?.cnt || 0;
    }

    static async markChunksSynced(chunkIds: string[], model: string): Promise<void> {
        if (chunkIds.length === 0) return;
        for (const id of chunkIds) {
            await pool.request()
                .input("id", id)
                .input("model", model)
                .query(`
                    UPDATE KnowledgeChunks
                    SET chromaSyncedAt = GETDATE(), embeddingModel = @model
                    WHERE id = @id
                `);
        }
    }

    static async getPageUrlIndex(): Promise<Array<{ url: string; title: string }>> {
        const result = await pool.request().query(
            "SELECT url, title FROM KnowledgePages WHERE isActive = 1"
        );
        return result.recordset;
    }

    static async getPageCount(): Promise<number> {
        const result = await pool.request().query("SELECT COUNT(*) as cnt FROM KnowledgePages");
        return result.recordset[0]?.cnt || 0;
    }

    static async enqueueUrls(urls: string[], runId?: string, priority: number = 0): Promise<number> {
        let added = 0;
        for (const url of urls) {
            try {
                await pool.request()
                    .input("url", url)
                    .input("priority", priority)
                    .input("runId", runId || null)
                    .query(`
                        INSERT INTO ScrapeQueue (url, priority, runId, status)
                        SELECT @url, @priority, @runId, 'pending'
                        WHERE NOT EXISTS (
                            SELECT 1 FROM ScrapeQueue WHERE url = @url AND status = 'pending'
                        )
                    `);
                added++;
            } catch { /* skip duplicate */ }
        }
        return added;
    }

    static async getPendingQueueUrls(limit: number = 500): Promise<string[]> {
        const result = await pool.request().query(`
            SELECT url FROM ScrapeQueue
            WHERE status = 'pending'
            ORDER BY priority DESC, createdAt ASC
            LIMIT ${limit}
        `);
        return result.recordset.map((r: { url: string }) => r.url);
    }

    static async markQueueUrlsDone(urls: string[]): Promise<void> {
        for (const url of urls) {
            await pool.request()
                .input("url", url)
                .query("UPDATE ScrapeQueue SET status = 'done', updatedAt = GETDATE() WHERE url = @url");
        }
    }
}
