import cron from "node-cron";
import { logger } from "../../../core/logger/logger";
import { CoursesService } from "../../academic/courses/courses.service";
import { ScraperService } from "../scraper/scraper.service";
import { RagSyncService } from "../../ai/rag/rag-sync.service";
import fs from "fs";
import path from "path";

type ScraperCreds = {
    email?: string;
    password?: string;
    semesterId?: number;
};

function loadCronCourseCredentials(): ScraperCreds | null {
    const envId = (process.env.SCRAPER_UNIVERSITY_ID || process.env.SCRAPER_EMAIL || "").trim();
    const envPassword = (process.env.SCRAPER_PASSWORD || "").trim();
    if (envId && envPassword) {
        const semesterRaw = process.env.SCRAPER_SEMESTER_ID || process.env.CURRENT_SEMESTER_ID;
        return {
            email: envId,
            password: envPassword,
            semesterId: semesterRaw != null && semesterRaw !== "" ? Number(semesterRaw) : undefined,
        };
    }

    const credentialsPath = path.join(process.cwd(), "scraper-credentials.json");
    if (!fs.existsSync(credentialsPath)) {
        return null;
    }

    try {
        const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf-8")) as ScraperCreds;
        if (!creds.email || !creds.password) {
            logger.warn("CRON: Invalid credentials file. Missing email or password.");
            return null;
        }
        logger.warn(
            "CRON: Using scraper-credentials.json. Prefer SCRAPER_UNIVERSITY_ID / SCRAPER_PASSWORD env vars."
        );
        return creds;
    } catch (err: any) {
        logger.warn(`CRON: Failed to read scraper-credentials.json: ${err.message}`);
        return null;
    }
}

const runCourseSync = async () => {
    logger.info("CRON: Starting automated background course sync...");
    try {
        const creds = loadCronCourseCredentials();
        if (!creds?.email || !creds?.password) {
            logger.warn(
                "CRON: No scraper credentials (set SCRAPER_UNIVERSITY_ID/SCRAPER_PASSWORD or scraper-credentials.json). Skipping."
            );
            return;
        }

        const semesterId = creds.semesterId != null ? Number(creds.semesterId) : undefined;
        const syncedSemester = await CoursesService.syncCoursesGlobal(
            creds.email,
            creds.password,
            semesterId
        );
        logger.info(`CRON: Automated course sync completed for semester ${syncedSemester}.`);
    } catch (error: any) {
        logger.error(`CRON: Automated course sync failed: ${error.message}`);
    }
};

const runKnowledgeBaseSync = async () => {
    logger.info("CRON: Starting automated knowledge base sync...");
    try {
        if (ScraperService.running) {
            logger.warn("CRON: Scraper already running. Skipping knowledge base sync.");
            return;
        }

        await ScraperService.incrementalSync(24);
        logger.info("CRON: Knowledge base sync completed successfully.");
    } catch (error: any) {
        logger.error(`CRON: Knowledge base sync failed: ${error.message}`);
    }
};

const runVectorSync = async () => {
    logger.info("CRON: Starting vector sync safety net...");
    try {
        const synced = await RagSyncService.syncUnsyncedChunks(100);
        logger.info(`CRON: Vector sync complete — ${synced} chunks synced.`);
    } catch (error: any) {
        logger.error(`CRON: Vector sync failed: ${error.message}`);
    }
};

const runSitemapRefresh = async () => {
    logger.info("CRON: Starting weekly sitemap refresh...");
    try {
        if (ScraperService.running) {
            logger.warn("CRON: Scraper already running. Skipping sitemap refresh.");
            return;
        }
        const added = await ScraperService.refreshSitemap();
        logger.info(`CRON: Sitemap refresh queued ${added} URLs.`);
    } catch (error: any) {
        logger.error(`CRON: Sitemap refresh failed: ${error.message}`);
    }
};

/**
 * Initializes the CRON jobs for the application
 */
export const initCronJobs = () => {
    logger.info("Initializing background CRON jobs...");

    cron.schedule("0 */3 * * *", () => {
        runCourseSync();
    });

    cron.schedule("0 3 * * *", () => {
        runKnowledgeBaseSync();
    });

    cron.schedule("0 4 * * *", () => {
        runVectorSync();
    });

    cron.schedule("0 2 * * 0", () => {
        runSitemapRefresh();
    });

    logger.info("CRON jobs active: Course Sync (3h), KB Sync (daily 3AM), Vector Sync (daily 4AM), Sitemap (Sun 2AM).");
};
