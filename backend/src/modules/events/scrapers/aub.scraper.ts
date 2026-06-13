import { logger } from "../../../core/logger/logger";
import { ScrapedEvent } from "../event.types";
import { playwrightPageText, isValidEventTitle, isTechRelevant, categorizeEvent, extractTags } from "./scraper.helpers";

export async function scrapeAUB(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    try {
        const text = await playwrightPageText("https://www.aub.edu.lb/Events/Pages/default.aspx", 6000);
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

        let cur: { title: string; desc: string; loc: string; start: string; end: string; cat: string } | null = null;

        for (const line of lines) {
            if (line.startsWith("START")) {
                if (cur && cur.title && isValidEventTitle(cur.title)) {
                    const id = cur.title.replace(/[^a-z0-9]/gi, "_").substring(0, 80);
                    if (!seenIds.has(id)) {
                        seenIds.add(id);
                        let startDate: Date;
                        try { startDate = new Date(cur.start.replace(/^START\s+/, "").trim()); } catch { startDate = new Date(); }
                        if (startDate >= new Date() && isTechRelevant(cur.title, cur.desc)) {
                            events.push({
                                title: cur.title, description: cur.desc || "AUB university event.",
                                location: cur.loc || "American University of Beirut", startDate,
                                endDate: cur.end ? new Date(cur.end) : null,
                                category: categorizeEvent(cur.title, cur.desc),
                                tags: extractTags(cur.title, cur.desc), imageUrl: "",
                                externalUrl: "https://www.aub.edu.lb/Events/",
                                sourceId: `aub_${id}`, scraperSource: "university",
                                organizer: "American University of Beirut", isFree: true,
                            });
                        }
                    }
                }
                cur = { title: "", desc: "", loc: "", start: line, end: "", cat: "" };
            } else if (cur) {
                if (line.startsWith("END")) cur.end = line.replace(/^END\s+/, "").trim();
                else if (line.startsWith("LOCATION")) cur.loc = line.replace(/^LOCATION\s+/, "").trim();
                else if (line.startsWith("CATEGORY")) cur.cat = line.replace(/^CATEGORY\s+/, "").trim();
                else if (line === "READ MORE" || line.startsWith("Share on")) { /* skip */ }
                else if (!cur.title && line.length > 8 && line.length < 120 
                         && !line.match(/^(Start|End|Location|Category|Share on|READ MORE|About the|Program Overview|Dear |Hello |Hi |To all|Attention|Notice)/i)
                         && isValidEventTitle(line)) 
                    cur.title = line;
                else if (cur.title && !cur.desc && line.length > 15 
                         && !line.match(/^(Share on|READ MORE|Location|Category)/i)) 
                    cur.desc = line.substring(0, 500);
            }
        }

        logger.info(`AUB Events: ${events.length} tech-relevant events`);
    } catch (err: any) {
        logger.warn(`AUB Events scrape failed: ${err.message}`);
    }
    return events;
}
