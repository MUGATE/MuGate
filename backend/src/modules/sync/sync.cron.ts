import cron from "node-cron";
import { logger } from "../../core/logger/logger";
import { CoursesService } from "../courses/courses.service";
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

/**
 * Initializes the CRON jobs for the application
 */
export const initCronJobs = () => {
    logger.info("Initializing background CRON jobs...");

    // Schedule to run every 3 hours 
    // Format: "0 */3 * * *" -> minute 0, every 3rd hour
    cron.schedule("0 */3 * * *", () => {
        runCourseSync();
    });

    logger.info("CRON jobs active: Course Sync (Every 3 hours).");
};
