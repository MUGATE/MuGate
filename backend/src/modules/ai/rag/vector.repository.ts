import fs from "fs";
import path from "path";
import { ChromaClient, Collection } from "chromadb";
import { logger } from "../../../core/logger/logger";
import { ragConfig } from "../../../config/rag.config";

const COLLECTION_NAME = "mugate_knowledge_chunks";

export interface VectorChunkMetadata {
    pageId: string;
    url: string;
    title: string;
    category: string;
    keywords: string;
    sourceDomain: string;
    entityType?: string;
}

export interface VectorSearchResult {
    id: string;
    content: string;
    score: number;
    metadata: VectorChunkMetadata;
}

interface LocalVectorEntry {
    id: string;
    embedding: number[];
    document: string;
    metadata: VectorChunkMetadata;
}

/** File-backed fallback when Chroma server is unavailable */
class LocalVectorStore {
    private filePath: string;
    private entries: LocalVectorEntry[] = [];

    constructor(basePath: string) {
        this.filePath = path.join(basePath, "vectors.json");
        this.load();
    }

    private load(): void {
        try {
            if (fs.existsSync(this.filePath)) {
                this.entries = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
            }
        } catch {
            this.entries = [];
        }
    }

    private save(): void {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, JSON.stringify(this.entries));
    }

    upsert(ids: string[], embeddings: number[][], documents: string[], metadatas: VectorChunkMetadata[]): void {
        for (let i = 0; i < ids.length; i++) {
            const idx = this.entries.findIndex(e => e.id === ids[i]);
            const entry: LocalVectorEntry = {
                id: ids[i],
                embedding: embeddings[i],
                document: documents[i],
                metadata: metadatas[i],
            };
            if (idx >= 0) this.entries[idx] = entry;
            else this.entries.push(entry);
        }
        this.save();
    }

    delete(ids: string[]): void {
        const idSet = new Set(ids);
        this.entries = this.entries.filter(e => !idSet.has(e.id));
        this.save();
    }

    clear(): void {
        this.entries = [];
        this.save();
    }

    count(): number {
        return this.entries.length;
    }

    query(embedding: number[], topK: number): VectorSearchResult[] {
        const scored = this.entries.map(entry => ({
            id: entry.id,
            content: entry.document,
            score: cosineSimilarity(embedding, entry.embedding),
            metadata: entry.metadata,
        }));
        return scored.sort((a, b) => b.score - a.score).slice(0, topK);
    }
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * Vector Repository — Chroma client with local file fallback.
 */
export class VectorRepository {
    private static client: ChromaClient | null = null;
    private static collection: Collection | null = null;
    private static localStore: LocalVectorStore | null = null;
    private static useLocal = false;
    private static initialized = false;

    static async init(): Promise<void> {
        if (this.initialized) return;

        fs.mkdirSync(ragConfig.chromaPath, { recursive: true });
        this.localStore = new LocalVectorStore(ragConfig.chromaPath);

        if (ragConfig.chromaUrl) {
            try {
                const url = new URL(ragConfig.chromaUrl);
                this.client = new ChromaClient({
                    host: url.hostname,
                    port: url.port ? parseInt(url.port, 10) : (url.protocol === "https:" ? 443 : 80),
                    ssl: url.protocol === "https:",
                });
                this.collection = await this.client.getOrCreateCollection({
                    name: COLLECTION_NAME,
                    metadata: { description: "MuGate university knowledge chunks" },
                });
                this.useLocal = false;
                logger.info(`Chroma connected at ${ragConfig.chromaUrl}`);
            } catch (err: any) {
                logger.warn(`Chroma server unavailable, using local vector store: ${err.message}`);
                this.useLocal = true;
            }
        } else {
            this.useLocal = true;
            logger.info("Using local file-backed vector store (set CHROMA_URL for Chroma server).");
        }

        this.initialized = true;
    }

    static async upsertChunks(
        ids: string[],
        embeddings: number[][],
        documents: string[],
        metadatas: VectorChunkMetadata[]
    ): Promise<void> {
        await this.init();
        if (ids.length === 0) return;

        const stringMetas = metadatas.map(m => ({
            pageId: m.pageId,
            url: m.url,
            title: m.title || "",
            category: m.category,
            keywords: m.keywords || "",
            sourceDomain: m.sourceDomain || "www.mu.edu.lb",
            entityType: m.entityType || "",
        }));

        if (this.useLocal && this.localStore) {
            this.localStore.upsert(ids, embeddings, documents, metadatas);
            return;
        }

        if (this.collection) {
            await this.collection.upsert({
                ids,
                embeddings,
                documents,
                metadatas: stringMetas,
            });
        }
    }

    static async deleteChunks(ids: string[]): Promise<void> {
        await this.init();
        if (ids.length === 0) return;

        if (this.useLocal && this.localStore) {
            this.localStore.delete(ids);
            return;
        }

        if (this.collection) {
            await this.collection.delete({ ids });
        }
    }

    static async clearCollection(): Promise<void> {
        await this.init();

        if (this.useLocal && this.localStore) {
            this.localStore.clear();
            return;
        }

        if (this.client) {
            try {
                await this.client.deleteCollection({ name: COLLECTION_NAME });
            } catch { /* collection may not exist */ }
            this.collection = await this.client.getOrCreateCollection({ name: COLLECTION_NAME });
        }
    }

    static async search(queryEmbedding: number[], topK: number = ragConfig.vectorTopK): Promise<VectorSearchResult[]> {
        await this.init();

        if (this.useLocal && this.localStore) {
            return this.localStore.query(queryEmbedding, topK);
        }

        if (!this.collection) return [];

        const results = await this.collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: topK,
        });

        const output: VectorSearchResult[] = [];
        const ids = results.ids[0] || [];
        const docs = results.documents[0] || [];
        const distances = results.distances?.[0] || [];
        const metas = results.metadatas?.[0] || [];

        for (let i = 0; i < ids.length; i++) {
            const meta = metas[i] as Record<string, string> | undefined;
            output.push({
                id: ids[i],
                content: docs[i] || "",
                score: distances[i] != null ? 1 - (distances[i] as number) : 0.5,
                metadata: {
                    pageId: meta?.pageId || "",
                    url: meta?.url || "",
                    title: meta?.title || "",
                    category: meta?.category || "general",
                    keywords: meta?.keywords || "",
                    sourceDomain: meta?.sourceDomain || "",
                    entityType: meta?.entityType || undefined,
                },
            });
        }

        return output;
    }

    static async getCount(): Promise<number> {
        await this.init();

        if (this.useLocal && this.localStore) {
            return this.localStore.count();
        }

        if (this.collection) {
            return await this.collection.count();
        }
        return 0;
    }
}
