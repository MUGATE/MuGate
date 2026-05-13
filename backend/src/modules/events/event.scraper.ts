import { chromium, Browser, Page } from "playwright";
import { logger } from "../../core/logger/logger";
import { ScrapedEvent, EventCategory, CATEGORY_KEYWORDS, ScraperSource } from "./event.types";

// ─── Auto-Categorization ─────────────────────────────────

/**
 * Determine the best category for an event based on title + description keywords.
 */
function categorizeEvent(title: string, description: string): EventCategory {
    const text = `${title} ${description}`.toLowerCase();

    // Check each category's keywords (order matters — more specific first)
    const orderedCategories: EventCategory[] = [
        "hackathon", "competition", "workshop", "conference", "talk", "meetup", "social"
    ];

    for (const cat of orderedCategories) {
        const keywords = CATEGORY_KEYWORDS[cat];
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                return cat;
            }
        }
    }
    return "other";
}

/**
 * Extract tags from event title and description.
 */
function extractTags(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    const tagKeywords = [
        "ai", "machine learning", "web development", "cybersecurity", "blockchain",
        "startup", "entrepreneurship", "design", "ux", "ui", "data science",
        "cloud", "devops", "mobile", "ios", "android", "python", "javascript",
        "react", "node", "networking", "career", "internship", "coding",
        "programming", "tech", "digital", "innovation", "open source",
        "gaming", "robotics", "iot", "fintech", "healthtech", "edtech",
    ];

    const found = tagKeywords.filter(tag => text.includes(tag));
    return found.join(", ");
}

/**
 * Check if an event title is tech-related.
 * Filters out random non-tech events (pizza parties, social dinners, etc.)
 */
function isTechRelevant(title: string, description: string = ""): boolean {
    const text = `${title} ${description}`.toLowerCase();

    // Must match at least one tech keyword
    const techKeywords = [
        "tech", "code", "coding", "programming", "developer", "software",
        "hackathon", "hack", "startup", "ai", "artificial intelligence",
        "machine learning", "data", "cloud", "devops", "web", "app",
        "cyber", "security", "blockchain", "crypto", "design", "ux", "ui",
        "workshop", "bootcamp", "seminar", "conference", "summit",
        "innovation", "digital", "robotics", "iot", "fintech",
        "python", "javascript", "react", "node", "java", "api",
        "database", "frontend", "backend", "fullstack", "full-stack",
        "networking", "career", "internship", "computer", "science",
        "engineering", "entrepreneur", "pitch", "demo day",
        "open source", "linux", "git", "agile", "scrum",
        "product", "saas", "edtech", "healthtech", "leetcode",
        "algorithm", "competition", "icpc", "acm",
    ];

    // Blocklist — skip obviously non-tech events
    const blockWords = [
        "pizza party", "bbq", "barbecue", "brunch", "dinner party",
        "yoga", "meditation", "church", "prayer", "bible",
        "wedding", "birthday", "baby shower", "funeral",
        "karaoke", "nightclub", "bar crawl", "pub quiz",
        "cooking class", "bake sale", "potluck",
    ];

    for (const block of blockWords) {
        if (text.includes(block)) return false;
    }

    for (const keyword of techKeywords) {
        if (text.includes(keyword)) return true;
    }

    return false;
}

// ─── Eventbrite Scraper ───────────────────────────────────

/**
 * Scrape free events from Eventbrite Lebanon using Playwright.
 * Searches multiple categories to maximize coverage.
 */
async function scrapeEventbrite(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    // Multiple search URLs to cover different event types
    const searchUrls = [
        "https://www.eventbrite.com/d/lebanon/free--events/?page=1",
        "https://www.eventbrite.com/d/lebanon/free--science-and-tech--events/?page=1",
        "https://www.eventbrite.com/d/lebanon/free--business--events/?page=1",
        "https://www.eventbrite.com/d/lebanon/free--community--events/?page=1",
    ];

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        for (const searchUrl of searchUrls) {
            try {
                const page = await context.newPage();
                await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

                // Wait for event cards to load
                await page.waitForTimeout(3000);

                // Extract event data from the page using structured data or DOM parsing
                const pageEvents = await page.evaluate(() => {
                    const results: Array<{
                        title: string;
                        url: string;
                        date: string;
                        location: string;
                        imageUrl: string;
                        eventId: string;
                    }> = [];

                    // Try to find event cards — Eventbrite uses various selectors
                    // Method 1: Look for anchor tags with event URLs
                    const links = document.querySelectorAll('a[href*="/e/"]');
                    const processedUrls = new Set<string>();

                    links.forEach((link) => {
                        const href = (link as HTMLAnchorElement).href;
                        if (!href || processedUrls.has(href)) return;

                        // Extract event ID from URL (e.g., "event-name-tickets-1234567890")
                        const idMatch = href.match(/tickets?-(\d+)/);
                        if (!idMatch) return;

                        const eventId = idMatch[1];
                        if (processedUrls.has(eventId)) return;
                        processedUrls.add(href);
                        processedUrls.add(eventId);

                        // Find the closest card container
                        const card = link.closest('[class*="event"]') || link.closest('[class*="card"]') || link.parentElement?.parentElement;

                        // Extract title from the link text or nearby heading
                        let title = "";
                        const heading = card?.querySelector("h2, h3, [class*='title']");
                        if (heading) {
                            title = heading.textContent?.trim() || "";
                        }
                        if (!title) {
                            title = link.textContent?.trim() || "";
                        }

                        // Skip if no meaningful title
                        if (!title || title.length < 3) return;

                        // Extract date text
                        let date = "";
                        const dateEl = card?.querySelector("[class*='date'], [class*='time'], time, p");
                        if (dateEl) {
                            date = dateEl.textContent?.trim() || "";
                        }

                        // Extract location
                        let location = "";
                        const allText = card?.textContent || "";
                        // Look for location patterns like "City · Venue"
                        const locMatch = allText.match(/([A-Za-z\s]+)\s*·\s*([A-Za-z\s]+)/);
                        if (locMatch) {
                            location = `${locMatch[1].trim()}, ${locMatch[2].trim()}`;
                        }

                        // Extract image
                        let imageUrl = "";
                        const img = card?.querySelector("img");
                        if (img) {
                            imageUrl = img.src || img.getAttribute("data-src") || "";
                        }

                        results.push({
                            title,
                            url: href,
                            date,
                            location: location || "Lebanon",
                            imageUrl,
                            eventId,
                        });
                    });

                    return results;
                });

                // Process extracted events
                for (const pe of pageEvents) {
                    if (seenIds.has(pe.eventId)) continue;
                    seenIds.add(pe.eventId);

                    // Parse date string (e.g., "Wed, Jun 17, 10:00 AM")
                    let startDate: Date;
                    try {
                        startDate = parseEventbriteDate(pe.date);
                    } catch {
                        startDate = new Date(); // Fallback to now if unparseable
                    }

                    // Skip past events
                    if (startDate < new Date()) continue;

                    const category = categorizeEvent(pe.title, "");
                    const tags = extractTags(pe.title, "");

                    events.push({
                        title: pe.title,
                        description: "", // We'd need to visit individual pages for full descriptions
                        location: pe.location,
                        startDate,
                        endDate: null,
                        category,
                        tags,
                        imageUrl: pe.imageUrl,
                        externalUrl: pe.url,
                        sourceId: `eb_${pe.eventId}`,
                        scraperSource: "eventbrite",
                        organizer: "",
                        isFree: true,
                    });
                }

                await page.close();
                logger.info(`Eventbrite: Found ${pageEvents.length} events from ${searchUrl}`);

            } catch (err: any) {
                logger.warn(`Eventbrite scrape failed for ${searchUrl}: ${err.message}`);
            }

            // Respectful delay between requests
            await new Promise(r => setTimeout(r, 2000));
        }

        await context.close();
    } catch (err: any) {
        logger.error(`Eventbrite browser launch failed: ${err.message}`);
    } finally {
        if (browser) await browser.close();
    }

    logger.info(`Eventbrite scraper total: ${events.length} unique events found`);
    return events;
}

/**
 * Parse Eventbrite date strings like "Wed, Jun 17, 10:00 AM" or "Sat, May 23, 8:00 AM"
 */
function parseEventbriteDate(dateStr: string): Date {
    if (!dateStr || dateStr.trim().length === 0) {
        throw new Error("Empty date string");
    }

    const cleaned = dateStr.trim();

    // Try native Date parsing first
    const attempt = new Date(cleaned);
    if (!isNaN(attempt.getTime()) && attempt.getFullYear() >= 2024) {
        return attempt;
    }

    // Manual parsing for "Day, Mon DD, HH:MM AM/PM" format
    const match = cleaned.match(/\w+,\s+(\w+)\s+(\d+),?\s*(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
        const [, month, day, hour, minute, ampm] = match;
        const monthMap: Record<string, number> = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };

        const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
        if (monthNum === undefined) throw new Error(`Unknown month: ${month}`);

        let h = parseInt(hour, 10);
        const m = parseInt(minute, 10);

        if (ampm) {
            if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
            if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
        }

        // Determine year: if the date has already passed this year, use next year
        const now = new Date();
        let year = now.getFullYear();
        const candidate = new Date(year, monthNum, parseInt(day, 10), h, m);
        if (candidate < now) {
            year++;
        }

        return new Date(year, monthNum, parseInt(day, 10), h, m);
    }

    throw new Error(`Unparseable date: ${dateStr}`);
}

// ─── Facebook Events Scraper ──────────────────────────────

/**
 * Scrape public events from Facebook Events search for Lebanon/Beirut.
 * Uses Playwright to render the JS-heavy page.
 */
async function scrapeFacebook(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    const searchUrls = [
        "https://www.facebook.com/events/search/?q=tech%20beirut",
        "https://www.facebook.com/events/search/?q=workshop%20lebanon",
        "https://www.facebook.com/events/search/?q=hackathon%20beirut",
        "https://www.facebook.com/events/search/?q=coding%20lebanon",
    ];

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale: "en-US",
        });

        for (const searchUrl of searchUrls) {
            try {
                const page = await context.newPage();
                await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
                await page.waitForTimeout(4000);

                // Scroll down to load more events
                await page.evaluate(() => window.scrollBy(0, 2000));
                await page.waitForTimeout(2000);

                const pageEvents = await page.evaluate(() => {
                    const results: Array<{
                        title: string;
                        url: string;
                        date: string;
                        location: string;
                        imageUrl: string;
                        eventId: string;
                    }> = [];

                    // Facebook event links contain /events/ in their href
                    const links = document.querySelectorAll('a[href*="/events/"]');
                    const processedIds = new Set<string>();

                    links.forEach((link) => {
                        const href = (link as HTMLAnchorElement).href;
                        if (!href) return;

                        // Extract event ID from URL like /events/123456789/
                        const idMatch = href.match(/\/events\/(\d+)/);
                        if (!idMatch) return;

                        const eventId = idMatch[1];
                        if (processedIds.has(eventId)) return;
                        processedIds.add(eventId);

                        // Walk up to find the event card container
                        const card = link.closest('[role="article"]') || link.closest('div[class]')?.parentElement?.parentElement;
                        if (!card) return;

                        const cardText = card.textContent || "";

                        // Extract title — usually the link text or a heading inside the card
                        let title = "";
                        const heading = card.querySelector('span[dir="auto"], [role="heading"]');
                        if (heading) {
                            title = heading.textContent?.trim() || "";
                        }
                        if (!title) {
                            title = link.textContent?.trim() || "";
                        }
                        if (!title || title.length < 5) return;

                        // Extract date — look for date-like patterns in card text
                        let date = "";
                        const datePatterns = cardText.match(/(\w{3},\s+\w{3}\s+\d{1,2}(?:,\s+\d{4})?(?:\s+AT\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/i);
                        if (datePatterns) {
                            date = datePatterns[1];
                        }

                        // Extract location from card text
                        let location = "";
                        // Facebook often shows location after the date
                        const locPatterns = cardText.match(/(?:at|@|·)\s*([A-Za-z][A-Za-z\s,.-]{3,50})/i);
                        if (locPatterns) {
                            location = locPatterns[1].trim();
                        }

                        // Extract image
                        let imageUrl = "";
                        const img = card.querySelector('img[src*="scontent"], img[src*="fbcdn"]');
                        if (img) {
                            imageUrl = (img as HTMLImageElement).src || "";
                        }

                        results.push({
                            title: title.substring(0, 200),
                            url: `https://www.facebook.com/events/${eventId}/`,
                            date,
                            location: location || "Beirut, Lebanon",
                            imageUrl,
                            eventId,
                        });
                    });

                    return results;
                });

                for (const pe of pageEvents) {
                    if (seenIds.has(pe.eventId)) continue;
                    seenIds.add(pe.eventId);

                    // Skip non-tech events (pizza parties, random social events)
                    if (!isTechRelevant(pe.title)) {
                        logger.debug(`Facebook: Skipped non-tech event: "${pe.title}"`);
                        continue;
                    }

                    let startDate: Date;
                    try {
                        startDate = parseFacebookDate(pe.date);
                    } catch {
                        // Skip events with unparseable dates instead of guessing
                        logger.debug(`Facebook: Skipped event with bad date: "${pe.title}" date="${pe.date}"`);
                        continue;
                    }

                    if (startDate < new Date()) continue;

                    const category = categorizeEvent(pe.title, "");
                    const tags = extractTags(pe.title, "");

                    events.push({
                        title: pe.title,
                        description: "",
                        location: pe.location,
                        startDate,
                        endDate: null,
                        category,
                        tags,
                        imageUrl: pe.imageUrl,
                        externalUrl: pe.url,
                        sourceId: `fb_${pe.eventId}`,
                        scraperSource: "facebook",
                        organizer: "",
                        isFree: true,
                    });
                }

                await page.close();
                logger.info(`Facebook: Found ${pageEvents.length} raw events, kept ${events.length} tech-relevant from search`);
            } catch (err: any) {
                logger.warn(`Facebook scrape failed for ${searchUrl}: ${err.message}`);
            }

            await new Promise(r => setTimeout(r, 3000));
        }

        await context.close();
    } catch (err: any) {
        logger.error(`Facebook browser launch failed: ${err.message}`);
    } finally {
        if (browser) await browser.close();
    }

    logger.info(`Facebook scraper total: ${events.length} unique events found`);
    return events;
}

/**
 * Parse Facebook date strings like "SAT, JUN 28 AT 10:00 AM" or "Sat, Jun 28, 2025"
 */
function parseFacebookDate(dateStr: string): Date {
    if (!dateStr || dateStr.trim().length === 0) {
        throw new Error("Empty date string");
    }

    const cleaned = dateStr.trim().replace(/\s+AT\s+/i, " ");

    // Try native parsing
    const attempt = new Date(cleaned);
    if (!isNaN(attempt.getTime()) && attempt.getFullYear() >= 2024) {
        return attempt;
    }

    // Manual: "DAY, MON DD HH:MM AM/PM" or "DAY, MON DD, YYYY"
    const match = cleaned.match(/(\w+),?\s+(\w+)\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
    if (match) {
        const [, , month, day, year, hour, minute, ampm] = match;
        const monthMap: Record<string, number> = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };

        const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
        if (monthNum === undefined) throw new Error(`Unknown month: ${month}`);

        let h = hour ? parseInt(hour, 10) : 10;
        const m = minute ? parseInt(minute, 10) : 0;

        if (ampm) {
            if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
            if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
        }

        const now = new Date();
        let y = year ? parseInt(year, 10) : now.getFullYear();
        const candidate = new Date(y, monthNum, parseInt(day, 10), h, m);
        if (!year && candidate < now) y++;

        return new Date(y, monthNum, parseInt(day, 10), h, m);
    }

    throw new Error(`Unparseable Facebook date: ${dateStr}`);
}

// ─── LinkedIn Events Scraper ──────────────────────────────

/**
 * Scrape public events from LinkedIn Events search.
 * LinkedIn's public events page doesn't require login.
 */
async function scrapeLinkedin(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    const searchUrls = [
        "https://www.linkedin.com/search/results/events/?keywords=tech%20beirut&origin=SWITCH_SEARCH_VERTICAL",
        "https://www.linkedin.com/search/results/events/?keywords=lebanon%20workshop&origin=SWITCH_SEARCH_VERTICAL",
        "https://www.linkedin.com/search/results/events/?keywords=beirut%20coding&origin=SWITCH_SEARCH_VERTICAL",
    ];

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        for (const searchUrl of searchUrls) {
            try {
                const page = await context.newPage();
                await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
                await page.waitForTimeout(4000);

                const pageEvents = await page.evaluate(() => {
                    const results: Array<{
                        title: string;
                        url: string;
                        date: string;
                        location: string;
                        imageUrl: string;
                        eventId: string;
                    }> = [];

                    // LinkedIn event cards in search results
                    const cards = document.querySelectorAll('[data-chameleon-result-urn], .reusable-search__result-container, .search-results-container li');

                    cards.forEach((card) => {
                        // Find event link
                        const linkEl = card.querySelector('a[href*="/events/"]') as HTMLAnchorElement;
                        if (!linkEl) return;

                        const href = linkEl.href;
                        const idMatch = href.match(/\/events\/(\d+)/);
                        if (!idMatch) return;

                        const eventId = idMatch[1];

                        // Title
                        let title = "";
                        const titleEl = card.querySelector('.entity-result__title-text a span[dir="ltr"], .entity-result__title-text span, [class*="title"] span');
                        if (titleEl) {
                            title = titleEl.textContent?.trim() || "";
                        }
                        if (!title) {
                            title = linkEl.textContent?.trim() || "";
                        }
                        if (!title || title.length < 3) return;

                        // Date — LinkedIn shows "Date · Location" pattern
                        let date = "";
                        let location = "";
                        const metaEl = card.querySelector('.entity-result__primary-subtitle, [class*="subtitle"]');
                        if (metaEl) {
                            const metaText = metaEl.textContent?.trim() || "";
                            const parts = metaText.split("·").map(s => s.trim());
                            if (parts.length >= 1) date = parts[0];
                            if (parts.length >= 2) location = parts[1];
                        }

                        // Image
                        let imageUrl = "";
                        const img = card.querySelector('img');
                        if (img) {
                            imageUrl = img.src || "";
                        }

                        results.push({
                            title: title.substring(0, 200),
                            url: `https://www.linkedin.com/events/${eventId}/`,
                            date,
                            location: location || "Lebanon",
                            imageUrl,
                            eventId,
                        });
                    });

                    return results;
                });

                for (const pe of pageEvents) {
                    if (seenIds.has(pe.eventId)) continue;
                    seenIds.add(pe.eventId);

                    let startDate: Date;
                    try {
                        startDate = parseLinkedinDate(pe.date);
                    } catch {
                        startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                    }

                    if (startDate < new Date()) continue;

                    const category = categorizeEvent(pe.title, "");
                    const tags = extractTags(pe.title, "");

                    events.push({
                        title: pe.title,
                        description: "",
                        location: pe.location,
                        startDate,
                        endDate: null,
                        category,
                        tags,
                        imageUrl: pe.imageUrl,
                        externalUrl: pe.url,
                        sourceId: `li_${pe.eventId}`,
                        scraperSource: "linkedin",
                        organizer: "",
                        isFree: true,
                    });
                }

                await page.close();
                logger.info(`LinkedIn: Found ${pageEvents.length} events from search`);
            } catch (err: any) {
                logger.warn(`LinkedIn scrape failed for ${searchUrl}: ${err.message}`);
            }

            await new Promise(r => setTimeout(r, 3000));
        }

        await context.close();
    } catch (err: any) {
        logger.error(`LinkedIn browser launch failed: ${err.message}`);
    } finally {
        if (browser) await browser.close();
    }

    logger.info(`LinkedIn scraper total: ${events.length} unique events found`);
    return events;
}

/**
 * Parse LinkedIn date strings like "Thu, Jul 3, 2025, 6:00 PM" or "Jul 3, 2025"
 */
function parseLinkedinDate(dateStr: string): Date {
    if (!dateStr || dateStr.trim().length === 0) {
        throw new Error("Empty date string");
    }

    const cleaned = dateStr.trim();

    // Try native parsing
    const attempt = new Date(cleaned);
    if (!isNaN(attempt.getTime()) && attempt.getFullYear() >= 2024) {
        return attempt;
    }

    // Manual: "DAY, MON DD, YYYY, HH:MM AM/PM" or "MON DD, YYYY"
    const match = cleaned.match(/(?:\w+,\s+)?(\w+)\s+(\d{1,2}),?\s*(\d{4})?(?:,?\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
    if (match) {
        const [, month, day, year, hour, minute, ampm] = match;
        const monthMap: Record<string, number> = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };

        const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
        if (monthNum === undefined) throw new Error(`Unknown month: ${month}`);

        let h = hour ? parseInt(hour, 10) : 10;
        const m = minute ? parseInt(minute, 10) : 0;

        if (ampm) {
            if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
            if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
        }

        const now = new Date();
        let y = year ? parseInt(year, 10) : now.getFullYear();
        const candidate = new Date(y, monthNum, parseInt(day, 10), h, m);
        if (!year && candidate < now) y++;

        return new Date(y, monthNum, parseInt(day, 10), h, m);
    }

    throw new Error(`Unparseable LinkedIn date: ${dateStr}`);
}

// ─── Meetup Scraper ───────────────────────────────────────

/**
 * Scrape public events from Meetup.com for Beirut/Lebanon.
 * Meetup's search page is publicly accessible.
 */
async function scrapeMeetup(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    const searchUrls = [
        "https://www.meetup.com/find/?location=lb--Beirut&source=EVENTS&eventType=inPerson&sortField=DATETIME",
        "https://www.meetup.com/find/?keywords=tech&location=lb--Beirut&source=EVENTS&sortField=DATETIME",
        "https://www.meetup.com/find/?keywords=coding&location=lb--Beirut&source=EVENTS&sortField=DATETIME",
    ];

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        for (const searchUrl of searchUrls) {
            try {
                const page = await context.newPage();
                await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
                await page.waitForTimeout(4000);

                // Scroll to load more
                await page.evaluate(() => window.scrollBy(0, 3000));
                await page.waitForTimeout(2000);

                const pageEvents = await page.evaluate(() => {
                    const results: Array<{
                        title: string;
                        url: string;
                        date: string;
                        location: string;
                        imageUrl: string;
                        eventId: string;
                        groupName: string;
                    }> = [];

                    // Meetup event cards — look for event links
                    const links = document.querySelectorAll('a[href*="/events/"]');
                    const processedIds = new Set<string>();

                    links.forEach((link) => {
                        const href = (link as HTMLAnchorElement).href;
                        if (!href || !href.includes("meetup.com")) return;

                        // Extract event ID: /group-name/events/12345/
                        const idMatch = href.match(/\/events\/(\d+)/);
                        if (!idMatch) return;

                        const eventId = idMatch[1];
                        if (processedIds.has(eventId)) return;
                        processedIds.add(eventId);

                        // Find card container
                        const card = link.closest('[data-testid], [class*="eventCard"], [id*="event"]') || link.parentElement?.parentElement?.parentElement;
                        if (!card) return;

                        // Title
                        let title = "";
                        const titleEl = card.querySelector('h2, h3, [class*="title"], [data-testid*="title"]');
                        if (titleEl) {
                            title = titleEl.textContent?.trim() || "";
                        }
                        if (!title) {
                            title = link.textContent?.trim() || "";
                        }
                        if (!title || title.length < 3) return;

                        // Date
                        let date = "";
                        const timeEl = card.querySelector('time, [datetime], [class*="date"], [class*="time"]');
                        if (timeEl) {
                            date = timeEl.getAttribute("datetime") || timeEl.textContent?.trim() || "";
                        }

                        // Location
                        let location = "";
                        const locEl = card.querySelector('[class*="location"], [class*="venue"]');
                        if (locEl) {
                            location = locEl.textContent?.trim() || "";
                        }

                        // Group name (organizer)
                        let groupName = "";
                        const groupMatch = href.match(/meetup\.com\/([^\/]+)\/events/);
                        if (groupMatch) {
                            groupName = groupMatch[1].replace(/-/g, " ");
                        }

                        // Image
                        let imageUrl = "";
                        const img = card.querySelector('img[src*="secure"], img[src*="meetup"]');
                        if (img) {
                            imageUrl = (img as HTMLImageElement).src || "";
                        }

                        results.push({
                            title: title.substring(0, 200),
                            url: href,
                            date,
                            location: location || "Beirut, Lebanon",
                            imageUrl,
                            eventId,
                            groupName,
                        });
                    });

                    return results;
                });

                for (const pe of pageEvents) {
                    if (seenIds.has(pe.eventId)) continue;
                    seenIds.add(pe.eventId);

                    let startDate: Date;
                    try {
                        // Meetup often provides ISO datetime in the `datetime` attribute
                        startDate = new Date(pe.date);
                        if (isNaN(startDate.getTime()) || startDate.getFullYear() < 2024) {
                            startDate = parseEventbriteDate(pe.date); // Reuse generic parser
                        }
                    } catch {
                        startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                    }

                    if (startDate < new Date()) continue;

                    const category = categorizeEvent(pe.title, pe.groupName);
                    const tags = extractTags(pe.title, pe.groupName);

                    events.push({
                        title: pe.title,
                        description: "",
                        location: pe.location,
                        startDate,
                        endDate: null,
                        category,
                        tags,
                        imageUrl: pe.imageUrl,
                        externalUrl: pe.url,
                        sourceId: `mu_${pe.eventId}`,
                        scraperSource: "meetup",
                        organizer: pe.groupName,
                        isFree: true,
                    });
                }

                await page.close();
                logger.info(`Meetup: Found ${pageEvents.length} events from search`);
            } catch (err: any) {
                logger.warn(`Meetup scrape failed for ${searchUrl}: ${err.message}`);
            }

            await new Promise(r => setTimeout(r, 3000));
        }

        await context.close();
    } catch (err: any) {
        logger.error(`Meetup browser launch failed: ${err.message}`);
    } finally {
        if (browser) await browser.close();
    }

    logger.info(`Meetup scraper total: ${events.length} unique events found`);
    return events;
}

// ─── Scraper Orchestrator ─────────────────────────────────

export interface ScraperPlugin {
    source: ScraperSource;
    scrape: () => Promise<ScrapedEvent[]>;
}

/**
 * Registry of all available scrapers.
 * Add new sources here — just implement `scrape()` returning `ScrapedEvent[]`.
 */
export const SCRAPER_PLUGINS: ScraperPlugin[] = [
    { source: "eventbrite", scrape: scrapeEventbrite },
    { source: "meetup",     scrape: scrapeMeetup },
    // Facebook & LinkedIn require auth — disabled to avoid scraping random/irrelevant content
    // { source: "facebook",   scrape: scrapeFacebook },
    // { source: "linkedin",   scrape: scrapeLinkedin },
];

/**
 * Run all registered scrapers and return combined results.
 */
export async function runAllScrapers(): Promise<{
    events: ScrapedEvent[];
    stats: { source: ScraperSource; found: number; errors: number; durationMs: number }[];
}> {
    const allEvents: ScrapedEvent[] = [];
    const stats: { source: ScraperSource; found: number; errors: number; durationMs: number }[] = [];

    // Run scrapers in parallel for speed
    const results = await Promise.allSettled(
        SCRAPER_PLUGINS.map(async (plugin) => {
            const start = Date.now();
            try {
                logger.info(`Running ${plugin.source} scraper...`);
                const events = await plugin.scrape();
                logger.info(`${plugin.source} scraper complete: ${events.length} events in ${Date.now() - start}ms`);
                return { source: plugin.source, events, durationMs: Date.now() - start };
            } catch (err: any) {
                logger.error(`${plugin.source} scraper failed: ${err.message}`);
                throw { source: plugin.source, error: err.message, durationMs: Date.now() - start };
            }
        })
    );

    for (const result of results) {
        if (result.status === "fulfilled") {
            allEvents.push(...result.value.events);
            stats.push({
                source: result.value.source,
                found: result.value.events.length,
                errors: 0,
                durationMs: result.value.durationMs,
            });
        } else {
            const err = result.reason as any;
            stats.push({
                source: err.source || "unknown",
                found: 0,
                errors: 1,
                durationMs: err.durationMs || 0,
            });
        }
    }

    return { events: allEvents, stats };
}