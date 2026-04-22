import { Router, Request, Response } from "express";
import { ScraperService } from "./scraper.service";
import { authMiddleware } from "../../../core/middleware/auth.middleware";

const router = Router();

// Legacy portal scrape endpoint
router.post("/scrape", async (req: Request, res: Response) => {
    try {
        const result = await ScraperService.scrapePortal(req.body);
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/scraper/university/crawl
 * Trigger a full university website crawl. Long-running operation.
 * Protected: admin only.
 */
router.post("/university/crawl", authMiddleware, async (req: Request, res: Response) => {
    try {
        if (ScraperService.running) {
            return res.status(409).json({
                success: false,
                message: "A scraping job is already running. Please wait for it to complete.",
            });
        }

        const config = {
            baseUrl: req.body.baseUrl || process.env.UNIVERSITY_WEBSITE_URL || "https://mu.edu.lb",
            maxPages: Math.min(req.body.maxPages || 300, 500),
            maxDepth: Math.min(req.body.maxDepth || 4, 5),
            delayMs: Math.max(req.body.delayMs || 1500, 500),
        };

        // Start scraping in background (don't block the response)
        res.json({
            success: true,
            message: "University website crawl started in background.",
            config,
        });

        // Run async in background
        ScraperService.scrapeUniversityWebsite(config).catch(err => {
            console.error("Background scrape error:", err.message);
        });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/scraper/university/sync
 * Trigger an incremental sync (only re-check stale pages).
 * Protected: admin only.
 */
router.post("/university/sync", authMiddleware, async (req: Request, res: Response) => {
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

/**
 * GET /api/scraper/university/stats
 * Get knowledge base statistics.
 * Protected: admin only.
 */
router.get("/university/stats", authMiddleware, async (req: Request, res: Response) => {
    try {
        const stats = await ScraperService.getKnowledgeBaseStats();
        res.json({ success: true, data: stats });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/scraper/university/runs
 * Get recent scraper run history.
 * Protected: admin only.
 */
router.get("/university/runs", authMiddleware, async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const runs = await ScraperService.getScraperRunHistory(limit);
        res.json({ success: true, data: runs });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/scraper/university/status
 * Check if a scraping job is currently running.
 */
router.get("/university/status", async (req: Request, res: Response) => {
    res.json({ success: true, running: ScraperService.running });
});

/**
 * POST /api/scraper/university/rescrape
 * Full re-scrape: clears all existing KB data and does a fresh complete crawl.
 * Use when the KB data needs to be rebuilt from scratch.
 * Protected: admin only.
 */
router.post("/university/rescrape", authMiddleware, async (req: Request, res: Response) => {
    try {
        if (ScraperService.running) {
            return res.status(409).json({
                success: false,
                message: "A scraping job is already running.",
            });
        }

        const config = {
            baseUrl: req.body.baseUrl || process.env.UNIVERSITY_WEBSITE_URL || "https://mu.edu.lb",
            maxPages: Math.min(req.body.maxPages || 500, 1000),
            maxDepth: Math.min(req.body.maxDepth || 5, 6),
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

export default router;
