import { logger } from "../../../core/logger/logger";
import { ScrapedEvent } from "../event.types";
import { httpGet, isValidEventTitle, isTechRelevant, categorizeEvent, extractTags } from "./scraper.helpers";

const MONTHS: Record<string, number> = {
    january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
    april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
    august: 7, aug: 7, september: 8, sep: 8, sept: 8,
    october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11,
};

function decodeHtml(s: string): string {
    return s
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&#038;/g, "&")
        .replace(/&ndash;/gi, "–")
        .replace(/&mdash;/gi, "—")
        .replace(/&hellip;/gi, "…")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripTags(s: string): string {
    return decodeHtml(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

/**
 * Prefer year from description ("Jun 29, 2026"), then section header year,
 * otherwise roll the display month/day forward if it already passed.
 */
function parseZakaDate(dateText: string, desc: string, sectionYear: number | null): Date | null {
    const withYear = desc.match(
        /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})\b/i
    );
    if (withYear) {
        const month = MONTHS[withYear[1].toLowerCase()];
        if (month !== undefined) {
            return new Date(parseInt(withYear[3], 10), month, parseInt(withYear[2], 10), 12, 0, 0, 0);
        }
    }

    const noYear = dateText.match(
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\b/i
    );
    if (!noYear) return null;

    const month = MONTHS[noYear[1].toLowerCase()];
    const day = parseInt(noYear[2], 10);
    if (month === undefined) return null;

    if (sectionYear != null) {
        return new Date(sectionYear, month, day, 12, 0, 0, 0);
    }

    const now = new Date();
    let eventDate = new Date(now.getFullYear(), month, day, 12, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setHours(0, 0, 0, 0);
    if (eventDate < cutoff) {
        eventDate = new Date(now.getFullYear() + 1, month, day, 12, 0, 0, 0);
    }
    return eventDate;
}

function sectionYearBefore(html: string, index: number): number | null {
    const monthRe = /<h4 class="zk-events-month">\s*([A-Za-z]+)\s+(\d{4})\s*<\/h4>/gi;
    let year: number | null = null;
    let match: RegExpExecArray | null;
    while ((match = monthRe.exec(html)) !== null) {
        if (match.index > index) break;
        year = parseInt(match[2], 10);
    }
    return year;
}

export async function scrapeZakaAI(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    try {
        const html = await httpGet("https://zaka.ai/events/");
        // Server-rendered WordPress cards: <a class="zk-event-card" href="/event/...">
        const cardRe =
            /<a\b(?=[^>]*\bclass="[^"]*\bzk-event-card\b)(?=[^>]*\bhref="(https:\/\/zaka\.ai\/event\/[^"]+)")[^>]*>[\s\S]*?<\/a>/gi;

        let match: RegExpExecArray | null;
        let parsed = 0;

        while ((match = cardRe.exec(html)) !== null) {
            const href = match[1];
            const card = match[0];
            parsed++;

            const titleMatch = card.match(/<h4 class="zk-event-title">([\s\S]*?)<\/h4>/i);
            const descMatch = card.match(/<p class="zk-event-desc">([\s\S]*?)<\/p>/i);
            const dateMatch = card.match(/<div class="zk-event-date">([\s\S]*?)<\/div>/i);
            const imgMatch = card.match(/<img[^>]+src="([^"]+)"/i);

            const title = titleMatch ? stripTags(titleMatch[1]) : "";
            const description = descMatch ? stripTags(descMatch[1]).substring(0, 300) : "";
            const dateText = dateMatch ? stripTags(dateMatch[1]) : "";
            const imageUrl =
                imgMatch?.[1] ||
                "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop";

            // Past listings sometimes stay in the feed with replay CTAs
            if (/watch the replay|replay available/i.test(`${title} ${description}`)) continue;
            if (!title || !isValidEventTitle(title)) continue;
            if (!isTechRelevant(title, description)) continue;

            const sectionYear = sectionYearBefore(html, match.index);
            const eventDate = parseZakaDate(dateText, description, sectionYear);
            if (!eventDate || eventDate < new Date()) continue;

            const id = `zaka_${title.replace(/[^a-z0-9]/gi, "_")}`.substring(0, 80);
            if (seenIds.has(id)) continue;
            seenIds.add(id);

            const inPerson = /live in person|in[- ]person/i.test(description);

            events.push({
                title,
                description: description || "AI training and certification event from Zaka AI.",
                location: inPerson ? "In Person" : "Online",
                startDate: eventDate,
                endDate: null,
                category: categorizeEvent(title, description),
                tags: extractTags(title, description),
                imageUrl,
                externalUrl: href,
                sourceId: id,
                scraperSource: "zaka",
                organizer: "Zaka AI",
                isFree: /\bfree\b/i.test(description),
            });
        }

        logger.info(`Zaka AI: ${events.length} upcoming events (${parsed} cards on page)`);
    } catch (err: any) {
        logger.warn(`Zaka AI scrape failed: ${err.message}`);
    }
    return events;
}
