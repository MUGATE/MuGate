import { pool } from "../../../core/database/connection";
import { logger } from "../../../core/logger/logger";
import { ragConfig } from "../../../config/rag.config";
import { KnowledgeRepository } from "../../system/scraper/knowledge.repository";
import { EmbeddingService } from "./embedding.service";
import { VectorRepository, VectorChunkMetadata } from "./vector.repository";

/**
 * RAG Sync Service — dual-write orchestrator: SQL chunks → embeddings → Chroma/local vector store.
 */
export class RagSyncService {

    static async syncChunksForPage(pageId: string): Promise<number> {
        try {
            const chunks = await KnowledgeRepository.getChunksByPageId(pageId);
            const page = await KnowledgeRepository.getPageById(pageId);
            if (!page || chunks.length === 0) return 0;

            const ids: string[] = [];
            const documents: string[] = [];
            const metadatas: VectorChunkMetadata[] = [];

            for (const chunk of chunks) {
                ids.push(chunk.id);
                documents.push(chunk.content);
                metadatas.push({
                    pageId: chunk.pageId,
                    url: page.url,
                    title: chunk.title || page.title,
                    category: chunk.category,
                    keywords: chunk.keywords || "",
                    sourceDomain: page.sourceDomain || "www.mu.edu.lb",
                    entityType: chunk.entityType || undefined,
                });
            }

            const embeddings = await EmbeddingService.embedBatch(documents);
            await VectorRepository.upsertChunks(ids, embeddings, documents, metadatas);
            await KnowledgeRepository.markChunksSynced(ids, ragConfig.embeddingModel);

            logger.info(`Synced ${ids.length} chunks to vector store for page ${page.url}`);
            return ids.length;
        } catch (err: any) {
            logger.error(`RagSync failed for page ${pageId}: ${err.message}`);
            return 0;
        }
    }

    static async syncUnsyncedChunks(batchSize: number = 50): Promise<number> {
        let totalSynced = 0;
        let batch = await KnowledgeRepository.getUnsyncedChunks(batchSize);

        while (batch.length > 0) {
            const byPage = new Map<string, typeof batch>();
            for (const chunk of batch) {
                const list = byPage.get(chunk.pageId) || [];
                list.push(chunk);
                byPage.set(chunk.pageId, list);
            }

            for (const pageId of byPage.keys()) {
                totalSynced += await this.syncChunksForPage(pageId);
            }

            batch = await KnowledgeRepository.getUnsyncedChunks(batchSize);
        }

        if (totalSynced > 0) {
            logger.info(`RagSync: synced ${totalSynced} unsynced chunks to vector store.`);
        }
        return totalSynced;
    }

    static async reindexAll(): Promise<{ synced: number; chromaCount: number }> {
        await pool.request().query(
            "UPDATE KnowledgeChunks SET chromaSyncedAt = NULL, embeddingModel = NULL"
        );

        const synced = await this.syncUnsyncedChunks(100);
        const chromaCount = await VectorRepository.getCount();
        return { synced, chromaCount };
    }

    static async clearVectorStore(): Promise<void> {
        await VectorRepository.clearCollection();
    }

    static async getSyncStats(): Promise<{
        sqlChunks: number;
        chromaChunks: number;
        unsyncedChunks: number;
    }> {
        const stats = await KnowledgeRepository.getStats();
        const unsynced = await KnowledgeRepository.getUnsyncedCount();
        const chromaChunks = await VectorRepository.getCount();
        return {
            sqlChunks: stats.totalChunks,
            chromaChunks,
            unsyncedChunks: unsynced,
        };
    }
}
