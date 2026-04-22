/**
 * Wayback Machine Scraper for Al Maaref University (mu.edu.lb)
 * 
 * Fetches archived pages from web.archive.org to bypass Cloudflare,
 * cleans content, and populates the RAG knowledge base.
 */

import { pool, poolConnect } from "./src/core/database/connection";
import { ContentCleaner } from "./src/modules/system/scraper/content.cleaner";
import { KnowledgeRepository } from "./src/modules/system/scraper/knowledge.repository";
import { KnowledgeCategory } from "./src/modules/system/scraper/scraper.types";

// ─── Configuration ──────────────────────────────────────────

const WAYBACK_CDX_API = "https://web.archive.org/cdx/search/cdx";
const WAYBACK_BASE = "https://web.archive.org/web";

// Delay between fetches to be respectful to the Wayback Machine
const FETCH_DELAY_MS = 1500;

// Category classification rules
const CATEGORY_RULES: Array<{ pattern: RegExp; category: KnowledgeCategory; subcategory?: string }> = [
    { pattern: /facult|fba|foe|fos|frh|fhs|mass-communication/i, category: "faculty" },
    { pattern: /program|degree|department|course-description|degree-chart|study-program/i, category: "program" },
    { pattern: /admiss|apply|applicat|enroll|register/i, category: "admission" },
    { pattern: /tuition|fee|financial|scholar|payment/i, category: "financial" },
    { pattern: /regulat|policy|policies|rule|bylaws|governance|charter/i, category: "regulation" },
    { pattern: /calendar|deadline|schedule|dates|academic.?year|semester/i, category: "calendar" },
    { pattern: /faq|frequently|questions/i, category: "faq" },
    { pattern: /campus|library|lab|facilit|student.?life|club|activit|center/i, category: "campus" },
    { pattern: /research|publication|journal|conference/i, category: "research" },
    { pattern: /news|announcement|event|notice|memorandum|circular/i, category: "announcement" },
    { pattern: /about|history|president|mission|vision|strategy|quality/i, category: "general" },
];

// ─── URL Discovery ──────────────────────────────────────────

/**
 * Query the Wayback CDX API to discover all archived English pages
 */
async function discoverUrls(): Promise<Array<{ url: string; timestamp: string }>> {
    console.log("🔍 Querying Wayback Machine CDX API for mu.edu.lb/en/* ...");

    const cdxUrl = `${WAYBACK_CDX_API}?url=mu.edu.lb/en/*&output=json&fl=original,timestamp,statuscode,mimetype&collapse=urlkey&filter=statuscode:200&filter=mimetype:text/html&limit=500`;

    const response = await fetch(cdxUrl);
    if (!response.ok) throw new Error(`CDX API error: ${response.status}`);

    const data: string[][] = await response.json();

    // First row is headers: ["original", "timestamp", "statuscode", "mimetype"]
    const results = data.slice(1)
        .map(row => ({ url: row[0], timestamp: row[1] }))
        .filter(r => !shouldSkipUrl(r.url));

    console.log(`📋 Found ${results.length} unique archived pages`);
    return results;
}

/**
 * Skip URLs that won't have useful content
 */
function shouldSkipUrl(url: string): boolean {
    const skipPatterns = [
        /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar)$/i,
        /\.(jpg|jpeg|png|gif|svg|webp|ico|bmp|css|js)$/i,
        /\.(mp3|mp4|avi|mov|wmv|flv|wav)$/i,
        /\/images\//i,
        /\/css\//i,
        /\/js\//i,
        /\/fonts\//i,
        /\/assets\//i,
        /\?page=\d+/i,  // Skip paginated list pages (keep page=1 only)
        /\/wp-content\//i,
        /\/wp-admin\//i,
        /login|logout|signin|signout/i,
        /facebook|twitter|instagram|linkedin|youtube/i,
        /app_plugins/i,
        /umbracoforms/i,
    ];
    return skipPatterns.some(p => p.test(url));
}

// ─── Content Fetching ───────────────────────────────────────

/**
 * Fetch a page from the Wayback Machine
 */
async function fetchWaybackPage(url: string, timestamp: string): Promise<{ html: string; finalUrl: string } | null> {
    // Use the raw/id_ format to get the original page without Wayback Machine toolbar
    const waybackUrl = `${WAYBACK_BASE}/${timestamp}id_/${url}`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(waybackUrl, {
            signal: controller.signal,
            headers: {
                "User-Agent": "MuGate-KnowledgeBase/1.0 (academic research)",
                "Accept": "text/html",
            },
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.log(`  ⚠️  HTTP ${response.status} for ${url}`);
            return null;
        }

        const html = await response.text();
        return { html, finalUrl: url };
    } catch (error: any) {
        if (error.name === "AbortError") {
            console.log(`  ⏰ Timeout for ${url}`);
        } else {
            console.log(`  ❌ Error: ${error.message}`);
        }
        return null;
    }
}

// ─── Content Processing ─────────────────────────────────────

/**
 * Classify a URL into a knowledge category
 */
function categorizeUrl(url: string, title: string): KnowledgeCategory {
    const combined = `${url} ${title}`.toLowerCase();
    for (const rule of CATEGORY_RULES) {
        if (rule.pattern.test(combined)) {
            return rule.category;
        }
    }
    return "general";
}

/**
 * Extract subcategory from URL path
 */
function extractSubcategory(url: string): string | undefined {
    try {
        const path = new URL(url).pathname;
        const segments = path.split("/").filter(s => s.length > 0);
        // Remove 'en' prefix
        const filtered = segments.filter(s => s !== "en");
        if (filtered.length >= 2) {
            return filtered.slice(0, 2).join("/");
        }
        return filtered[0] || undefined;
    } catch {
        return undefined;
    }
}

/**
 * Clean Wayback Machine artifacts from HTML
 */
function cleanWaybackArtifacts(html: string): string {
    // Remove Wayback Machine toolbar and injected scripts
    let cleaned = html;

    // Remove <!-- BEGIN WAYBACK TOOLBAR INSERT --> ... <!-- END WAYBACK TOOLBAR INSERT -->
    cleaned = cleaned.replace(/<!-- BEGIN WAYBACK TOOLBAR INSERT -->[\s\S]*?<!-- END WAYBACK TOOLBAR INSERT -->/gi, "");

    // Remove Wayback Machine's header div
    cleaned = cleaned.replace(/<div id="wm-ipp-base"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, "");

    // Remove Wayback Machine scripts
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?wombat[\s\S]*?<\/script>/gi, "");
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?archive\.org[\s\S]*?<\/script>/gi, "");
    cleaned = cleaned.replace(/<script src="[^"]*web\.archive\.org[^"]*"[^>]*><\/script>/gi, "");

    // Fix relative URLs that point to web.archive.org
    cleaned = cleaned.replace(/https?:\/\/web\.archive\.org\/web\/\d+[a-z]*_?\//gi, "https://www.mu.edu.lb/");

    return cleaned;
}

// ─── Main Pipeline ──────────────────────────────────────────

async function main() {
    const isResume = process.argv.includes("--resume");

    console.log("═══════════════════════════════════════════════");
    console.log("  MuGate Wayback Machine Knowledge Base Builder");
    console.log(isResume ? "  MODE: RESUME (skipping existing pages)" : "  MODE: FRESH (clearing KB first)");
    console.log("═══════════════════════════════════════════════\n");

    // 1. Connect to database
    console.log("📦 Connecting to database...");
    await poolConnect;
    console.log("✅ Database connected\n");

    // 2. Clear existing knowledge base for fresh import (skip in resume mode)
    if (!isResume) {
        console.log("🗑️  Clearing existing knowledge base...");
        await pool.request().query("DELETE FROM KnowledgeChunks");
        await pool.request().query("DELETE FROM KnowledgePages");
        console.log("✅ Knowledge base cleared\n");
    } else {
        const existing = await pool.request().query("SELECT COUNT(*) as cnt FROM KnowledgePages");
        console.log(`📂 Resume mode: ${existing.recordset[0].cnt} pages already in KB\n`);
    }

    // Build set of existing URLs for resume mode
    const existingUrls = new Set<string>();
    if (isResume) {
        const rows = await pool.request().query("SELECT url FROM KnowledgePages");
        for (const row of rows.recordset) {
            existingUrls.add(row.url);
        }
    }

    // 3. Create scraper run log
    const runId = await KnowledgeRepository.createScraperRun("full_rescrape", "web.archive.org/mu.edu.lb");

    // 4. Discover all archived URLs
    const archivedUrls = await discoverUrls();

    // Prioritize important pages (about, faculties, programs, admissions first)
    const priorityPatterns = [/about/, /facult/, /program/, /admiss/, /tuition/, /fee/, /regulat/, /charter/, /faq/, /calendar/, /campus/, /center/];
    const prioritized = archivedUrls.sort((a, b) => {
        const aPriority = priorityPatterns.findIndex(p => p.test(a.url));
        const bPriority = priorityPatterns.findIndex(p => p.test(b.url));
        const aScore = aPriority >= 0 ? aPriority : 99;
        const bScore = bPriority >= 0 ? bPriority : 99;
        return aScore - bScore;
    });

    // 5. Fetch and process each page
    let pagesScraped = 0;
    let pagesStored = 0;
    let pagesSkipped = 0;
    let errors = 0;

    console.log(`\n🚀 Starting scrape of ${prioritized.length} pages...\n`);

    for (let i = 0; i < prioritized.length; i++) {
        const { url, timestamp } = prioritized[i];
        const progress = `[${i + 1}/${prioritized.length}]`;

        try {
            // In resume mode, skip URLs already in the knowledge base
            if (isResume) {
                const normalizedUrl = url.replace(/^https?:\/\/(www\.)?/, "https://www.");
                const normalUrl = normalizedUrl.startsWith("https://www.") ? normalizedUrl : `https://www.${normalizedUrl.replace(/^https?:\/\//, "")}`;
                const finalUrl = normalUrl.replace(/\/$/, "");
                if (existingUrls.has(finalUrl)) {
                    pagesSkipped++;
                    continue;
                }
            }

            // Fetch from Wayback Machine
            const result = await fetchWaybackPage(url, timestamp);
            if (!result) {
                pagesSkipped++;
                continue;
            }

            pagesScraped++;

            // Clean Wayback artifacts + standard HTML cleaning
            const cleanedHtml = cleanWaybackArtifacts(result.html);
            const title = ContentCleaner.extractTitle(cleanedHtml);
            const cleanContent = ContentCleaner.cleanHtml(cleanedHtml);

            // Check if content is meaningful
            if (!ContentCleaner.isContentMeaningful(cleanContent)) {
                console.log(`${progress} ⏭️  Low content: ${url}`);
                pagesSkipped++;
                continue;
            }

            // Categorize and store
            const category = categorizeUrl(url, title);
            const language = ContentCleaner.detectLanguage(cleanContent);
            const wordCount = cleanContent.split(/\s+/).length;
            const contentHash = ContentCleaner.computeHash(cleanContent);
            const subcategory = extractSubcategory(url);

            // Normalize URL to original (not wayback)
            const normalizedUrl = url.replace(/^https?:\/\/(www\.)?/, "https://www.");
            const normalUrl = normalizedUrl.startsWith("https://www.") ? normalizedUrl : `https://www.${normalizedUrl.replace(/^https?:\/\//, "")}`;
            const finalUrl = normalUrl.replace(/\/$/, ""); // Remove trailing slash

            const upsertResult = await KnowledgeRepository.upsertPage({
                url: finalUrl,
                title: title || "Untitled",
                rawHtml: "",  // Don't store raw HTML to save space
                cleanContent,
                contentHash,
                category,
                subcategory,
                language,
                wordCount,
            });

            pagesStored++;
            console.log(`${progress} ✅ ${category.padEnd(12)} | ${title?.substring(0, 50) || url} (${wordCount} words)`);

        } catch (error: any) {
            console.log(`${progress} ❌ Error: ${error.message}`);
            errors++;
        }

        // Respectful delay
        await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MS));
    }

    // 6. Complete the run
    await KnowledgeRepository.completeScraperRun(runId, "completed", {
        pagesScraped,
        pagesNew: pagesStored,
        pagesUpdated: 0,
        pagesUnchanged: 0,
        errorCount: errors,
        errorDetails: errors > 0 ? `${errors} pages had errors` : undefined,
    });

    // 7. Print summary
    const stats = await KnowledgeRepository.getStats();

    console.log("\n═══════════════════════════════════════════════");
    console.log("  SCRAPE COMPLETE");
    console.log("═══════════════════════════════════════════════");
    console.log(`  Pages fetched:    ${pagesScraped}`);
    console.log(`  Pages stored:     ${pagesStored}`);
    console.log(`  Pages skipped:    ${pagesSkipped}`);
    console.log(`  Errors:           ${errors}`);
    console.log(`  Total KB pages:   ${stats.totalPages}`);
    console.log(`  Total KB chunks:  ${stats.totalChunks}`);
    console.log(`  Categories:`);
    for (const cat of stats.categoryBreakdown) {
        console.log(`    ${cat.category.padEnd(14)} ${cat.count} pages`);
    }
    console.log("═══════════════════════════════════════════════\n");

    process.exit(0);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
