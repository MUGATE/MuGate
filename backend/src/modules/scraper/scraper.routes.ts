import { Router } from "express";
import { ScraperService } from "./scraper.service";

const router = Router();

router.post("/scrape", async (req, res) => {
    try {
        const result = await ScraperService.scrapePortal(req.body);
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
