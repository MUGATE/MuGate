import { logger } from "../../core/logger/logger";
import { EventRepository } from "./event.repository";
import { runAllScrapers } from "./event.scraper";
import { EventFilters, EventScrapeResult, EventScrapeStats, Event, EVENT_CATEGORIES } from "./event.types";

// ─── Service ──────────────────────────────────────────────

export class EventService {

    /**
     * Get upcoming events with optional filters.
     */
    static async getUpcoming(filters: EventFilters = {}): Promise<Event[]> {
        // Validate category if provided
        if (filters.category && !EVENT_CATEGORIES.includes(filters.category)) {
            throw new Error(`Invalid category: ${filters.category}`);
        }

        // Clamp limit to prevent abuse
        if (filters.limit && filters.limit > 200) {
            filters.limit = 200;
        }

        return EventRepository.getUpcoming(filters);
    }

    /**
     * Get a single event by ID.
     */
    static async getById(id: number): Promise<Event | null> {
        if (!id || isNaN(id) || id < 1) {
            throw new Error("Invalid event ID");
        }
        return EventRepository.getById(id);
    }

    /**
     * Get available categories (only those with upcoming events).
     */
    static async getCategories(): Promise<string[]> {
        return EventRepository.getDistinctCategories();
    }

    /**
     * Get event stats (counts by category and source).
     */
    static async getStats(): Promise<{
        totalUpcoming: number;
        byCategory: { category: string; count: number }[];
        bySource: { scraperSource: string; count: number }[];
    }> {
        return EventRepository.getStats();
    }

    /**
     * Run all scrapers, upsert results into DB, and return a summary.
     * This is the main "refresh events" action.
     */
    static async scrapeAndPersist(): Promise<EventScrapeResult> {
        const startTime = Date.now();
        logger.info("Event scrape-and-persist started...");

        // Step 1: Deactivate past events
        const deactivated = await EventRepository.deactivatePastEvents();
        if (deactivated > 0) {
            logger.info(`Deactivated ${deactivated} past events.`);
        }

        // Step 2: Run all scrapers
        const { events: scrapedEvents, stats: scraperStats } = await runAllScrapers();

        // Step 3: Upsert each scraped event into the DB
        const resultStats: EventScrapeStats[] = [];
        let totalNew = 0;
        let totalUpdated = 0;
        let totalErrors = 0;

        // Group events by source for per-source stats
        const eventsBySource = new Map<string, typeof scrapedEvents>();
        for (const event of scrapedEvents) {
            const key = event.scraperSource;
            if (!eventsBySource.has(key)) {
                eventsBySource.set(key, []);
            }
            eventsBySource.get(key)!.push(event);
        }

        for (const scraperStat of scraperStats) {
            const sourceEvents = eventsBySource.get(scraperStat.source) || [];
            let newCount = 0;
            let updatedCount = 0;
            let unchangedCount = 0;
            let errorCount = scraperStat.errors;

            for (const event of sourceEvents) {
                try {
                    const result = await EventRepository.upsertScrapedEvent(event);
                    if (result === "new") newCount++;
                    else if (result === "updated") updatedCount++;
                    else unchangedCount++;
                } catch (err: any) {
                    errorCount++;
                    logger.warn(`Failed to upsert event "${event.title}": ${err.message}`);
                }
            }

            totalNew += newCount;
            totalUpdated += updatedCount;
            totalErrors += errorCount;

            resultStats.push({
                source: scraperStat.source,
                eventsFound: sourceEvents.length,
                eventsNew: newCount,
                eventsUpdated: updatedCount,
                eventsUnchanged: unchangedCount,
                errors: errorCount,
                durationMs: scraperStat.durationMs,
            });
        }

        const totalDuration = Date.now() - startTime;
        logger.info(`Event scrape-and-persist complete: ${totalNew} new, ${totalUpdated} updated, ${totalErrors} errors in ${totalDuration}ms`);

        return {
            success: totalErrors === 0,
            stats: resultStats,
            totalNew,
            totalUpdated,
            totalErrors,
        };
    }

    /**
     * Add a manual event (admin only).
     */
    static async addManualEvent(event: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event> {
        if (!event.title || event.title.trim().length === 0) {
            throw new Error("Event title is required");
        }
        if (!event.startDate) {
            throw new Error("Start date is required");
        }
        return EventRepository.addManualEvent(event);
    }

    /**
     * Update a manual event (admin only).
     */
    static async updateManualEvent(id: number, event: Partial<Event>): Promise<Event | null> {
        if (!id || isNaN(id) || id < 1) {
            throw new Error("Invalid event ID");
        }
        return EventRepository.updateManualEvent(id, event);
    }

    /**
     * Delete a manual event (admin only).
     */
    static async deleteManualEvent(id: number): Promise<boolean> {
        if (!id || isNaN(id) || id < 1) {
            throw new Error("Invalid event ID");
        }
        return EventRepository.deleteManualEvent(id);
    }
}