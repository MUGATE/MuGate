import { logger } from "../../../core/logger/logger";
import { ragConfig } from "../../../config/rag.config";

/**
 * Sitemap Discovery — fetches sitemap.xml and nested sitemaps from mu.edu.lb.
 */
export class SitemapDiscovery {
    private static cache: { urls: string[]; fetchedAt: number } | null = null;
    private static CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

    static async discoverUrls(baseUrl?: string): Promise<string[]> {
        const now = Date.now();
        if (this.cache && now - this.cache.fetchedAt < this.CACHE_TTL_MS) {
            return this.cache.urls;
        }

        const base = (baseUrl || ragConfig.universityWebsiteUrl).replace(/\/$/, "");
        const urls = new Set<string>();

        const sitemapCandidates = [
            `${base}/sitemap.xml`,
            `${base}/sitemap_index.xml`,
            `${base}/wp-sitemap.xml`,
            `${base}/sitemap-index.xml`,
        ];

        for (const sitemapUrl of sitemapCandidates) {
            try {
                const found = await this.fetchSitemapUrls(sitemapUrl);
                found.forEach(u => urls.add(u));
                if (found.length > 0) break;
            } catch (err: any) {
                logger.debug(`Sitemap fetch skipped ${sitemapUrl}: ${err.message}`);
            }
        }

        const urlList = [...urls];
        this.cache = { urls: urlList, fetchedAt: now };
        logger.info(`Sitemap discovery: found ${urlList.length} URLs from ${base}`);
        return urlList;
    }

    private static async fetchSitemapUrls(sitemapUrl: string, depth: number = 0): Promise<string[]> {
        if (depth > 3) return [];

        const response = await fetch(sitemapUrl, {
            headers: { "User-Agent": "MuGate-Bot/1.0" },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) return [];

        const xml = await response.text();
        const urls: string[] = [];

        const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
        let match;
        while ((match = locRegex.exec(xml)) !== null) {
            const loc = match[1].trim();
            if (loc.endsWith(".xml") && depth < 3) {
                const nested = await this.fetchSitemapUrls(loc, depth + 1);
                nested.forEach(u => urls.push(u));
            } else if (loc.startsWith("http")) {
                urls.push(loc);
            }
        }

        return urls;
    }

    static clearCache(): void {
        this.cache = null;
    }

    /** Score URLs by keyword relevance for live search */
    static scoreUrlsByKeywords(urls: string[], keywords: string[]): Array<{ url: string; score: number }> {
        return urls
            .map(url => {
                const haystack = url.toLowerCase();
                let score = 0;
                for (const kw of keywords) {
                    if (haystack.includes(kw.toLowerCase())) score += 2;
                }
                return { url, score };
            })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score);
    }
}
