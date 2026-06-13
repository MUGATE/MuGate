import { chromium, Browser } from "playwright";
import { logger } from "../../../core/logger/logger";
import { ScrapedEvent } from "../event.types";
import { isValidEventTitle, isTechRelevant, categorizeEvent, extractTags } from "./scraper.helpers";

export async function scrapeEventbrite(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    const searchUrls = [
        "https://www.eventbrite.com/d/lebanon/tech--events/",
        "https://www.eventbrite.com/d/lebanon/ai--events/",
        "https://www.eventbrite.com/d/online/tech--events/",
        "https://www.eventbrite.com/d/lebanon/workshop--events/",
    ];

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        });

        for (const searchUrl of searchUrls) {
            try {
                const page = await context.newPage();
                await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
                await page.waitForTimeout(3000);

                const pageEvents = await page.evaluate(() => {
                    const results: Array<{
                        title: string; url: string; date: string;
                        location: string; imageUrl: string; eventId: string;
                    }> = [];
                    const processed = new Set<string>();

                    try {
                        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                        scripts.forEach((script) => {
                            const data = JSON.parse(script.textContent || "{}");
                            const items = Array.isArray(data) ? data : [data];
                            items.forEach((item: any) => {
                                if (item["@type"] === "Event") {
                                    const id = item.url?.match(/tickets?-(\d+)/)?.[1] || "";
                                    if (id && !processed.has(id)) {
                                        processed.add(id);
                                        results.push({
                                            title: item.name || "",
                                            url: item.url || "",
                                            date: item.startDate || "",
                                            location: item.location?.name || item.location?.address?.addressLocality || "",
                                            imageUrl: item.image?.url || item.image || "",
                                            eventId: id,
                                        });
                                    }
                                }
                            });
                        });
                    } catch { /* ignore */ }

                    if (results.length === 0) {
                        const links = document.querySelectorAll('a[href*="/e/"]');
                        links.forEach((link) => {
                            const href = (link as HTMLAnchorElement).href;
                            if (!href || processed.has(href)) return;
                            const idMatch = href.match(/tickets?-(\d+)/);
                            if (!idMatch) return;
                            const eventId = idMatch[1];
                            if (processed.has(eventId)) return;
                            processed.add(href);
                            processed.add(eventId);
                            const title = link.textContent?.trim() || "";
                            if (title.length < 3) return;
                            results.push({ title, url: href, date: "", location: "Lebanon", imageUrl: "", eventId });
                        });
                    }

                    return results;
                });

                for (const pe of pageEvents) {
                    if (seenIds.has(pe.eventId)) continue;
                    seenIds.add(pe.eventId);
                    if (!isValidEventTitle(pe.title)) continue;
                    if (!isTechRelevant(pe.title)) continue;
                    let startDate: Date;
                    try { startDate = new Date(pe.date); } catch { startDate = new Date(); }
                    if (isNaN(startDate.getTime()) || startDate < new Date()) continue;
                    events.push({
                        title: pe.title, description: "",
                        location: pe.location || "Lebanon", startDate,
                        endDate: null, category: categorizeEvent(pe.title, ""),
                        tags: extractTags(pe.title, ""), imageUrl: pe.imageUrl,
                        externalUrl: pe.url, sourceId: `eb_${pe.eventId}`,
                        scraperSource: "eventbrite", organizer: "", isFree: false,
                    });
                }

                await page.close();
                logger.info(`Eventbrite: ${pageEvents.length} raw from ${searchUrl}`);
            } catch (err: any) {
                logger.warn(`Eventbrite error ${searchUrl}: ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        await context.close();
    } catch (err: any) {
        logger.error(`Eventbrite browser error: ${err.message}`);
    } finally {
        if (browser) await browser.close();
    }

    logger.info(`Eventbrite total: ${events.length} tech events`);
    return events;
}
