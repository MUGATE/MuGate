import { logger } from "../../core/logger/logger";
import { ScrapedEvent, ScraperSource } from "./event.types";
import { getCuratedLebaneseEvents } from "./scrapers/curated.scraper";
import { scrapeBerytech } from "./scrapers/berytech.scraper";
import { scrapeAUB } from "./scrapers/aub.scraper";
import { scrapeZakaAI } from "./scrapers/zaka.scraper";
import { scrapeEventbrite } from "./scrapers/eventbrite.scraper";

// ─── Scraper Orchestrator ─────────────────────────────────

export interface ScraperPlugin {
    source: ScraperSource;
    scrape: () => Promise<ScrapedEvent[]>;
}

/**
 * Registry of all scrapers.
 * - "university" source: curated events + Berytech + AUB (Playwright)
 * - "eventbrite": Global platform (Playwright, limited Lebanon results)
 * - "zaka": AI training platform
 */
export const SCRAPER_PLUGINS: ScraperPlugin[] = [
    { source: "university", scrape: getCuratedLebaneseEvents },
    { source: "university", scrape: scrapeBerytech },
    { source: "university", scrape: scrapeAUB },
    { source: "eventbrite", scrape: scrapeEventbrite },
    { source: "zaka", scrape: scrapeZakaAI },
];

/**
 * Run all registered scrapers and return combined results.
 */
export async function runAllScrapers(): Promise<{
    events: ScrapedEvent[];
    stats: { source: ScraperSource; found: number; errors: number; durationMs: number }[];
}> {
    const allEvents: ScrapedEvent[] = [];
    const statsMap = new Map<string, {
        source: ScraperSource; found: number; errors: number; durationMs: number;
    }>();

    const results = await Promise.allSettled(
        SCRAPER_PLUGINS.map(async (plugin) => {
            const start = Date.now();
            try {
                logger.info(`Running ${plugin.source} scraper...`);
                const evts = await plugin.scrape();
                const ms = Date.now() - start;
                logger.info(`${plugin.source} scraper complete: ${evts.length} events in ${ms}ms`);
                return { source: plugin.source, events: evts, durationMs: ms };
            } catch (err: any) {
                logger.error(`${plugin.source} scraper failed: ${err.message}`);
                throw { source: plugin.source, error: err.message, durationMs: Date.now() - start };
            }
        })
    );

    for (const result of results) {
        if (result.status === "fulfilled") {
            allEvents.push(...result.value.events);
            const s = result.value.source;
            const existing = statsMap.get(s);
            if (existing) {
                existing.found += result.value.events.length;
                existing.durationMs += result.value.durationMs;
            } else {
                statsMap.set(s, { source: s, found: result.value.events.length, errors: 0, durationMs: result.value.durationMs });
            }
        } else {
            const err = result.reason as any;
            const s = err.source || "unknown";
            const existing = statsMap.get(s);
            if (existing) {
                existing.errors += 1;
            } else {
                statsMap.set(s, { source: s, found: 0, errors: 1, durationMs: err.durationMs || 0 });
            }
        }
    }

    return { events: allEvents, stats: Array.from(statsMap.values()) };
}