import { chromium } from "playwright";
import { logger } from "../../../core/logger/logger";

export class PortalScraper {
    private static LOGIN_URL = "https://ums.mu.edu.lb/Admin/login.php";

        /**
     * Verifies credentials against the MU Portal.
     * Returns { valid: false } on failure, or { valid: true, studentName } on success.
     */
    static async verifyCredentials(universityId: string, password: string): Promise<{ valid: boolean; studentName?: string }> {
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
                return { valid: false };
            }

            // Try to scrape the student name from the portal dashboard
            let studentName: string | undefined;
            try {
                // Common patterns for student name on university portals:
                // - A welcome message like "Welcome, Student Name"
                // - A navbar/header element with the student name
                // - A profile section with the name
                const nameSelectors = [
                    '.user-name', '.student-name', '.profile-name',
                    '.navbar-text', '.user-info', '.welcome-msg',
                    'span.username', '.header-username',
                    '.user-display-name', '#user-name',
                    '.nav-username', '.top-menu .username'
                ];

                for (const selector of nameSelectors) {
                    const el = await page.$(selector);
                    if (el) {
                        const text = await el.innerText();
                        if (text && text.trim() && !text.trim().match(/^\d+$/)) {
                            studentName = text.trim();
                            break;
                        }
                    }
                }

                // Fallback: look for any element containing a welcome/greeting pattern
                if (!studentName) {
                    const welcomeText = await page.evaluate(() => {
                        // Search for text like "Welcome, Name" or "Hello, Name" in the page
                        const body = document.body.innerText;
                        const welcomeMatch = body.match(/(?:Welcome|Hello|Hi)[,:]?\s+([A-Za-z\s]{3,50})/i);
                        if (welcomeMatch && welcomeMatch[1]) {
                            const name = welcomeMatch[1].trim();
                            // Make sure it's not just a number (ID)
                            if (!name.match(/^\d+$/)) return name;
                        }
                        return null;
                    });
                    if (welcomeText) studentName = welcomeText;
                }

                if (studentName) {
                    logger.info(`Scraped student name: "${studentName}" for ID: ${universityId}`);
                } else {
                    logger.info(`Could not find student name on portal dashboard for ID: ${universityId}`);
                }
            } catch (nameErr: any) {
                logger.warn(`Non-fatal: Failed to scrape student name: ${nameErr.message}`);
            }

            logger.info(`Login successful for ID: ${universityId}`);
            return { valid: true, studentName };

        } catch (error: any) {
            logger.error(`Error during portal scraping: ${error.message}`);
            return { valid: false };
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

            // 2a. The portal has TWO tables: Major courses (requires clicking "List") and Elective courses.
            // Click the "List" button to load the Major courses table
            try {
                // Wait for the page to fully load
                await page.waitForTimeout(2000);

                // Click the "List" button to load Major/filtered course offerings
                const listButton = await page.$('button.btn:has-text("List"), input[type="submit"][value="List"], .btn-primary:has-text("List"), button:has-text("List")');
                if (listButton) {
                    await listButton.click();
                    logger.info("Clicked 'List' button to load Major course offerings.");
                    await page.waitForTimeout(3000); // Wait for the table to populate
                } else {
                    logger.warn("Could not find 'List' button — Major courses table may not load.");
                }
            } catch (e: any) {
                logger.warn(`Error clicking List button: ${e.message}`);
            }

            // 2b. Set ALL DataTables on the page to show maximum entries
            // The portal may have multiple tables, each with their own "show entries" dropdown
            try {
                const allDropdowns = await page.$$('.dataTables_length select');
                logger.info(`Found ${allDropdowns.length} DataTables length dropdown(s) on the page.`);

                for (let i = 0; i < allDropdowns.length; i++) {
                    const dropdown = allDropdowns[i];
                    const options = await dropdown.evaluate((sel: HTMLSelectElement) => {
                        return Array.from(sel.options).map(o => ({ value: o.value, text: o.text }));
                    });

                    logger.info(`Dropdown ${i}: options = ${JSON.stringify(options)}`);

                    // Find "All" or the largest numeric value
                    const allOption = options.find(o => o.value === '-1' || o.text.toLowerCase() === 'all');
                    const largestOption = options.reduce((max, o) => {
                        const val = parseInt(o.value, 10);
                        return !isNaN(val) && val > parseInt(max.value, 10) ? o : max;
                    }, options[0]);

                    const targetValue = allOption ? allOption.value : largestOption?.value;

                    if (targetValue) {
                        await dropdown.selectOption(targetValue);
                        logger.info(`Set dropdown ${i} to show ${allOption ? 'ALL' : targetValue} entries.`);
                    }
                }

                if (allDropdowns.length > 0) {
                    // Wait for all tables to re-render
                    await page.waitForTimeout(3000);
                }
            } catch (e: any) {
                logger.warn(`Error setting DataTables length: ${e.message}`);
            }


            // 2c. Extract ALL courses from ALL tables on the page in a single pass
            // Wait for table rows to exist (use 'tbody tr' not 'tbody tr[role=row]' — Major table is plain HTML, not DataTable)
            await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => null);

            const allCourses = await page.evaluate((semesterId) => {
                const rows = Array.from(document.querySelectorAll('tbody tr'));
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
