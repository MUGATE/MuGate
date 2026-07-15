import { Browser } from "playwright";
import { EventCategory, CATEGORY_KEYWORDS } from "../event.types";
import { launchHeadlessBrowser } from "../../../core/utils/launchHeadlessBrowser";
import "../../../core/utils/windowsHideSpawn";

// ─── HTTP Helper ──────────────────────────────────────────

export const HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

export async function httpGet(url: string, headers: Record<string, string> = {}): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const resp = await fetch(url, {
            headers: { ...HTTP_HEADERS, ...headers },
            signal: controller.signal,
            redirect: "follow",
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
        return await resp.text();
    } finally {
        clearTimeout(timeout);
    }
}

export async function httpGetJson(url: string, headers: Record<string, string> = {}): Promise<any> {
    const text = await httpGet(url, { ...headers, "Accept": "application/json" });
    return JSON.parse(text);
}

// ─── Auto-Categorization ─────────────────────────────────

export function categorizeEvent(title: string, description: string): EventCategory {
    const text = `${title} ${description}`.toLowerCase();
    const orderedCategories: EventCategory[] = [
        "hackathon", "competition", "workshop", "conference", "talk", "meetup", "social"
    ];
    for (const cat of orderedCategories) {
        const keywords = CATEGORY_KEYWORDS[cat];
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) return cat;
        }
    }
    return "other";
}

export function extractTags(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    const tagKeywords = [
        "ai", "machine learning", "web development", "cybersecurity", "blockchain",
        "startup", "entrepreneurship", "design", "ux", "ui", "data science",
        "cloud", "devops", "mobile", "ios", "android", "python", "javascript",
        "react", "node", "networking", "career", "internship", "coding",
        "programming", "tech", "digital", "innovation", "open source",
        "gaming", "robotics", "iot", "fintech", "healthtech", "edtech",
    ];
    return tagKeywords.filter(tag => text.includes(tag)).join(", ");
}

export function isTechRelevant(title: string, description: string = ""): boolean {
    const text = `${title} ${description}`.toLowerCase();

    const techKeywords = [
        "tech", "code", "coding", "programming", "developer", "software",
        "hackathon", "hack", "startup", "ai", "artificial intelligence",
        "machine learning", "data science", "cloud", "devops", "web dev",
        "cyber", "security", "blockchain", "design thinking",
        "bootcamp", "summit", "innovation", "digital transformation",
        "robotics", "iot", "fintech", "python", "javascript", "react",
        "node", "java", "api", "database", "frontend", "backend",
        "fullstack", "full-stack", "computer science", "engineering",
        "open source", "linux", "git", "agile", "scrum",
        "saas", "edtech", "healthtech", "leetcode", "algorithm",
        "icpc", "acm", "google developer", "aws", "azure", "gcp",
        "deep learning", "neural", "nlp", "computer vision",
        "mobile app", "ios dev", "android dev", "flutter", "kotlin",
        "rust", "golang", "typescript", "sql", "nosql", "mongodb",
        "docker", "kubernetes", "microservices", "serverless",
        "ux research", "product management", "scaleup",
        "demo day", "pitch competition", "accelerator", "incubator",
    ];

    const blockWords = [
        "pizza party", "bbq", "barbecue", "brunch", "dinner party",
        "yoga", "meditation", "church", "prayer", "bible",
        "wedding", "birthday", "baby shower", "funeral",
        "karaoke", "nightclub", "bar crawl", "pub quiz",
        "cooking class", "bake sale", "potluck", "wine tasting",
        "book club", "knitting", "gardening", "hiking group",
        "singles mixer", "speed dating", "dance class",
        "real estate", "forex", "mlm", "make money online",
        "exposed: how to", "get rich", "passive income",
        "weight loss", "fitness", "zumba", "pilates",
        "museum", "sursock", "gallery", "art exhibit", "art exhibition",
        "sculpture", "painting", "theater", "theatre", "opera",
        "concert", "recital", "choir", "orchestra", "ballet",
        "poetry reading", "book launch", "literary festival",
        "film screening", "movie night", "photography exhibit",
        "fashion show", "craft fair",
        "blood drive", "donation drive", "fundraiser gala",
        "alumni reunion", "homecoming", "commencement ceremony",
        "spring festival", "fall festival", "christmas party",
        "easter celebration", "ramadan iftar", "cultural night",
        "heritage day", "independence day",
        "sports tournament", "basketball game", "football game",
        "soccer match", "marathon", "5k run", "swimming competition",
        "tennis tournament", "volleyball",
    ];

    for (const block of blockWords) {
        if (text.includes(block)) return false;
    }
    for (const keyword of techKeywords) {
        if (text.includes(keyword)) return true;
    }
    return false;
}

export function isValidEventTitle(title: string): boolean {
    const t = title.trim();

    if (t.length < 5 || t.length > 120) return false;

    if (/^(dear|hello|hi |hey |good morning|good evening|greetings|attention|notice to|to all)/i.test(t)) return false;

    const wordCount = t.split(/\s+/).length;
    if (wordCount > 15) return false;

    if (t.endsWith(".") && wordCount > 5) return false;

    if (/click here|learn more|register now|sign up now|read more|view details|submit|subscribe|see more|load more/i.test(t)) return false;

    if (/^the (event|workshop|session|program|course|seminar|lecture|webinar) (will|is|was|has|can|provides|features|covers|aims)/i.test(t)) return false;

    if (t === t.toUpperCase() && wordCount > 2) return false;

    if (/@.*\./.test(t)) return false;

    return true;
}

// ─── Generic Playwright Page Text Helper ──────────────────

export async function playwrightPageText(url: string, waitMs: number = 5000): Promise<string> {
    let browser: Browser | null = null;
    try {
        browser = await launchHeadlessBrowser();
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        });
        const page = await context.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
        await page.waitForTimeout(waitMs);
        const text = await page.evaluate(() => document.body?.innerText || "");
        await page.close();
        await context.close();
        return text;
    } finally {
        if (browser) await browser.close();
    }
}

// ─── UNIQUE 40-IMAGE POOL ──────────────────

export const UNIQUE_IMAGES = [
    "photo-1677442136019-21780ecad995",
    "photo-1485827404703-89b55fcc595e",
    "photo-1517245386807-bb43f82c33c4",
    "photo-1461749280684-dccba630e2f6",
    "photo-1504384308090-c894fdcc538d",
    "photo-1540575467063-178a50c2df87",
    "photo-1519389950473-47ba0277781c",
    "photo-1559136555-9303baea8ebd",
    "photo-1522071820081-009f0129c71c",
    "photo-1507537297725-24a1c029d3ca",
    "photo-1521791136064-7986c2920216",
    "photo-1504639725590-34d0984388bd",
    "photo-1505373877841-8d25f7d46678",
    "photo-1517694712202-14dd9538aa97",
    "photo-1523580494863-6f3031224c94",
    "photo-1550751827-4bd374c3f58b",
    "photo-1579829366248-204fe8413f31",
    "photo-1516321318423-f06f85e504b3",
    "photo-1552664730-d307ca884978",
    "photo-1451187580459-43490279c0fa",
];

export function unsplashUrl(photoId: string): string {
    return `https://images.unsplash.com/${photoId}?w=600&h=400&fit=crop`;
}

let imageIndex = 0;
export function nextImage(): string {
    const idx = imageIndex % UNIQUE_IMAGES.length;
    imageIndex++;
    return unsplashUrl(UNIQUE_IMAGES[idx]);
}
