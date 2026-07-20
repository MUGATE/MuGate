import { Router, Request, Response } from "express";
import { ScraperService } from "./scraper.service";
import { authMiddleware } from "../../../core/middleware/auth.middleware";
import { adminMiddleware } from "../../../core/middleware/admin.middleware";
import { ragConfig } from "../../../config/rag.config";

const router = Router();

/** Only allow crawl baseUrls under the configured university host (SSRF guard). */
function resolveAllowedCrawlBaseUrl(requested: unknown): string {
    const fallback = ragConfig.universityWebsiteUrl;
    if (!requested || typeof requested !== "string" || !requested.trim()) {
        return fallback;
    }

    let requestedUrl: URL;
    let allowedUrl: URL;
    try {
        requestedUrl = new URL(requested.trim());
        allowedUrl = new URL(fallback);
    } catch {
        throw new Error("Invalid crawl baseUrl.");
    }

    if (requestedUrl.protocol !== "http:" && requestedUrl.protocol !== "https:") {
        throw new Error("Crawl baseUrl must use http or https.");
    }

    const reqHost = requestedUrl.hostname.toLowerCase().replace(/^www\./, "");
    const allowHost = allowedUrl.hostname.toLowerCase().replace(/^www\./, "");
    if (reqHost !== allowHost && !reqHost.endsWith(`.${allowHost}`)) {
        throw new Error(`Crawl baseUrl host must match ${allowHost}.`);
    }

    return requestedUrl.origin;
}

router.post("/scrape", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await ScraperService.scrapePortal(req.body);
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/university/crawl", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        if (ScraperService.running) {
            return res.status(409).json({
                success: false,
                message: "A scraping job is already running. Please wait for it to complete.",
            });
        }

        let baseUrl: string;
        try {
            baseUrl = resolveAllowedCrawlBaseUrl(req.body.baseUrl);
        } catch (err: any) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const config = {
            baseUrl,
            maxPages: Math.min(req.body.maxPages || ragConfig.scraperMaxPages, 3000),
            maxDepth: Math.min(req.body.maxDepth || ragConfig.scraperMaxDepth, 8),
            delayMs: Math.max(req.body.delayMs || ragConfig.scraperDelayMs, 500),
        };

        res.json({
            success: true,
            message: "University website crawl started in background.",
            config,
        });

        ScraperService.scrapeUniversityWebsite(config).catch(err => {
            console.error("Background scrape error:", err.message);
        });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/university/sync", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        if (ScraperService.running) {
            return res.status(409).json({
                success: false,
                message: "A scraping job is already running.",
            });
        }

        const maxAgeHours = req.body.maxAgeHours || 24;

        res.json({
            success: true,
            message: "Incremental sync started in background.",
        });

        ScraperService.incrementalSync(maxAgeHours).catch(err => {
            console.error("Background sync error:", err.message);
        });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/university/stats", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const stats = await ScraperService.getKnowledgeBaseStats();
        res.json({ success: true, data: stats });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/university/runs", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const runs = await ScraperService.getScraperRunHistory(limit);
        res.json({ success: true, data: runs });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/university/status", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    res.json({ success: true, running: ScraperService.running });
});

router.post("/university/rescrape", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        if (ScraperService.running) {
            return res.status(409).json({
                success: false,
                message: "A scraping job is already running.",
            });
        }

        let baseUrl: string;
        try {
            baseUrl = resolveAllowedCrawlBaseUrl(req.body.baseUrl);
        } catch (err: any) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const config = {
            baseUrl,
            maxPages: Math.min(req.body.maxPages || ragConfig.scraperMaxPages, 3000),
            maxDepth: Math.min(req.body.maxDepth || ragConfig.scraperMaxDepth, 8),
            delayMs: Math.max(req.body.delayMs || 2000, 500),
        };

        res.json({
            success: true,
            message: "Full re-scrape started. All existing knowledge base data will be cleared and rebuilt.",
            config,
        });

        ScraperService.fullRescrape(config).catch(err => {
            console.error("Background rescrape error:", err.message);
        });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/university/reindex", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            message: "Vector reindex started in background.",
        });

        ScraperService.reindexVectors().catch(err => {
            console.error("Background reindex error:", err.message);
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/university/sitemap-refresh", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        if (ScraperService.running) {
            return res.status(409).json({
                success: false,
                message: "A scraping job is already running. Please wait for it to complete.",
            });
        }

        res.json({
            success: true,
            message: "Sitemap refresh started — discovering URLs and crawling the queue.",
        });

        ScraperService.refreshSitemap().catch(err => {
            console.error("Background sitemap refresh error:", err.message);
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
