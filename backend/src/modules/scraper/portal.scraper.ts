import { chromium } from "playwright";
import { logger } from "../../core/logger/logger";

export class PortalScraper {
    private static LOGIN_URL = "https://ums.mu.edu.lb/Admin/login.php";

    static async verifyCredentials(universityId: string, password: string): Promise<boolean> {
        logger.info(`Attempting portal login verification for ID: ${universityId}`);

        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Navigate to login page
            await page.goto(this.LOGIN_URL, { waitUntil: "domcontentloaded" });

            // The login page typically uses name="username" and name="password" 
            // based on standard PHP login patterns. We also look for standard ID formats.
            // Using generic selectors that target common input names.
            await page.fill('input[name="username"], input[name="user_id"], input[type="text"]', universityId);
            await page.fill('input[name="password"], input[type="password"]', password);

            // Click submit button (often has type submit or just a button)
            await Promise.all([
                page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null), // Catch timeout in case it doesn't navigate on error
                page.click('button[onclick="submit_login()"], .form-actions button.btn-bricky, input[type="submit"]')
            ]);

            // Check if we are still on the login page. A successful login navigates to the dashboard.
            const url = page.url();

            if (url.toLowerCase().includes("login.php")) {
                logger.warn(`Login failed for ID: ${universityId}`);
                return false;
            }

            logger.info(`Login successful for ID: ${universityId}`);
            return true;

        } catch (error: any) {
            logger.error(`Error during portal scraping: ${error.message}`);
            return false;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    static async extractCourses(universityId: string, password: string, semesterId: number) {
        logger.info(`Extracting courses for semester ${semesterId} from portal...`);

        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            // 1. Login to the portal first
            await page.goto(this.LOGIN_URL, { waitUntil: "domcontentloaded" });
            await page.fill('input[name="username"], input[name="user_id"], input[type="text"]', universityId);
            await page.fill('input[name="password"], input[type="password"]', password);
            await Promise.all([
                page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null),
                page.click('button[onclick="submit_login()"], .form-actions button.btn-bricky, input[type="submit"]')
            ]);

            // 2. Navigate to Course Offerings URL
            const offeringsUrl = `https://ums.mu.edu.lb/Student/list_offering.php?semester_idsemester=${semesterId}`;
            await page.goto(offeringsUrl, { waitUntil: "domcontentloaded" });

            // 2b. We will handle pagination by extracting the current page, and clicking 'Next' until disabled
            const allCourses: any[] = [];
            let hasNextPage = true;
            let pageNum = 1;

            while (hasNextPage) {
                // Wait for the table body to exist
                await page.waitForSelector('tbody tr[role="row"]', { timeout: 10000 }).catch(() => null);

                // Extract data from the current page
                const pageCourses = await page.evaluate((semesterId) => {
                    const rows = Array.from(document.querySelectorAll('tbody tr[role="row"]'));
                    const extracted: any[] = [];

                    rows.forEach(row => {
                        const columns = row.querySelectorAll('td');
                        if (columns.length >= 12) {
                            const courseCode = columns[1]?.innerText.trim();
                            const courseName = columns[2]?.innerText.trim();
                            const section = columns[3]?.innerText.trim();
                            const type = columns[4]?.innerText.trim();
                            const credits = parseInt(columns[5]?.innerText.trim() || '0', 10) || 0;
                            const instructor = columns[6]?.innerText.trim();
                            const schedule = columns[8]?.innerText.trim();
                            const capacity = parseInt(columns[9]?.innerText.trim() || '0', 10) || 0;
                            const enrolled = parseInt(columns[10]?.innerText.trim() || '0', 10) || 0;
                            const room = columns[11]?.innerText.trim();

                            if (courseCode && courseName) {
                                extracted.push({
                                    courseCode, courseName, sectionNumber: section, type,
                                    credits, instructor, schedule, capacity, enrolled, room, semesterId
                                });
                            }
                        }
                    });
                    return extracted;
                }, semesterId);

                allCourses.push(...pageCourses);
                logger.info(`Extracted ${pageCourses.length} courses from page ${pageNum}`);

                // Check if 'Next' button exists and is not disabled
                // Often DataTables use .paginate_button.next, and add .disabled when at the end
                const nextButton = await page.$('.paginate_button.next:not(.disabled), #datatable_next:not(.disabled), a.next:not(.disabled)');

                if (nextButton) {
                    await nextButton.click();
                    pageNum++;
                    await page.waitForTimeout(1500); // Wait for DataTables to re-render the next page
                } else {
                    hasNextPage = false;
                }
            }

            logger.info(`Successfully extracted a total of ${allCourses.length} course sections from portal.`);
            return allCourses;

        } catch (error: any) {
            logger.error(`Error extracting courses from portal: ${error.message}`);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    static async extractHistory(universityId: string, password: string) {
        logger.info(`Extracting academic history for ${universityId} from portal...`);

        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            // 1. Login to the portal
            await page.goto(this.LOGIN_URL, { waitUntil: "domcontentloaded" });
            await page.fill('input[name="username"], input[name="user_id"], input[type="text"]', universityId);
            await page.fill('input[name="password"], input[type="password"]', password);
            await Promise.all([
                page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null),
                page.click('button[onclick="submit_login()"], .form-actions button.btn-bricky, input[type="submit"]')
            ]);

            // 2. Navigate to Academic History URL
            const historyUrl = "https://ums.mu.edu.lb/Student/index.php";
            await page.goto(historyUrl, { waitUntil: "domcontentloaded" });

            // 3. Extract data from all tables (GER, Major, Electives, etc.)
            const history = await page.evaluate(() => {
                const tables = Array.from(document.querySelectorAll('table.table-bordered'));
                const extracted: any[] = [];

                tables.forEach(table => {
                    // Get the category name which is usually an <h2> right before the table container
                    let category = "Unknown";
                    let previousElem = table.parentElement?.previousElementSibling;
                    if (previousElem && previousElem.tagName === 'H2') {
                        category = previousElem.textContent?.trim() || "Unknown";
                    } else if (previousElem && previousElem.tagName === 'DIV' && previousElem.previousElementSibling?.tagName === 'H2') {
                        category = previousElem.previousElementSibling.textContent?.trim() || "Unknown";
                    }

                    const rows = Array.from(table.querySelectorAll('tbody tr:not(:last-child)')); // Skip the "Total Credits" last row

                    rows.forEach(row => {
                        const columns = row.querySelectorAll('td');
                        if (columns.length >= 5) {
                            const courseCode = columns[1].innerText.trim();
                            const courseName = columns[2].innerText.trim();
                            const credits = parseFloat(columns[3].innerText.trim()) || 0;
                            const status = columns[4].innerText.trim(); // "Passed", "Registered", "Dropped", "New"

                            if (courseCode && courseCode !== "Total Credits") {
                                extracted.push({
                                    courseCode,
                                    courseName,
                                    credits,
                                    status,
                                    category // e.g. "GER", "Major"
                                });
                            }
                        }
                    });
                });

                return extracted;
            });

            logger.info(`Successfully extracted ${history.length} academic history records.`);
            return history;

        } catch (error: any) {
            logger.error(`Error extracting academic history from portal: ${error.message}`);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
