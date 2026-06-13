import { logger } from "../../../core/logger/logger";
import { ScrapedEvent } from "../event.types";
import { playwrightPageText, isValidEventTitle, isTechRelevant, categorizeEvent, extractTags } from "./scraper.helpers";

export async function scrapeBerytech(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    try {
        const text = await playwrightPageText("https://berytech.org/events/", 5000);
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

        let inEvents = false;
        let buf: { title: string; date: string; loc: string; desc: string } | null = null;

        for (const line of lines) {
            if (line.includes("Upcoming events") || line.includes("Upcoming Events")) {
                inEvents = true;
                continue;
            }
            if (line.includes("Past Events") || line.includes("QUICK LINKS") || line.includes("GET IN TOUCH")) {
                inEvents = false;
                if (buf && buf.title && buf.date) {
                    const id = buf.title.replace(/[^a-z0-9]/gi, "_");
                    if (!seenIds.has(id)) {
                        seenIds.add(id);
                        let startDate: Date;
                        try { startDate = new Date(buf.date); } catch { startDate = new Date(); }
                        if (startDate >= new Date() && isValidEventTitle(buf.title) && isTechRelevant(buf.title, buf.desc)) {
                            events.push({
                                title: buf.title, description: buf.desc,
                                location: buf.loc || "Beirut, Lebanon", startDate,
                                endDate: null, category: categorizeEvent(buf.title, buf.desc),
                                tags: extractTags(buf.title, buf.desc), imageUrl: "",
                                externalUrl: "https://berytech.org/events/",
                                sourceId: `berytech_${id}`, scraperSource: "university",
                                organizer: "Berytech", isFree: true,
                            });
                        }
                    }
                }
                buf = null;
                continue;
            }
            if (!inEvents) continue;

            const isDate = line.match(/([A-Z][a-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
            const isAction = line.includes("BOOK NOW") || line.includes("Subscribe") || line.includes("ASK US");

            if (isDate && buf && !buf.date) buf.date = line;
            else if (isDate && !buf) buf = { title: "", date: line, loc: "", desc: "" };
            else if (buf && !buf.title && line.length > 8 && line.length < 150 && !isAction 
                     && !line.includes(":") && !line.match(/^(Skip|About|Book|Subscribe|Ask|Read|Contact|Follow|Search)/i)) 
                buf.title = line;
            else if (buf && buf.title && !buf.loc && line.match(/^[A-Z]/) && line.includes(",") && line.length > 10) buf.loc = line;
            else if (buf && buf.title && buf.date && !buf.desc && line.length > 20 && !isAction) buf.desc = line.substring(0, 500);
        }

        logger.info(`Berytech: ${events.length} tech events`);
    } catch (err: any) {
        logger.warn(`Berytech scrape failed: ${err.message}`);
    }
    return events;
}
