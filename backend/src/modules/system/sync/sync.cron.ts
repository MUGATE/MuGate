import cron from "node-cron";
import { logger } from "../../../core/logger/logger";
import { CoursesService } from "../../academic/courses/courses.service";
import { ScraperService } from "../scraper/scraper.service";
import fs from "fs";
import path from "path";

// Function to handle the actual sync logic
const runCourseSync = async () => {
    logger.info("CRON: Starting automated background course sync...");
    try {
        const credentialsPath = path.join(process.cwd(), "scraper-credentials.json");

        if (!fs.existsSync(credentialsPath)) {
            logger.warn("CRON: No tracking credentials found at scraper-credentials.json. Skipping automated sync.");
            return;
        }

        const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

        if (!creds.email || !creds.password || !creds.semesterId) {
            logger.warn("CRON: Invalid credentials file. Missing email, password, or semesterId. Skipping sync.");
            return;
        }

        await CoursesService.syncCoursesGlobal(creds.email, creds.password, creds.semesterId);
        logger.info("CRON: Automated course sync completed successfully.");
    } catch (error: any) {
        logger.error(`CRON: Automated course sync failed: ${error.message}`);
    }
};

// Function to handle knowledge base sync
const runKnowledgeBaseSync = async () => {
    logger.info("CRON: Starting automated knowledge base sync...");
    try {
        if (ScraperService.running) {
            logger.warn("CRON: Scraper already running. Skipping knowledge base sync.");
            return;
        }

        await ScraperService.incrementalSync(24); // Re-check pages older than 24 hours
        logger.info("CRON: Knowledge base sync completed successfully.");
    } catch (error: any) {
        logger.error(`CRON: Knowledge base sync failed: ${error.message}`);
    }
};

/**
 * Initializes the CRON jobs for the application
 */
export const initCronJobs = () => {
    logger.info("Initializing background CRON jobs...");

    // Schedule course sync to run every 3 hours 
    // Format: "0 */3 * * *" -> minute 0, every 3rd hour
    cron.schedule("0 */3 * * *", () => {
        runCourseSync();
    });

    // Schedule knowledge base sync to run daily at 3:00 AM
    // Format: "0 3 * * *" -> at 03:00 every day
    cron.schedule("0 3 * * *", () => {
        runKnowledgeBaseSync();
    });

    logger.info("CRON jobs active: Course Sync (Every 3 hours), Knowledge Base Sync (Daily at 3 AM).");
};
