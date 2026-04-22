import { logger } from "../../../core/logger/logger";
import { UniversityScraper } from "./university.scraper";
import { KnowledgeRepository } from "./knowledge.repository";
import { ScraperConfig } from "./scraper.types";
import { pool } from "../../../core/database/connection";

/**
 * Scraper Service — Orchestrates university website scraping,
 * content processing, and knowledge base population.
 */
export class ScraperService {

    /** Flag to prevent concurrent scraping runs */
    private static isRunning = false;

    /**
     * Portal scraping placeholder
     */
    static async scrapePortal(credentials: { username: string; password: string }) {
        logger.info("Starting portal scrape...");
        return { message: "Scraper service placeholder" };
    }

    /**
     * Full university website scrape: crawl all pages, clean, store in knowledge base.
     * This is a long-running operation.
     */
    static async scrapeUniversityWebsite(config?: Partial<ScraperConfig>): Promise<{
        success: boolean;
        runId: string;
        stats: { pagesScraped: number; pagesNew: number; pagesUpdated: number; pagesUnchanged: number; errors: number };
    }> {
        if (this.isRunning) {
            throw new Error("A scraping job is already running. Please wait for it to complete.");
        }

        this.isRunning = true;
        const baseUrl = config?.baseUrl || process.env.UNIVERSITY_WEBSITE_URL || "https://mu.edu.lb";
        const runId = await KnowledgeRepository.createScraperRun("full", baseUrl);

        const stats = { pagesScraped: 0, pagesNew: 0, pagesUpdated: 0, pagesUnchanged: 0, errors: 0 };

        try {
            logger.info(`Starting full university scrape: ${baseUrl} (run: ${runId})`);

            // 1. Crawl the website
            const scraper = new UniversityScraper(config);
            const { pages, errors } = await scraper.crawl();

            stats.pagesScraped = pages.length;
            stats.errors = errors.length;

            // 2. Process and store each page
            for (const page of pages) {
                try {
                    const result = await KnowledgeRepository.upsertPage(page);
                    if (result === "new") stats.pagesNew++;
                    else if (result === "updated") stats.pagesUpdated++;
                    else stats.pagesUnchanged++;
                } catch (error: any) {
                    logger.error(`Failed to store page ${page.url}: ${error.message}`);
                    stats.errors++;
                }
            }

            // 3. Deactivate stale pages not seen in this crawl
            const activeUrls = pages.map(p => p.url);
            await KnowledgeRepository.deactivateStalePages(activeUrls);

            // 4. Complete the run log
            await KnowledgeRepository.completeScraperRun(runId, "completed", {
                pagesScraped: stats.pagesScraped,
                pagesNew: stats.pagesNew,
                pagesUpdated: stats.pagesUpdated,
                pagesUnchanged: stats.pagesUnchanged,
                errorCount: stats.errors,
                errorDetails: errors.length > 0 ? errors.slice(0, 20).join("\n") : undefined,
            });

            logger.info(`Scrape complete: ${stats.pagesScraped} scraped, ${stats.pagesNew} new, ${stats.pagesUpdated} updated, ${stats.pagesUnchanged} unchanged, ${stats.errors} errors`);

            return { success: true, runId, stats };

        } catch (error: any) {
            await KnowledgeRepository.completeScraperRun(runId, "failed", {
                pagesScraped: stats.pagesScraped,
                errorCount: stats.errors + 1,
                errorDetails: error.message,
            });
            logger.error(`University scrape failed: ${error.message}`);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Incremental sync: only check pages that haven't been scraped recently.
     * Faster than a full crawl — only re-fetches pages older than the threshold.
     */
    static async incrementalSync(maxAgeHours: number = 24): Promise<{
        success: boolean;
        pagesChecked: number;
        pagesUpdated: number;
    }> {
        if (this.isRunning) {
            throw new Error("A scraping job is already running.");
        }

        this.isRunning = true;
        let pagesChecked = 0;
        let pagesUpdated = 0;

        try {
            const baseUrl = process.env.UNIVERSITY_WEBSITE_URL || "https://mu.edu.lb";
            const runId = await KnowledgeRepository.createScraperRun("incremental", baseUrl);

            // Get pages that haven't been scraped recently
            const existingPages = await KnowledgeRepository.getAllActivePages();
            const stalePages = existingPages.filter(p => {
                const ageMs = Date.now() - new Date(p.lastScrapedAt).getTime();
                const ageHours = ageMs / (1000 * 60 * 60);
                return ageHours > maxAgeHours;
            });

            logger.info(`Incremental sync: ${stalePages.length} stale pages to re-check (out of ${existingPages.length} total)`);

            // Re-scrape stale pages using a focused scraper
            const scraper = new UniversityScraper({
                baseUrl,
                maxPages: stalePages.length + 50, // Allow some new page discovery
                maxDepth: 2,
                delayMs: 2000,
            });

            const { pages, errors } = await scraper.crawl();
            pagesChecked = pages.length;

            for (const page of pages) {
                try {
                    const result = await KnowledgeRepository.upsertPage(page);
                    if (result === "updated" || result === "new") pagesUpdated++;
                } catch (error: any) {
                    logger.error(`Incremental sync error for ${page.url}: ${error.message}`);
                }
            }

            await KnowledgeRepository.completeScraperRun(runId, "completed", {
                pagesScraped: pagesChecked,
                pagesUpdated,
                pagesNew: 0,
                pagesUnchanged: pagesChecked - pagesUpdated,
                errorCount: errors.length,
            });

            logger.info(`Incremental sync done: ${pagesChecked} checked, ${pagesUpdated} updated`);
            return { success: true, pagesChecked, pagesUpdated };

        } catch (error: any) {
            logger.error(`Incremental sync failed: ${error.message}`);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Get knowledge base stats for admin dashboard
     */
    static async getKnowledgeBaseStats() {
        return KnowledgeRepository.getStats();
    }

    /**
     * Get recent scraper run history
     */
    static async getScraperRunHistory(limit: number = 10) {
        return KnowledgeRepository.getRecentRuns(limit);
    }

    /**
     * Check if a scraping job is currently running
     */
    static get running(): boolean {
        return this.isRunning;
    }

    /**
     * Full re-scrape: Clear all existing knowledge base data and do a fresh crawl.
     * Use this when the existing data is stale or corrupted.
     */
    static async fullRescrape(config?: Partial<ScraperConfig>): Promise<{
        success: boolean;
        runId: string;
        stats: { pagesScraped: number; pagesNew: number; errors: number };
    }> {
        if (this.isRunning) {
            throw new Error("A scraping job is already running.");
        }

        this.isRunning = true;
        const baseUrl = config?.baseUrl || process.env.UNIVERSITY_WEBSITE_URL || "https://mu.edu.lb";
        const runId = await KnowledgeRepository.createScraperRun("full_rescrape", baseUrl);

        try {
            logger.info(`Full re-scrape: Clearing existing knowledge base...`);

            // Clear all existing data
            await pool.request().query("DELETE FROM KnowledgeChunks");
            await pool.request().query("DELETE FROM KnowledgePages");
            logger.info("Knowledge base cleared. Starting fresh crawl...");

            // Crawl
            const scraper = new UniversityScraper({
                maxPages: 500,
                maxDepth: 5,
                delayMs: 2000,
                ...config,
                baseUrl,
            });
            const { pages, errors } = await scraper.crawl();

            let pagesNew = 0;
            for (const page of pages) {
                try {
                    await KnowledgeRepository.upsertPage(page);
                    pagesNew++;
                } catch (error: any) {
                    logger.error(`Failed to store page ${page.url}: ${error.message}`);
                }
            }

            await KnowledgeRepository.completeScraperRun(runId, "completed", {
                pagesScraped: pages.length,
                pagesNew,
                pagesUpdated: 0,
                pagesUnchanged: 0,
                errorCount: errors.length,
                errorDetails: errors.length > 0 ? errors.slice(0, 20).join("\n") : undefined,
            });

            logger.info(`Full re-scrape complete: ${pagesNew} pages scraped and stored, ${errors.length} errors`);
            return { success: true, runId, stats: { pagesScraped: pages.length, pagesNew, errors: errors.length } };

        } catch (error: any) {
            await KnowledgeRepository.completeScraperRun(runId, "failed", {
                pagesScraped: 0,
                errorCount: 1,
                errorDetails: error.message,
            });
            logger.error(`Full re-scrape failed: ${error.message}`);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }
}
