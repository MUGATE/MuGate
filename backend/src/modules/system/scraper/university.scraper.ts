import path from "path";
import fs from "fs";
import { chromium as chromiumExtra } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, BrowserContext, Page } from "playwright";
import { logger } from "../../../core/logger/logger";
import { ContentCleaner } from "./content.cleaner";
import { ragConfig } from "../../../config/rag.config";
import {
    ScrapedPage,
    ScraperConfig,
    KnowledgeCategory,
    CategoryRule,
} from "./scraper.types";
import { HEADLESS_BROWSER_ARGS } from "../../../core/utils/launchHeadlessBrowser";
import "../../../core/utils/windowsHideSpawn";

chromiumExtra.use(StealthPlugin());

const stealthLaunchArgs = [
    ...HEADLESS_BROWSER_ARGS,
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
];

/**
 * University Website Scraper — Crawls the public university website,
 * extracts content from all relevant pages, cleans and categorizes it.
 * Uses Playwright with Cloudflare bypass strategy:
 *   - Single persistent browser context (preserves clearance cookies)
 *   - Waits for Cloudflare challenge resolution
 *   - Retry with exponential backoff
 *   - Realistic browser fingerprint
 */
export class UniversityScraper {
    private config: ScraperConfig;
    private visited: Set<string> = new Set();
    private queue: Array<{ url: string; depth: number }> = [];
    private results: ScrapedPage[] = [];
    private errors: string[] = [];
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;

    // URL patterns to categorize scraped pages
    private static CATEGORY_RULES: CategoryRule[] = [
        { pattern: /facult/i, category: "faculty" },
        { pattern: /depart/i, category: "faculty", subcategory: "department" },
        { pattern: /program|major|degree|bachelor|master|phd|diploma/i, category: "program" },
        { pattern: /course|curriculum|syllabus/i, category: "course" },
        { pattern: /regulat|policy|policies|rule|bylaws|governance/i, category: "regulation" },
        { pattern: /calendar|deadline|schedule|dates|academic.?year|semester/i, category: "calendar" },
        { pattern: /faq|frequently|questions/i, category: "faq" },
        { pattern: /admiss|apply|applicat|enroll|register|registr/i, category: "admission" },
        { pattern: /news|announcement|event|notice|update/i, category: "announcement" },
        { pattern: /tuition|fee|financial|scholar|payment|aid/i, category: "financial" },
        { pattern: /campus|library|lab|facilit|student.?life|club|activit/i, category: "campus" },
        { pattern: /research|publication|journal|conference/i, category: "research" },
        { pattern: /staff|people|instructors?|professors?|faculty.?members/i, category: "faculty", subcategory: "instructors" },
    ];

    // URL patterns to skip (files, external resources, etc.)
    private static SKIP_PATTERNS: RegExp[] = [
        /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)$/i,
        /\.(jpg|jpeg|png|gif|svg|webp|ico|bmp)$/i,
        /\.(mp3|mp4|avi|mov|wmv|flv|wav)$/i,
        /\.(css|js|json|xml|rss|atom)$/i,
        /mailto:/i,
        /tel:/i,
        /javascript:/i,
        /#$/,
        /\?.*print/i,
        /\/wp-content\//i,
        /\/wp-admin\//i,
        /\/wp-includes\//i,
        /login|logout|signin|signout/i,
        /facebook|twitter|instagram|linkedin|youtube|whatsapp/i,
        /google\.com|maps\.google/i,
    ];

    constructor(config: Partial<ScraperConfig> = {}) {
        this.config = {
            baseUrl: config.baseUrl || ragConfig.universityWebsiteUrl,
            maxPages: config.maxPages || ragConfig.scraperMaxPages,
            maxDepth: config.maxDepth || ragConfig.scraperMaxDepth,
            delayMs: config.delayMs || ragConfig.scraperDelayMs,
            timeoutMs: config.timeoutMs || 15000,
            seedUrls: config.seedUrls,
            ...config,
        };
    }

    /** Shared warm browser for live on-demand fetches */
    private static liveBrowser: Browser | null = null;
    private static liveContext: BrowserContext | null = null;
    private static liveInitPromise: Promise<void> | null = null;

    private static async ensureLiveSession(): Promise<BrowserContext> {
        if (UniversityScraper.liveContext) return UniversityScraper.liveContext;

        if (!UniversityScraper.liveInitPromise) {
            UniversityScraper.liveInitPromise = (async () => {
                const profilePath = path.resolve(ragConfig.browserProfilePath);
                fs.mkdirSync(profilePath, { recursive: true });

                UniversityScraper.liveBrowser = await chromiumExtra.launch({
                    headless: true,
                    args: stealthLaunchArgs,
                });

                UniversityScraper.liveContext = await UniversityScraper.liveBrowser.newContext({
                    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    ignoreHTTPSErrors: true,
                    viewport: { width: 1920, height: 1080 },
                    locale: "en-US",
                    timezoneId: "Asia/Beirut",
                });

                const page = await UniversityScraper.liveContext.newPage();
                try {
                    const base = ragConfig.universityWebsiteUrl.replace(/\/$/, "");
                    await page.goto(base, { waitUntil: "networkidle", timeout: 30000 });
                    await UniversityScraper.waitForCloudflareStatic(page, 20000);
                } catch (err: any) {
                    logger.warn(`Live session warm-up: ${err.message}`);
                } finally {
                    await page.close();
                }
            })();
        }

        await UniversityScraper.liveInitPromise;
        return UniversityScraper.liveContext!;
    }

    /** Fetch a single page for live search (reuses warm session) */
    static async fetchPage(url: string, timeoutMs: number = 10000): Promise<ScrapedPage | null> {
        const scraper = new UniversityScraper({ maxPages: 1, maxDepth: 0, delayMs: 0, timeoutMs });
        try {
            const context = await UniversityScraper.ensureLiveSession();
            scraper.context = context;
            scraper.config.baseUrl = ragConfig.universityWebsiteUrl;
            return await scraper.scrapePage(url, 1);
        } catch (err: any) {
            logger.warn(`Live fetch failed for ${url}: ${err.message}`);
            return null;
        }
    }

    /** Crawl only specific URLs (incremental / live search batch) */
    async crawlUrls(urls: string[]): Promise<{ pages: ScrapedPage[]; errors: string[] }> {
        this.errors = [];
        this.results = [];
        this.visited = new Set();

        try {
            const profilePath = path.resolve(ragConfig.browserProfilePath);
            fs.mkdirSync(profilePath, { recursive: true });

            this.browser = await chromiumExtra.launch({
                headless: true,
                args: stealthLaunchArgs,
            });

            this.context = await this.browser.newContext({
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                ignoreHTTPSErrors: true,
                viewport: { width: 1920, height: 1080 },
                locale: "en-US",
                timezoneId: "Asia/Beirut",
            });

            await this.warmUpSession();

            for (const url of urls) {
                if (this.visited.has(url)) continue;
                this.visited.add(url);
                try {
                    const page = await this.scrapePage(url);
                    if (page) this.results.push(page);
                    await this.delay(this.config.delayMs);
                } catch (error: any) {
                    this.errors.push(`Error scraping ${url}: ${error.message}`);
                }
            }

            return { pages: this.results, errors: this.errors };
        } finally {
            if (this.context && this.context !== UniversityScraper.liveContext) {
                await this.context.close();
            }
            this.context = null;
            if (this.browser && this.browser !== UniversityScraper.liveBrowser) {
                await this.browser.close();
            }
            this.browser = null;
        }
    }

    /**
     * Main entry point: crawl the university website and return scraped pages.
     */
    async crawl(): Promise<{ pages: ScrapedPage[]; errors: string[] }> {
        logger.info(`Starting university website crawl: ${this.config.baseUrl}`);
        logger.info(`Config: maxPages=${this.config.maxPages}, maxDepth=${this.config.maxDepth}, delay=${this.config.delayMs}ms`);

        try {
            const profilePath = path.resolve(ragConfig.browserProfilePath);
            fs.mkdirSync(profilePath, { recursive: true });

            this.browser = await chromiumExtra.launch({
                headless: true,
                args: stealthLaunchArgs,
            });

            // Create ONE persistent browser context for the entire crawl
            // This preserves cookies (including Cloudflare clearance) across all pages
            this.context = await this.browser.newContext({
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                ignoreHTTPSErrors: true,
                viewport: { width: 1920, height: 1080 },
                locale: "en-US",
                timezoneId: "Asia/Beirut",
                javaScriptEnabled: true,
            });

            // Pass Cloudflare on the homepage first (warm up cookies)
            await this.warmUpSession();

            // Seed the queue with sitemap URLs + default paths
            this.seedQueue();

            if (this.config.seedUrls && this.config.seedUrls.length > 0) {
                for (const url of this.config.seedUrls) {
                    if (!this.visited.has(url)) {
                        this.queue.unshift({ url, depth: 0 });
                    }
                }
            }

            // Process queue with BFS
            while (this.queue.length > 0 && this.visited.size < this.config.maxPages) {
                const { url, depth } = this.queue.shift()!;

                if (this.visited.has(url) || depth > this.config.maxDepth) continue;
                this.visited.add(url);

                try {
                    logger.info(`[${this.visited.size}/${this.config.maxPages}] Scraping: ${url} (depth ${depth})`);
                    const page = await this.scrapePage(url);

                    if (page) {
                        this.results.push(page);

                        // Extract and enqueue internal links
                        const links = this.extractLinks(page.rawHtml, url);
                        for (const link of links) {
                            if (!this.visited.has(link) && this.isInternalUrl(link)) {
                                this.queue.push({ url: link, depth: depth + 1 });
                            }
                        }
                    }

                    // Respectful delay between requests (randomized to appear human)
                    const jitter = Math.floor(Math.random() * 1000);
                    await this.delay(this.config.delayMs + jitter);

                } catch (error: any) {
                    const errMsg = `Error scraping ${url}: ${error.message}`;
                    logger.error(errMsg);
                    this.errors.push(errMsg);
                }
            }

            logger.info(`Crawl complete. Scraped ${this.results.length} pages, ${this.errors.length} errors.`);
            return { pages: this.results, errors: this.errors };

        } finally {
            if (this.context) {
                await this.context.close();
                this.context = null;
            }
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        }
    }

    /**
     * Warm up the browser session by visiting the homepage first.
     * This allows Cloudflare challenge to resolve and sets clearance cookies
     * that persist for the rest of the crawl.
     */
    private async warmUpSession(): Promise<void> {
        if (!this.context) return;
        const page = await this.context.newPage();
        try {
            const base = this.config.baseUrl.replace(/\/$/, "");
            logger.info("Warming up browser session (resolving Cloudflare challenge)...");

            await page.goto(base, {
                waitUntil: "networkidle",
                timeout: 30000,
            });

            // Wait for Cloudflare challenge to resolve (if present)
            // Cloudflare shows a "Checking your browser" page then redirects
            await this.waitForCloudflare(page);

            logger.info("Session warm-up complete. Cloudflare cookies should be set.");
        } catch (error: any) {
            logger.warn(`Warm-up navigation warning: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    /**
     * Wait for Cloudflare challenge to resolve. Checks for known Cloudflare
     * indicators and waits until they disappear or timeout.
     */
    private async waitForCloudflare(page: Page, maxWaitMs: number = 15000): Promise<void> {
        return UniversityScraper.waitForCloudflareStatic(page, maxWaitMs);
    }

    private static async waitForCloudflareStatic(page: Page, maxWaitMs: number = 15000): Promise<void> {
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitMs) {
            const title = await page.title().catch(() => "");
            const content = await page.content().catch(() => "");

            // Cloudflare challenge indicators
            const isCfChallenge =
                title.toLowerCase().includes("just a moment") ||
                title.toLowerCase().includes("attention required") ||
                content.includes("cf-browser-verification") ||
                content.includes("cf_chl_opt") ||
                content.includes("challenge-platform");

            if (!isCfChallenge) {
                return; // Challenge resolved or no challenge present
            }

            logger.info("Cloudflare challenge detected, waiting...");
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        logger.warn("Cloudflare challenge did not resolve within timeout");
    }

    /**
     * Scrape a single page with retry logic.
     */
    private async scrapePage(url: string, retries: number = 2): Promise<ScrapedPage | null> {
        for (let attempt = 0; attempt <= retries; attempt++) {
            const result = await this.scrapePageAttempt(url);
            if (result) return result;

            if (attempt < retries) {
                const backoff = (attempt + 1) * 2000;
                logger.info(`Retrying ${url} in ${backoff}ms (attempt ${attempt + 2}/${retries + 1})`);
                await this.delay(backoff);
            }
        }
        return null;
    }

    /**
     * Single attempt to scrape a page. Uses the shared browser context.
     */
    private async scrapePageAttempt(url: string): Promise<ScrapedPage | null> {
        if (!this.context) throw new Error("Browser context not initialized");

        const page = await this.context.newPage();

        try {
            const response = await page.goto(url, {
                waitUntil: "networkidle",
                timeout: this.config.timeoutMs,
            });

            if (!response) {
                logger.warn(`No response for ${url}`);
                return null;
            }

            // Check for Cloudflare challenge and wait if needed
            await this.waitForCloudflare(page, 10000);

            const status = response.status();
            if (status >= 400) {
                logger.warn(`HTTP ${status} for ${url}`);
                return null;
            }

            // Wait for dynamic content
            await page.waitForTimeout(1500);

            const rawHtml = await page.content();
            const title = ContentCleaner.extractTitle(rawHtml);
            const cleanContent = ContentCleaner.cleanHtml(rawHtml);

            // Skip pages with insufficient meaningful content
            if (!ContentCleaner.isContentMeaningful(cleanContent)) {
                logger.info(`Skipping low-content page: ${url}`);
                return null;
            }

            const contentHash = ContentCleaner.computeHash(cleanContent);
            const category = this.categorizeUrl(url, title, cleanContent);
            const language = ContentCleaner.detectLanguage(cleanContent);
            const wordCount = cleanContent.split(/\s+/).length;

            return {
                url: this.normalizeUrl(url),
                title,
                rawHtml,
                cleanContent,
                contentHash,
                category,
                subcategory: this.extractSubcategory(url),
                language,
                wordCount,
            };

        } catch (error: any) {
            logger.warn(`Failed to scrape ${url}: ${error.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    /**
     * Seed the queue with common university page entry points
     */
    private seedQueue(): void {
        const base = this.config.baseUrl.replace(/\/$/, "");

        const seedPaths = [
            "",               // Homepage
            "/en",            // English version
            "/ar",            // Arabic version
            "/about",
            "/about-us",
            "/faculties",
            "/faculty",
            "/departments",
            "/programs",
            "/academics",
            "/academic-programs",
            "/admissions",
            "/admission",
            "/registration",
            "/tuition",
            "/fees",
            "/financial-aid",
            "/scholarships",
            "/academic-calendar",
            "/calendar",
            "/regulations",
            "/policies",
            "/rules",
            "/student-life",
            "/campus",
            "/library",
            "/research",
            "/news",
            "/announcements",
            "/events",
            "/faq",
            "/contact",
            "/en/faculties",
            "/en/programs",
            "/en/admissions",
            "/en/about",
            "/en/academics",
            "/en/student-life",
            "/staff",
            "/people",
            "/instructors",
            "/faculty-members",
        ];

        for (const path of seedPaths) {
            const url = `${base}${path}`;
            if (!this.visited.has(url)) {
                this.queue.push({ url, depth: 0 });
            }
        }
    }

    /**
     * Extract all internal links from HTML content
     */
    private extractLinks(html: string, currentUrl: string): string[] {
        const links: string[] = [];
        const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
        let match;

        while ((match = hrefRegex.exec(html)) !== null) {
            try {
                let href = match[1].trim();
                if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;

                // Resolve relative URLs
                const absoluteUrl = new URL(href, currentUrl).href;
                const normalized = this.normalizeUrl(absoluteUrl);

                // Skip non-internal or excluded URLs
                if (!this.isInternalUrl(normalized)) continue;
                if (this.shouldSkipUrl(normalized)) continue;

                links.push(normalized);
            } catch {
                // Invalid URL, skip
            }
        }

        return [...new Set(links)]; // Deduplicate
    }

    /**
     * Check if a URL belongs to the university domain
     */
    private isInternalUrl(url: string): boolean {
        try {
            const baseHost = new URL(this.config.baseUrl).hostname.replace(/^www\./, "");
            const urlHost = new URL(url).hostname.replace(/^www\./, "");
            return urlHost === baseHost || urlHost.endsWith(`.${baseHost}`);
        } catch {
            return false;
        }
    }

    /**
     * Check if a URL should be skipped (files, external resources, etc.)
     */
    private shouldSkipUrl(url: string): boolean {
        return UniversityScraper.SKIP_PATTERNS.some(pattern => pattern.test(url));
    }

    /**
     * Normalize a URL: remove fragment, trailing slash, lowercase
     */
    private normalizeUrl(url: string): string {
        try {
            const parsed = new URL(url);
            parsed.hash = "";
            let normalized = parsed.href;
            // Remove trailing slash (except for root)
            if (normalized.endsWith("/") && parsed.pathname !== "/") {
                normalized = normalized.slice(0, -1);
            }
            return normalized;
        } catch {
            return url;
        }
    }

    /**
     * Categorize a URL based on patterns in the URL, title, and content
     */
    private categorizeUrl(url: string, title: string, content: string): KnowledgeCategory {
        const combined = `${url} ${title}`.toLowerCase();

        for (const rule of UniversityScraper.CATEGORY_RULES) {
            if (rule.pattern.test(combined)) {
                return rule.category;
            }
        }

        // Try content-based classification as fallback
        const contentSample = content.substring(0, 500).toLowerCase();
        for (const rule of UniversityScraper.CATEGORY_RULES) {
            if (rule.pattern.test(contentSample)) {
                return rule.category;
            }
        }

        return "general";
    }

    /**
     * Extract a subcategory from the URL path
     */
    private extractSubcategory(url: string): string | undefined {
        try {
            const path = new URL(url).pathname;
            const segments = path.split("/").filter(s => s.length > 0);
            if (segments.length >= 2) {
                return segments.slice(0, 2).join("/");
            }
            return segments[0] || undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * Simple delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
