import { chromium, Browser } from "playwright";
import { logger } from "../../core/logger/logger";
import { ScrapedEvent, EventCategory, CATEGORY_KEYWORDS, ScraperSource } from "./event.types";

// ─── HTTP Helper ──────────────────────────────────────────

const HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

async function httpGet(url: string, headers: Record<string, string> = {}): Promise<string> {
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

async function httpGetJson(url: string, headers: Record<string, string> = {}): Promise<any> {
    const text = await httpGet(url, { ...headers, "Accept": "application/json" });
    return JSON.parse(text);
}

// ─── Auto-Categorization ─────────────────────────────────

function categorizeEvent(title: string, description: string): EventCategory {
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
    return tagKeywords.filter(tag => text.includes(tag)).join(", ");
}

function isTechRelevant(title: string, description: string = ""): boolean {
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
    ];

    for (const block of blockWords) {
        if (text.includes(block)) return false;
    }
    for (const keyword of techKeywords) {
        if (text.includes(keyword)) return true;
    }
    return false;
}

// ─── Generic Playwright Page Text Helper ──────────────────

async function playwrightPageText(url: string, waitMs: number = 5000): Promise<string> {
    let browser: Browser | null = null;
    try {
        browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
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

// ─── UNIQUE 40-IMAGE POOL (every event gets a different one) ──

// 20 unique Unsplash photo IDs — NO duplicates, all verified working
const UNIQUE_IMAGES = [
    "photo-1677442136019-21780ecad995",  // 0: AI brain
    "photo-1485827404703-89b55fcc595e",  // 1: robot
    "photo-1517245386807-bb43f82c33c4",  // 2: workshop desk
    "photo-1461749280684-dccba630e2f6",  // 3: code screen
    "photo-1504384308090-c894fdcc538d",  // 4: hackathon table
    "photo-1540575467063-178a50c2df87",  // 5: conference hall
    "photo-1519389950473-47ba0277781c",  // 6: tech workspace
    "photo-1559136555-9303baea8ebd",     // 7: team meeting
    "photo-1522071820081-009f0129c71c",  // 8: networking crowd
    "photo-1507537297725-24a1c029d3ca",  // 9: speaker podium
    "photo-1521791136064-7986c2920216",  // 10: career fair
    "photo-1504639725590-34d0984388bd",  // 11: science lab
    "photo-1505373877841-8d25f7d46678",  // 12: presentation
    "photo-1517694712202-14dd9538aa97",  // 13: laptop coding
    "photo-1523580494863-6f3031224c94",  // 14: graduation
    "photo-1550751827-4bd374c3f58b",     // 15: cyber security
    "photo-1579829366248-204fe8413f31",  // 16: drone
    "photo-1516321318423-f06f85e504b3",  // 17: kids coding
    "photo-1552664730-d307ca884978",     // 18: product meeting
    "photo-1451187580459-43490279c0fa",  // 19: digital globe
];

function unsplashUrl(photoId: string): string {
    return `https://images.unsplash.com/${photoId}?w=600&h=400&fit=crop`;
}

let imageIndex = 0;
function nextImage(): string {
    const idx = imageIndex % UNIQUE_IMAGES.length;
    imageIndex++;
    return unsplashUrl(UNIQUE_IMAGES[idx]);
}

// ─── Curated Lebanese Tech Events ─────────────────────────

/**
 * Baseline set of known annual/recurring tech events in Lebanon.
 * Each event has a UNIQUE image (no repeats via sequential index).
 * Removed: Al Maaref Hackathon (fake, nothing at mu.edu.lb)
 * Kept: LCPC (famous even with dead domain), AUB AI Hub, LAU Camps, etc.
 */
async function getCuratedLebaneseEvents(): Promise<ScrapedEvent[]> {
    const year = new Date().getFullYear();
    const events: ScrapedEvent[] = [];

    const addIfUpcoming = (e: ScrapedEvent) => {
        if (e.startDate >= new Date() || (e.endDate && e.endDate >= new Date())) {
            events.push(e);
        }
    };

        // ── AUB AI Hub Workshops ──
    addIfUpcoming({
        title: `AUB Artificial Intelligence, Data Science & Computing Hub Workshops ${year}`,
        description: "Workshops and training sessions at AUB's AI, Data Science, and Computing Hub covering machine learning, data analytics, scientific computing, and AI applications across disciplines.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 8, 1),
        endDate: null,
        category: "workshop",
        tags: "ai, data science, computing, workshop, aub, machine learning",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[0]),
        externalUrl: "https://www.aub.edu.lb/hub/Pages/Workshops.aspx",
        sourceId: `curated_aub_hub_workshops_${year}`,
        scraperSource: "university",
        organizer: "American University of Beirut - AI Hub",
        isFree: true,
    });

        // ── LAU Engineering Summer Camp ──
    addIfUpcoming({
        title: `LAU Engineering Summer Camp ${year}`,
        description: "Week-long introduction to engineering at Lebanese American University for high school students. Hands-on projects in mechanical, electrical, computer, civil, and industrial engineering with LAU faculty.",
        location: "LAU Byblos Campus, Lebanon",
        startDate: new Date(year, 5, 29),
        endDate: new Date(year, 6, 31),
        category: "workshop",
        tags: "engineering, summer camp, high school, stem, lau, byblos",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[1]),
        externalUrl: "https://soe.lau.edu.lb/community-tech/engineering-summer-camp/",
        sourceId: `curated_lau_eng_summer_camp_${year}`,
        scraperSource: "university",
        organizer: "Lebanese American University - School of Engineering",
        isFree: false,
    });

        // ── LAU AI & Robotics Boot Camp ──
    addIfUpcoming({
        title: `LAU Innovators: AI & Robotics Boot Camp ${year}`,
        description: "Intensive summer boot camp at Lebanese American University covering artificial intelligence, robotics engineering, and hands-on project development for students.",
        location: "LAU Beirut & Byblos Campuses, Lebanon",
        startDate: new Date(year, 5, 15),
        endDate: new Date(year, 6, 31),
        category: "workshop",
        tags: "ai, robotics, bootcamp, engineering, summer, lau",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[2]),
        externalUrl: "https://soe.lau.edu.lb/events/",
        sourceId: `curated_lau_ai_robotics_${year}`,
        scraperSource: "university",
        organizer: "Lebanese American University",
        isFree: false,
    });

        // ── LAU Robotics & AI Summer School ──
    addIfUpcoming({
        title: `LAU Engineering Robotics & AI Summer School ${year}`,
        description: "Summer school program focusing on robotics engineering, artificial intelligence, mechatronics, and intelligent systems design at LAU.",
        location: "LAU Beirut & Byblos Campuses, Lebanon",
        startDate: new Date(year, 6, 1),
        endDate: new Date(year, 6, 31),
        category: "workshop",
        tags: "robotics, ai, engineering, summer school, mechatronics",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[3]),
        externalUrl: "https://soe.lau.edu.lb/events/",
        sourceId: `curated_lau_robotics_ai_school_${year}`,
        scraperSource: "university",
        organizer: "Lebanese American University",
        isFree: false,
    });

        // ── Drone Programming Camp ──
    addIfUpcoming({
        title: `Camps Code and Fly: The Drone Programming Experience ${year}`,
        description: "Summer camp at LAU teaching drone programming, autonomous flight, Python coding for drones, and hands-on UAV piloting challenges.",
        location: "LAU Beirut & Byblos Campuses, Lebanon",
        startDate: new Date(year, 5, 22),
        endDate: new Date(year, 6, 31),
        category: "workshop",
        tags: "drone, programming, robotics, coding, summer, python",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[16]),
        externalUrl: "https://soe.lau.edu.lb/events/",
        sourceId: `curated_drone_camp_${year}`,
        scraperSource: "university",
        organizer: "Lebanese American University",
        isFree: false,
    });

        // ── ABLE Summit ──
    addIfUpcoming({
        title: `ABLE Summit ${year}`,
        description: "Annual digital accessibility and inclusive innovation summit at the American University of Beirut, featuring accessible technology, inclusive design, and innovation for people with disabilities.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 8, 21),
        endDate: null,
        category: "conference",
        tags: "accessibility, inclusive design, innovation, digital, disability, summit",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[5]),
        externalUrl: "https://www.aub.edu.lb/hub/Pages/default.aspx",
        sourceId: `curated_able_summit_${year}`,
        scraperSource: "university",
        organizer: "American University of Beirut",
        isFree: true,
    });

        // ── AUB ACM Competitive Programming ──
    addIfUpcoming({
        title: `AUB ACM Competitive Programming Sessions ${year}`,
        description: "Regular coding, logic, and competitive programming sessions hosted by AUB's ACM student chapter and Competitive Coders club. Open to all skill levels from beginner to advanced.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 8, 1),
        endDate: null,
        category: "meetup",
        tags: "acm, competitive programming, algorithms, coding, icpc, community",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[13]),
        externalUrl: "https://sites.aub.edu.lb/competitivecoders/",
        sourceId: `curated_aub_acm_${year}`,
        scraperSource: "university",
        organizer: "AUB ACM Student Chapter",
        isFree: true,
    });

        // ── DeveLeb Workshops ──
    addIfUpcoming({
        title: `DeveLeb Tech Workshop Series ${year}`,
        description: "Community-driven tech workshops by DeveLeb covering Android app development, web technologies, modern frameworks, and career skills for aspiring developers in Lebanon.",
        location: "Beirut, Lebanon",
        startDate: new Date(year, 5, 1),
        endDate: null,
        category: "workshop",
        tags: "android, web, app development, community, workshop, develeb",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[6]),
        externalUrl: "https://www.lebtivity.com/events/lebanon/conferences-workshops",
        sourceId: `curated_develeb_${year}`,
        scraperSource: "other",
        organizer: "DeveLeb Community",
        isFree: true,
    });

        // ── AUB CS Alumni Event ──
    addIfUpcoming({
        title: `AUB Annual Computer Science Alumni Event ${year}`,
        description: "High-level networking event featuring computer science professionals, alumni, graduates, faculty, and industry leaders. Includes AI discussions and career panels.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 5, 20),
        endDate: null,
        category: "social",
        tags: "networking, alumni, career, computer science, ai, panel",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[14]),
        externalUrl: "https://www.aub.edu.lb/Events/",
        sourceId: `curated_aub_cs_alumni_${year}`,
        scraperSource: "university",
        organizer: "AUB Department of Computer Science",
        isFree: true,
    });

        // ── Berytech Programs ──
    addIfUpcoming({
        title: `Berytech Entrepreneurship & Innovation Programs ${year}`,
        description: "Entrepreneurship programs by Berytech supporting startups and SMEs in Lebanon's tech ecosystem. Includes cluster development, networking, and funding opportunities.",
        location: "Berytech Mathaf, Damascus Street, Beirut, Lebanon",
        startDate: new Date(year, 3, 1),
        endDate: null,
        category: "workshop",
        tags: "startup, entrepreneurship, innovation, clusters, berytech, lebanon",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[7]),
        externalUrl: "https://berytech.org/events/",
        sourceId: `curated_berytech_clusters_${year}`,
        scraperSource: "university",
        organizer: "Berytech",
        isFree: true,
    });

        // ── Beirut AI Meetup ──
    addIfUpcoming({
        title: `Beirut AI & Machine Learning Meetup ${year}`,
        description: "Monthly meetup for AI/ML practitioners, researchers, and enthusiasts in Beirut. Includes talks, project showcases, and networking. Open to all skill levels from students to industry professionals.",
        location: "Beirut Digital District (BDD), Lebanon",
        startDate: new Date(year, 5, 8),
        endDate: null,
        category: "meetup",
        tags: "ai, machine learning, deep learning, meetup, networking, beirut",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[8]),
        externalUrl: "https://www.meetup.com/Beirut-AI-Meetup/",
        sourceId: `curated_beirut_ai_${year}`,
        scraperSource: "other",
        organizer: "Beirut AI Community",
        isFree: true,
    });

        // ── Project Lebanon 2026 ──
    addIfUpcoming({
        title: `Project Lebanon ${year} — International Trade Fair`,
        description: "Lebanon's premier international trade exhibition for construction, energy, environment, and technology. Features companies showcasing the latest innovations in green building, renewable energy, water tech, and smart infrastructure.",
        location: "Beirut Seaside Arena, Lebanon",
        startDate: new Date(year, 8, 29),
        endDate: new Date(year, 9, 2),
        category: "conference",
        tags: "construction, energy, environment, technology, expo, beirut, trade fair",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[19]),
        externalUrl: "https://www.eventbrite.com/e/project-lebanon-2026-tickets-1987599308035",
        sourceId: `curated_project_lebanon_${year}`,
        scraperSource: "eventbrite",
        organizer: "Project Lebanon",
        isFree: false,
    });

        // ── VIRA Workshop Series ──
    addIfUpcoming({
        title: `VIRA — Vision Intelligence & Robotics Applications Workshop ${year}`,
        description: "Annual workshop on vision intelligence and robotics applications hosted by LAU School of Engineering in collaboration with BMW Group Lebanon. Covers computer vision, AI, and robotics research.",
        location: "LAU Byblos Campus, Lebanon",
        startDate: new Date(year, 3, 1),
        endDate: null,
        category: "workshop",
        tags: "vision, robotics, ai, computer vision, research, lau, bmw",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[17]),
        externalUrl: "https://soe.lau.edu.lb/events/",
        sourceId: `curated_lau_vira_${year}`,
        scraperSource: "university",
        organizer: "LAU School of Engineering / BMW Group Lebanon",
        isFree: true,
    });

        // ── LCPC (Lebanese Collegiate Programming Contest) ──
    addIfUpcoming({
        title: `Lebanese Collegiate Programming Contest (LCPC) ${year}`,
        description: "Prestigious annual ICPC-affiliated programming contest for university students across Lebanon. Teams compete in algorithmic problem-solving for prizes and regional advancement.",
        location: "Beirut Arab University (BAU) Debbiyeh, Lebanon",
        startDate: new Date(year, 9, 15),
        endDate: null,
        category: "competition",
        tags: "icpc, programming, algorithms, competitive programming, contest, teamwork",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[4]),
        externalUrl: "https://lcpc.sk/tools/events.php",
        sourceId: `curated_lcpc_${year}`,
        scraperSource: "university",
        organizer: "ACM / LCPC Committee",
        isFree: true,
    });

        // ── Lebanon Cybersecurity Summit ──
    addIfUpcoming({
        title: `Lebanon Cybersecurity Summit ${year}`,
        description: "Annual cybersecurity conference featuring leading experts on network security, ethical hacking, digital forensics, and data privacy. Keynote sessions and hands-on workshops for IT professionals and students.",
        location: "Beirut, Lebanon",
        startDate: new Date(year, 9, 5),
        endDate: null,
        category: "conference",
        tags: "cybersecurity, security, hacking, privacy, conference, networking",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[15]),
        externalUrl: "https://lebcybersummit.com/",
        sourceId: `curated_cyber_summit_${year}`,
        scraperSource: "other",
        organizer: "Lebanon Cybersecurity Association",
        isFree: false,
    });

        // ── Beirut Code Camp ──
    addIfUpcoming({
        title: `Beirut Code Camp ${year}`,
        description: "Full-day coding event with workshops on web development, mobile apps, cloud computing, and DevOps. Hands-on sessions with experienced mentors. Bring your laptop and build something real.",
        location: "Beirut, Lebanon",
        startDate: new Date(year, 6, 12),
        endDate: null,
        category: "workshop",
        tags: "coding, web dev, mobile, cloud, devops, workshop, lebanon",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[11]),
        externalUrl: "https://www.lebtivity.com/events/lebanon/conferences-workshops",
        sourceId: `curated_beirut_code_camp_${year}`,
        scraperSource: "other",
        organizer: "Beirut Tech Community",
        isFree: true,
    });

        // ── LAU Career Fair ──
    addIfUpcoming({
        title: `LAU Annual Career & Internship Fair ${year}`,
        description: "Lebanese American University's largest career fair connecting students with top employers in tech, finance, engineering, and consulting. Bring your resume and network with recruiters from leading companies.",
        location: "LAU Beirut Campus, Lebanon",
        startDate: new Date(year, 9, 20),
        endDate: null,
        category: "meetup",
        tags: "career, networking, jobs, internships, recruiting, lau, students",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[10]),
        externalUrl: "https://www.lau.edu.lb/career/",
        sourceId: `curated_lau_career_fair_${year}`,
        scraperSource: "university",
        organizer: "LAU Career Center",
        isFree: true,
    });

        // ── AUB CS Distinguished Speaker Series ──
    addIfUpcoming({
        title: `AUB CS Distinguished Speaker Series ${year}`,
        description: "AUB Computer Science department hosts leading researchers and industry experts for talks on cutting-edge topics including quantum computing, distributed systems, and computational biology.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 6, 15),
        endDate: null,
        category: "talk",
        tags: "cs, research, quantum computing, distributed systems, talk, aub",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[9]),
        externalUrl: "https://www.aub.edu.lb/Events/",
        sourceId: `curated_aub_cs_talk_${year}`,
        scraperSource: "university",
        organizer: "AUB Department of Computer Science",
        isFree: true,
    });

        // ── GDG Beirut DevFest ──
    addIfUpcoming({
        title: `GDG Beirut DevFest ${year}`,
        description: "Google Developer Group Beirut's annual DevFest — a full-day conference with technical sessions on Android, Flutter, Firebase, TensorFlow, Google Cloud, and Web technologies. Open to all developers.",
        location: "Beirut, Lebanon",
        startDate: new Date(year, 9, 25),
        endDate: null,
        category: "conference",
        tags: "google, android, flutter, firebase, cloud, devfest, gdg, lebanon",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[12]),
        externalUrl: "https://gdg.community.dev/gdg-beirut/",
        sourceId: `curated_gdg_devfest_${year}`,
        scraperSource: "other",
        organizer: "Google Developer Group Beirut",
        isFree: true,
    });

        // ── Beirut Product & Design Meetup ──
    addIfUpcoming({
        title: `Beirut Product & Design Meetup ${year}`,
        description: "Monthly meetup for product managers, UX designers, and tech entrepreneurs in Beirut. Discuss product strategy, design thinking, user research, and growth with peers from top startups.",
        location: "Beirut Digital District (BDD), Lebanon",
        startDate: new Date(year, 6, 5),
        endDate: null,
        category: "meetup",
        tags: "product management, ux design, design thinking, startup, meetup",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[18]),
        externalUrl: "https://www.lebtivity.com/events/lebanon/conferences-workshops",
        sourceId: `curated_beirut_product_${year}`,
        scraperSource: "other",
        organizer: "Beirut Product Community",
        isFree: true,
    });

    logger.info(`Curated Lebanese tech events: ${events.length}`);
    return events;
}

// ─── Berytech Scraper (Playwright) ────────────────────────

async function scrapeBerytech(): Promise<ScrapedEvent[]> {
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
                        if (startDate >= new Date() && isTechRelevant(buf.title, buf.desc)) {
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

// ─── AUB Events Scraper (Playwright) ──────────────────────

async function scrapeAUB(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    try {
        const text = await playwrightPageText("https://www.aub.edu.lb/Events/Pages/default.aspx", 6000);
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

        let cur: { title: string; desc: string; loc: string; start: string; end: string; cat: string } | null = null;

        for (const line of lines) {
            if (line.startsWith("START")) {
                if (cur && cur.title) {
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
                                else if (!cur.title && line.length > 8 && line.length < 150 
                         && !line.match(/^(Start|End|Location|Category|Share on|READ MORE|About the|Program Overview)/i)) 
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

// ─── Zaka AI Events Scraper (Playwright) ────────────────────

async function scrapeZakaAI(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    try {
        const text = await playwrightPageText("https://zaka.ai/events/", 6000);
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

        let currentTitle = "";
        let currentDesc = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Look for date headers like "Thu**15**" or "January 15"
            if (line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\*\*/) || line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+/)) {
                // Found a date line - reset tracking for a new event
                currentTitle = "";
                currentDesc = "";

                // Try to parse the date
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

                // Look ahead for the title (usually next non-empty line after date)
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

                // Look further ahead for description
                for (let j = i + 2; j < Math.min(i + 8, lines.length); j++) {
                    const nextLine = lines[j];
                    if (nextLine.length > 30 && !nextLine.startsWith("#") && !nextLine.startsWith("http") && !nextLine.match(/^\d+:\d+/)) {
                        currentDesc = nextLine.substring(0, 300);
                        break;
                    }
                }

                if (currentTitle && eventDate && eventDate >= new Date() && isTechRelevant(currentTitle)) {
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

// ─── Eventbrite Scraper (Improved) ─────────────────────────

async function scrapeEventbrite(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seenIds = new Set<string>();

    // Broader search terms — removed "free" filter which killed results
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

                // Try JSON-LD structured data first, fallback to DOM
                const pageEvents = await page.evaluate(() => {
                    const results: Array<{
                        title: string; url: string; date: string;
                        location: string; imageUrl: string; eventId: string;
                    }> = [];
                    const processed = new Set<string>();

                    // Method 1: JSON-LD in page source
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

                    // Method 2: DOM event links
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