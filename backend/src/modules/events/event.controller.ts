import { Request, Response } from "express";
import { EventService } from "./event.service";
import { EventCategory, EVENT_CATEGORIES } from "./event.types";

// ─── Controller ───────────────────────────────────────────

export class EventController {

    /**
     * GET /api/events
     * Get upcoming events with optional query params: search, category, location, limit, offset
     */
    static async getUpcoming(req: Request, res: Response) {
        try {
            const { search, category, location, limit, offset } = req.query;

            const events = await EventService.getUpcoming({
                search: search as string | undefined,
                category: category as EventCategory | undefined,
                location: location as string | undefined,
                limit: limit ? parseInt(limit as string, 10) : undefined,
                offset: offset ? parseInt(offset as string, 10) : undefined,
            });

            res.json({ success: true, data: events, count: events.length });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/events/categories
     * Get distinct categories that have upcoming events.
     */
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = await EventService.getCategories();
            res.json({ success: true, data: categories });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/events/stats
     * Get event statistics (counts by category and source).
     */
    static async getStats(req: Request, res: Response) {
        try {
            const stats = await EventService.getStats();
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/events/:id
     * Get a single event by ID.
     */
    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);
            if (isNaN(id) || id < 1) {
                res.status(400).json({ success: false, message: "Invalid event ID" });
                return;
            }

            const event = await EventService.getById(id);
            if (!event) {
                res.status(404).json({ success: false, message: "Event not found" });
                return;
            }

            res.json({ success: true, data: event });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/events/scrape
     * Trigger a full scrape-and-persist cycle.
     * Returns scrape stats (new, updated, errors per source).
     */
    static async triggerScrape(req: Request, res: Response) {
        try {
            const result = await EventService.scrapeAndPersist();
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}