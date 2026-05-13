// ─── Event Categories ─────────────────────────────────────

export type EventCategory =
    | "workshop"
    | "hackathon"
    | "competition"
    | "talk"
    | "social"
    | "conference"
    | "meetup"
    | "other";

export const EVENT_CATEGORIES: EventCategory[] = [
    "workshop",
    "hackathon",
    "competition",
    "talk",
    "social",
    "conference",
    "meetup",
    "other",
];

// ─── Event Source ─────────────────────────────────────────

export type EventSource = "scraped" | "manual";
export type ScraperSource = "eventbrite" | "meetup" | "facebook" | "instagram" | "linkedin" | "luma" | "konfhub" | "google" | "university" | "zaka" | "other";

// ─── Event Interface ──────────────────────────────────────

export interface Event {
    id?: number;
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate?: Date | null;
    category: EventCategory;
    tags: string;
    imageUrl: string;
    externalUrl: string;
    source: EventSource;
    sourceId: string;
    scraperSource: ScraperSource;
    organizer: string;
    isFree: boolean;
    isActive: boolean;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// ─── Scraped Event (before DB insertion) ──────────────────

export interface ScrapedEvent {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate?: Date | null;
    category: EventCategory;
    tags: string;
    imageUrl: string;
    externalUrl: string;
    sourceId: string;
    scraperSource: ScraperSource;
    organizer: string;
    isFree: boolean;
}

// ─── Scraper Run Stats ────────────────────────────────────

export interface EventScrapeStats {
    source: ScraperSource;
    eventsFound: number;
    eventsNew: number;
    eventsUpdated: number;
    eventsUnchanged: number;
    errors: number;
    durationMs: number;
}

export interface EventScrapeResult {
    success: boolean;
    stats: EventScrapeStats[];
    totalNew: number;
    totalUpdated: number;
    totalErrors: number;
}

// ─── Query Filters ────────────────────────────────────────

export interface EventFilters {
    search?: string;
    category?: EventCategory;
    location?: string;
    limit?: number;
    offset?: number;
}

// ─── Category Keyword Map (for auto-categorization) ───────

export const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
    workshop: ["workshop", "atelier", "hands-on", "training", "bootcamp", "masterclass"],
    hackathon: ["hackathon", "hack", "hackers", "coding challenge", "code jam"],
    competition: ["competition", "contest", "challenge", "pitch", "award"],
    talk: ["talk", "lecture", "seminar", "keynote", "panel", "fireside", "ted"],
    social: ["social", "networking", "mixer", "happy hour", "meetup", "gathering"],
    conference: ["conference", "summit", "forum", "congress", "symposium", "expo"],
    meetup: ["meetup", "meet-up", "community", "user group"],
    other: [],
};