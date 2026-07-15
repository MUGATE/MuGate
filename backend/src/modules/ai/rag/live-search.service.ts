import { logger } from "../../../core/logger/logger";
import { ragConfig } from "../../../config/rag.config";
import { UniversityScraper } from "../../system/scraper/university.scraper";
import { KnowledgeRepository } from "../../system/scraper/knowledge.repository";
import { SitemapDiscovery } from "../../system/scraper/sitemap.discovery";
import { KnowledgeService } from "../chatbot/services/knowledge.service";
import { RagSyncService } from "./rag-sync.service";
import { ContentCleaner } from "../../system/scraper/content.cleaner";
import { samplePages } from "../../system/scraper/manual_knowledge";

export interface LiveSearchResult {
    context: string;
    sourcesFound: number;
    categories: string[];
    freshlyScraped: boolean;
}

/**
 * Live Search Service — targeted on-demand scrape when KB confidence is low.
 */
export class LiveSearchService {

    static async searchAndIngest(question: string): Promise<LiveSearchResult> {
        const keywords = KnowledgeService.extractSearchTerms(question);
        if (keywords.length === 0) {
            return { context: "", sourcesFound: 0, categories: [], freshlyScraped: false };
        }

        const candidateUrls = await this.findCandidateUrls(keywords);
        const maxPages = ragConfig.liveScrapeMaxPages;
        const urlsToScrape = candidateUrls.slice(0, maxPages);

        if (urlsToScrape.length === 0) {
            return { context: "", sourcesFound: 0, categories: [], freshlyScraped: false };
        }

        logger.info(`Live search: scraping ${urlsToScrape.length} candidate URLs for [${keywords.join(", ")}]`);

        const timeoutPerPage = Math.floor(ragConfig.liveScrapeTimeoutMs / urlsToScrape.length);
        const scrapePromises = urlsToScrape.map(url =>
            Promise.race([
                UniversityScraper.fetchPage(url, timeoutPerPage),
                new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutPerPage)),
            ])
        );

        const scraped = (await Promise.all(scrapePromises)).filter(Boolean);
        const sections: string[] = [];
        const categories = new Set<string>();

        for (const page of scraped) {
            if (!page) continue;

            try {
                const { status, pageId } = await KnowledgeRepository.upsertPage(page);
                if (status === "new" || status === "updated") {
                    RagSyncService.syncChunksForPage(pageId).catch(err =>
                        logger.warn(`Background vector sync failed: ${err.message}`)
                    );
                }
                categories.add(page.category);
                sections.push(`[${page.category.toUpperCase()} — ${page.title}]\n${page.cleanContent.substring(0, 2000)}`);
            } catch (err: any) {
                logger.warn(`Live search ingest failed for ${page.url}: ${err.message}`);
                sections.push(`[${page.category.toUpperCase()} — ${page.title}]\n${page.cleanContent.substring(0, 2000)}`);
            }
        }

        return {
            context: sections.join("\n\n---\n\n"),
            sourcesFound: sections.length,
            categories: [...categories],
            freshlyScraped: sections.length > 0,
        };
    }

    private static async findCandidateUrls(keywords: string[]): Promise<string[]> {
        const base = ragConfig.universityWebsiteUrl.replace(/\/$/, "");
        const candidates = new Set<string>();

        const sitemapUrls = await SitemapDiscovery.discoverUrls(base);
        const scoredSitemap = SitemapDiscovery.scoreUrlsByKeywords(sitemapUrls, keywords);
        scoredSitemap.slice(0, 15).forEach(r => candidates.add(r.url));

        const dbIndex = await KnowledgeRepository.getPageUrlIndex();
        for (const row of dbIndex) {
            const haystack = `${row.url} ${row.title}`.toLowerCase();
            if (keywords.some(kw => haystack.includes(kw.toLowerCase()))) {
                candidates.add(row.url);
            }
        }

        for (const kw of keywords.slice(0, 3)) {
            candidates.add(`${base}/?s=${encodeURIComponent(kw)}`);
            candidates.add(`${base}/search?q=${encodeURIComponent(kw)}`);
        }

        return [...candidates].filter(url => {
            try {
                const host = new URL(url).hostname.replace(/^www\./, "");
                return host === "mu.edu.lb" || host.endsWith(".mu.edu.lb");
            } catch {
                return false;
            }
        });
    }

    static async seedManualKnowledgeIfEmpty(): Promise<number> {
        const count = await KnowledgeRepository.getPageCount();
        if (count > 0) return 0;

        logger.info("Seeding knowledge base from manual_knowledge.ts...");
        let seeded = 0;

        for (const sample of samplePages) {
            const cleanContent = sample.cleanContent;
            const page = {
                ...sample,
                contentHash: ContentCleaner.computeHash(cleanContent),
                wordCount: cleanContent.split(/\s+/).length,
            };
            const { pageId } = await KnowledgeRepository.upsertPage(page);
            await RagSyncService.syncChunksForPage(pageId);
            seeded++;
        }

        logger.info(`Seeded ${seeded} manual knowledge pages.`);
        return seeded;
    }
}
