import { logger } from "../../../core/logger/logger";
import { ScrapedEvent } from "../event.types";
import { playwrightPageText, isValidEventTitle, isTechRelevant, categorizeEvent, extractTags } from "./scraper.helpers";

export async function scrapeZakaAI(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    try {
        const text = await playwrightPageText("https://zaka.ai/events/", 6000);
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

        let currentTitle = "";
        let currentDesc = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\*\*/) || line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+/)) {
                currentTitle = "";
                currentDesc = "";

                let eventDate: Date | null = null;
                const dateMatch = line.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)/i);
                if (dateMatch) {
                    const monthStr = dateMatch[1];
                    const day = parseInt(dateMatch[2]);
                    const months: Record<string, number> = {
                        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
                        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
                    };
                    const month = months[monthStr.toLowerCase()];
                    if (month !== undefined) {
                        eventDate = new Date(new Date().getFullYear(), month, day);
                        if (eventDate < new Date()) {
                            eventDate = new Date(new Date().getFullYear() + 1, month, day);
                        }
                    }
                }

                for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                    const nextLine = lines[j];
                    if (nextLine.startsWith("####")) {
                        currentTitle = nextLine.replace(/^####\s*/, "").trim();
                        break;
                    }
                    if (nextLine.startsWith("#")) {
                        currentTitle = nextLine.replace(/^#+\s*/, "").trim();
                        break;
                    }
                }

                for (let j = i + 2; j < Math.min(i + 8, lines.length); j++) {
                    const nextLine = lines[j];
                    if (nextLine.length > 30 && !nextLine.startsWith("#") && !nextLine.startsWith("http") && !nextLine.match(/^\d+:\d+/)) {
                        currentDesc = nextLine.substring(0, 300);
                        break;
                    }
                }

                if (currentTitle && eventDate && eventDate >= new Date() && isValidEventTitle(currentTitle) && isTechRelevant(currentTitle)) {
                    const id = `zaka_${currentTitle.replace(/[^a-z0-9]/gi, "_")}`.substring(0, 80);
                    if (!seenIds.has(id)) {
                        seenIds.add(id);
                        events.push({
                            title: currentTitle,
                            description: currentDesc || "AI training and certification event from Zaka AI.",
                            location: "Online",
                            startDate: eventDate,
                            endDate: null,
                            category: categorizeEvent(currentTitle, currentDesc),
                            tags: extractTags(currentTitle, currentDesc),
                            imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
                            externalUrl: "https://zaka.ai/events/",
                            sourceId: id,
                            scraperSource: "zaka",
                            organizer: "Zaka AI",
                            isFree: false,
                        });
                    }
                }
            }
        }

        logger.info(`Zaka AI: ${events.length} events found`);
    } catch (err: any) {
        logger.warn(`Zaka AI scrape failed: ${err.message}`);
    }
    return events;
}
