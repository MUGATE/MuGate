/** Credentials for university portal login */
export interface ScraperCredentials {
    username: string;
    password: string;
}

/** Course data scraped from portal */
export interface ScrapedCourse {
    courseCode: string;
    courseName: string;
    section: string;
    instructor: string;
    schedule: string;
    credits: number;
}

// ─── RAG Knowledge Base Types ──────────────────────────

/** Categories for knowledge base content */
export type KnowledgeCategory =
    | "faculty"
    | "program"
    | "course"
    | "regulation"
    | "calendar"
    | "faq"
    | "admission"
    | "announcement"
    | "financial"
    | "campus"
    | "research"
    | "general";

/** A scraped university web page before DB insertion */
export interface ScrapedPage {
    url: string;
    title: string;
    rawHtml: string;
    cleanContent: string;
    contentHash: string;
    category: KnowledgeCategory;
    subcategory?: string;
    language: string;
    wordCount: number;
}

/** A knowledge page record from the database */
export interface KnowledgePage {
    id: string;
    url: string;
    title: string;
    content: string;
    contentHash: string;
    category: KnowledgeCategory;
    subcategory: string | null;
    language: string;
    wordCount: number;
    sourceDomain?: string | null;
    lastScrapedAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/** A searchable content chunk from the database */
export interface KnowledgeChunk {
    id: string;
    pageId: string;
    chunkIndex: number;
    content: string;
    keywords: string | null;
    category: KnowledgeCategory;
    title: string | null;
    entityType?: string | null;
    chromaSyncedAt?: Date | null;
    embeddingModel?: string | null;
    createdAt: Date;
}

/** A chunk with search relevance score */
export interface ScoredChunk extends KnowledgeChunk {
    relevanceScore: number;
    matchedTerms: string[];
}

/** Scraper run log record */
export interface ScraperRun {
    id?: string;
    runType: "full" | "incremental" | "full_rescrape";
    status: "running" | "completed" | "failed";
    baseUrl?: string;
    pagesScraped: number;
    pagesUpdated: number;
    pagesNew: number;
    pagesUnchanged: number;
    errorCount: number;
    errorDetails?: string;
    startedAt: Date;
    completedAt?: Date;
}

/** Configuration for the university scraper */
export interface ScraperConfig {
    baseUrl: string;
    maxPages: number;
    maxDepth: number;
    delayMs: number;
    timeoutMs: number;
    seedUrls?: string[];
    includePatterns?: RegExp[];
    excludePatterns?: RegExp[];
}

/** Progress callback for scraper status updates */
export interface ScraperProgress {
    pagesScraped: number;
    totalQueued: number;
    currentUrl: string;
    errors: number;
}

/** URL category mapping rule */
export interface CategoryRule {
    pattern: RegExp;
    category: KnowledgeCategory;
    subcategory?: string;
}
