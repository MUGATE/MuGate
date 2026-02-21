import { logger } from "../../core/logger/logger";

export class ScraperService {
    static async scrapePortal(credentials: { username: string; password: string }) {
        // TODO: Use Playwright to automate portal login and data extraction
        logger.info("Starting portal scrape...");
        return { message: "Scraper service placeholder" };
    }
}
