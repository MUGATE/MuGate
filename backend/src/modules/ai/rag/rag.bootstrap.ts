import { logger } from "../../../core/logger/logger";
import { ragConfig } from "../../../config/rag.config";
import { VectorRepository } from "../../ai/rag/vector.repository";
import { RagSyncService } from "../../ai/rag/rag-sync.service";
import { LiveSearchService } from "../../ai/rag/live-search.service";
import { ScraperService } from "../../system/scraper/scraper.service";
import { KnowledgeRepository } from "../../system/scraper/knowledge.repository";

/**
 * RAG Bootstrap — runs on backend startup after DB connection.
 */
export async function bootstrapRag(): Promise<void> {
    try {
        await VectorRepository.init();

        const seeded = await LiveSearchService.seedManualKnowledgeIfEmpty();
        if (seeded > 0) {
            logger.info(`RAG bootstrap: seeded ${seeded} manual pages.`);
        }

        const unsynced = await KnowledgeRepository.getUnsyncedCount();
        if (unsynced > 0) {
            RagSyncService.syncUnsyncedChunks(50).catch(err =>
                logger.warn(`Background vector sync on startup: ${err.message}`)
            );
        }

        const chromaCount = await VectorRepository.getCount();
        const sqlChunks = (await KnowledgeRepository.getStats()).totalChunks;
        if (chromaCount === 0 && sqlChunks > 0) {
            logger.info("RAG bootstrap: SQL has chunks but vector store is empty — starting reindex.");
            RagSyncService.reindexAll().catch(err =>
                logger.warn(`Background reindex on startup: ${err.message}`)
            );
        }

        if (ragConfig.autoInitialCrawl) {
            const pageCount = await KnowledgeRepository.getPageCount();
            if (pageCount < 10 && !ScraperService.running) {
                logger.info("RAG bootstrap: AUTO_INITIAL_CRAWL enabled — starting background full crawl.");
                ScraperService.scrapeUniversityWebsite().catch(err =>
                    logger.error(`Auto initial crawl failed: ${err.message}`)
                );
            }
        }

        logger.info("RAG bootstrap complete.");
    } catch (err: any) {
        logger.error(`RAG bootstrap failed: ${err.message}`);
    }
}
