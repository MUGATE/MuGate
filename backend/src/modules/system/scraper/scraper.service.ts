import { logger } from "../../../core/logger/logger";
import { UniversityScraper } from "./university.scraper";
import { KnowledgeRepository } from "./knowledge.repository";
import { ScraperConfig } from "./scraper.types";
import { pool } from "../../../core/database/connection";
import { ragConfig } from "../../../config/rag.config";
import { SitemapDiscovery } from "./sitemap.discovery";
import { RagSyncService } from "../../ai/rag/rag-sync.service";

/**
 * Scraper Service — Orchestrates university website scraping,
 * content processing, and knowledge base population.
 */
export class ScraperService {

    private static isRunning = false;

    private static defaultConfig(overrides?: Partial<ScraperConfig>): Partial<ScraperConfig> {
        return {
            baseUrl: ragConfig.universityWebsiteUrl,
            maxPages: ragConfig.scraperMaxPages,
            maxDepth: ragConfig.scraperMaxDepth,
            delayMs: ragConfig.scraperDelayMs,
            ...overrides,
        };
    }

    private static async storePages(pages: Awaited<ReturnType<UniversityScraper["crawl"]>>["pages"]) {
        const stats = { pagesNew: 0, pagesUpdated: 0, pagesUnchanged: 0, errors: 0 };

        for (const page of pages) {
            try {
                const { status, pageId } = await KnowledgeRepository.upsertPage(page);
                if (status === "new") stats.pagesNew++;
                else if (status === "updated") stats.pagesUpdated++;
                else stats.pagesUnchanged++;

                if (status === "new" || status === "updated") {
                    await RagSyncService.syncChunksForPage(pageId);
                }
            } catch (error: any) {
                logger.error(`Failed to store page ${page.url}: ${error.message}`);
                stats.errors++;
            }
        }

        return stats;
    }

    static async scrapePortal(credentials: { username: string; password: string }) {
        logger.info("Starting portal scrape...");
        return { message: "Scraper service placeholder" };
    }

    static async scrapeUniversityWebsite(config?: Partial<ScraperConfig>): Promise<{
        success: boolean;
        runId: string;
        stats: { pagesScraped: number; pagesNew: number; pagesUpdated: number; pagesUnchanged: number; errors: number };
    }> {
        if (this.isRunning) {
            throw new Error("A scraping job is already running. Please wait for it to complete.");
        }

        this.isRunning = true;
        const mergedConfig = this.defaultConfig(config);
        const baseUrl = mergedConfig.baseUrl!;
        const runId = await KnowledgeRepository.createScraperRun("full", baseUrl);
        const stats = { pagesScraped: 0, pagesNew: 0, pagesUpdated: 0, pagesUnchanged: 0, errors: 0 };

        try {
            logger.info(`Starting full university scrape: ${baseUrl} (run: ${runId})`);

            const sitemapUrls = await SitemapDiscovery.discoverUrls(baseUrl);
            await KnowledgeRepository.enqueueUrls(sitemapUrls, runId, 1);

            const scraper = new UniversityScraper({
                ...mergedConfig,
                seedUrls: sitemapUrls.slice(0, 500),
            });
            const { pages, errors } = await scraper.crawl();

            stats.pagesScraped = pages.length;
            stats.errors = errors.length;

            const storeStats = await this.storePages(pages);
            Object.assign(stats, storeStats);

            const activeUrls = pages.map(p => p.url);
            await KnowledgeRepository.deactivateStalePages(activeUrls);
            await KnowledgeRepository.markQueueUrlsDone(activeUrls);

            await KnowledgeRepository.completeScraperRun(runId, "completed", {
                pagesScraped: stats.pagesScraped,
                pagesNew: stats.pagesNew,
                pagesUpdated: stats.pagesUpdated,
                pagesUnchanged: stats.pagesUnchanged,
                errorCount: stats.errors,
                errorDetails: errors.length > 0 ? errors.slice(0, 20).join("\n") : undefined,
            });

            logger.info(`Scrape complete: ${JSON.stringify(stats)}`);
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
            const baseUrl = ragConfig.universityWebsiteUrl;
            const runId = await KnowledgeRepository.createScraperRun("incremental", baseUrl);

            const existingPages = await KnowledgeRepository.getAllActivePages();
            const stalePages = existingPages.filter(p => {
                const ageMs = Date.now() - new Date(p.lastScrapedAt).getTime();
                return ageMs / (1000 * 60 * 60) > maxAgeHours;
            });

            const staleUrls = stalePages.map(p => p.url);
            logger.info(`Incremental sync: re-fetching ${staleUrls.length} stale pages`);

            let pages: Awaited<ReturnType<UniversityScraper["crawlUrls"]>>["pages"] = [];
            let errors: string[] = [];

            if (staleUrls.length > 0) {
                const scraper = new UniversityScraper({ baseUrl, maxPages: staleUrls.length, delayMs: 1500 });
                ({ pages, errors } = await scraper.crawlUrls(staleUrls));
            } else {
                const sitemapUrls = await SitemapDiscovery.discoverUrls(baseUrl);
                const newUrls = sitemapUrls.slice(0, 50);
                const scraper = new UniversityScraper({ baseUrl, maxPages: 50, maxDepth: 2, delayMs: 1500, seedUrls: newUrls });
                ({ pages, errors } = await scraper.crawl());
            }

            pagesChecked = pages.length;

            for (const page of pages) {
                try {
                    const { status, pageId } = await KnowledgeRepository.upsertPage(page);
                    if (status === "updated" || status === "new") {
                        pagesUpdated++;
                        await RagSyncService.syncChunksForPage(pageId);
                    }
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

    static async refreshSitemap(): Promise<number> {
        const baseUrl = ragConfig.universityWebsiteUrl;
        SitemapDiscovery.clearCache();
        const urls = await SitemapDiscovery.discoverUrls(baseUrl);
        const added = await KnowledgeRepository.enqueueUrls(urls, undefined, 2);
        logger.info(`Sitemap refresh: queued ${added} URLs`);
        return added;
    }

    static async getKnowledgeBaseStats() {
        const sqlStats = await KnowledgeRepository.getStats();
        const vectorStats = await RagSyncService.getSyncStats();
        return { ...sqlStats, ...vectorStats };
    }

    static async getScraperRunHistory(limit: number = 10) {
        return KnowledgeRepository.getRecentRuns(limit);
    }

    static get running(): boolean {
        return this.isRunning;
    }

    static async fullRescrape(config?: Partial<ScraperConfig>): Promise<{
        success: boolean;
        runId: string;
        stats: { pagesScraped: number; pagesNew: number; errors: number };
    }> {
        if (this.isRunning) {
            throw new Error("A scraping job is already running.");
        }

        this.isRunning = true;
        const mergedConfig = this.defaultConfig(config);
        const baseUrl = mergedConfig.baseUrl!;
        const runId = await KnowledgeRepository.createScraperRun("full_rescrape", baseUrl);

        try {
            logger.info("Full re-scrape: Clearing existing knowledge base...");

            await RagSyncService.clearVectorStore();
            await pool.request().query("DELETE FROM KnowledgeChunks");
            await pool.request().query("DELETE FROM KnowledgePages");
            await pool.request().query("DELETE FROM ScrapeQueue");

            const sitemapUrls = await SitemapDiscovery.discoverUrls(baseUrl);
            const scraper = new UniversityScraper({
                ...mergedConfig,
                seedUrls: sitemapUrls.slice(0, 1000),
            });
            const { pages, errors } = await scraper.crawl();

            let pagesNew = 0;
            for (const page of pages) {
                try {
                    const { pageId } = await KnowledgeRepository.upsertPage(page);
                    await RagSyncService.syncChunksForPage(pageId);
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

            logger.info(`Full re-scrape complete: ${pagesNew} pages`);
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

    static async reindexVectors(): Promise<{ synced: number; chromaCount: number }> {
        return RagSyncService.reindexAll();
    }
}
