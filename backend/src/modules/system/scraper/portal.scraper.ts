import { Browser, Page } from "playwright";
import { logger } from "../../../core/logger/logger";
import { launchHeadlessBrowser } from "../../../core/utils/launchHeadlessBrowser";
import "../../../core/utils/windowsHideSpawn";

export type PortalVerifyResult = {
    valid: boolean;
    studentName?: string;
    /** Set when login could not be attempted (e.g. browser automation unavailable). */
    error?: string;
};

export type PortalHistoryCourse = {
    courseCode: string;
    courseName: string;
    credits: number;
    status: string;
    category: string;
};

export type PortalHistoryResult = {
    courses: PortalHistoryCourse[];
    /** Cumulative GPA scraped from the portal when available (0–4 scale). */
    gpa: number | null;
};

export class PortalScraper {
    private static LOGIN_URL = "https://ums.mu.edu.lb/Admin/login.php";

    /**
     * Launch a headless browser for portal scraping.
     * Falls back to system Chrome/Edge when Playwright's bundled Chromium is not installed.
     */
    private static async launchBrowser(): Promise<Browser> {
        return launchHeadlessBrowser();
    }

    /** Navigate with progressively looser wait conditions (heavy portal pages often miss domcontentloaded). */
    private static async gotoWithFallback(page: Page, url: string, timeoutMs = 90_000): Promise<void> {
        const strategies: Array<"domcontentloaded" | "load" | "commit"> = [
            "domcontentloaded",
            "load",
            "commit",
        ];

        let lastError: Error | null = null;
        for (const waitUntil of strategies) {
            try {
                await page.goto(url, { waitUntil, timeout: timeoutMs });
                logger.info(`Navigated to ${url} (waitUntil=${waitUntil})`);
                return;
            } catch (err: any) {
                lastError = err;
                logger.warn(`Navigation to ${url} failed (waitUntil=${waitUntil}): ${err?.message || err}`);
            }
        }

        throw lastError ?? new Error(`Could not navigate to ${url}`);
    }

    private static async portalLogin(page: Page, universityId: string, password: string): Promise<void> {
        await this.gotoWithFallback(page, this.LOGIN_URL, 60_000);
        await page.fill('input[name="username"], input[name="user_id"], input[type="text"]', universityId);
        await page.fill('input[name="password"], input[type="password"]', password);
        await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => null),
            page.click('button[onclick="submit_login()"], .form-actions button.btn-bricky, input[type="submit"]')
        ]);

        const url = page.url().toLowerCase();
        if (url.includes("login.php")) {
            throw new Error("Portal login failed — could not reach student dashboard.");
        }
    }

    /** Read the active registration semester from the portal offerings dropdown. */
    private static async detectSemesterFromOfferingsPage(page: Page): Promise<number> {
        const semesterSelectors = [
            'select[name="semester_idsemester"]',
            'select[name*="semester" i]',
            '#semester_idsemester',
        ];

        for (const selector of semesterSelectors) {
            const selectEl = await page.$(selector);
            if (!selectEl) continue;

            const detected = await selectEl.evaluate((sel: HTMLSelectElement) => {
                const selected = sel.options[sel.selectedIndex];
                if (selected?.value) {
                    const selectedId = parseInt(selected.value, 10);
                    if (!isNaN(selectedId) && selectedId > 0) {
                        return { id: selectedId, label: selected.text.trim(), source: "selected" };
                    }
                }

                let maxId = 0;
                let maxLabel = "";
                for (const opt of Array.from(sel.options)) {
                    const id = parseInt(opt.value, 10);
                    if (!isNaN(id) && id > maxId) {
                        maxId = id;
                        maxLabel = opt.text.trim();
                    }
                }
                if (maxId > 0) {
                    return { id: maxId, label: maxLabel, source: "latest" };
                }
                return null;
            });

            if (detected) {
                logger.info(
                    `Auto-detected semester ${detected.id} ("${detected.label}") from portal (${detected.source} option)`
                );
                return detected.id;
            }
        }

        throw new Error("Could not detect current semester from the portal offerings page.");
    }

    /** Pick the target semester on the offerings form before clicking List. */
    private static async selectSemesterOnOfferingsPage(page: Page, semesterId: number): Promise<void> {
        const semesterValue = String(semesterId);
        const semesterSelectors = [
            'select[name="semester_idsemester"]',
            'select[name*="semester" i]',
            '#semester_idsemester',
        ];

        await page.waitForTimeout(1500);

        for (const selector of semesterSelectors) {
            const selectEl = await page.$(selector);
            if (!selectEl) continue;

            const options = await selectEl.evaluate((sel: HTMLSelectElement) =>
                Array.from(sel.options).map((o) => ({ value: o.value, text: o.text.trim() }))
            );
            logger.info(`Semester dropdown (${selector}) options: ${JSON.stringify(options)}`);

            const byValue = options.find((o) => o.value === semesterValue);
            if (byValue) {
                await selectEl.selectOption(semesterValue);
                logger.info(`Selected semester ${semesterId} by value from ${selector}`);
                return;
            }

            const byText = options.find(
                (o) => o.text.includes(semesterValue) || o.value.endsWith(semesterValue)
            );
            if (byText) {
                await selectEl.selectOption(byText.value);
                logger.info(`Selected semester ${semesterId} by option "${byText.text}" from ${selector}`);
                return;
            }
        }

        const matched = await page.evaluate((targetSemester) => {
            const selects = Array.from(document.querySelectorAll("select"));
            for (const sel of selects) {
                const opt = Array.from(sel.options).find(
                    (o) => o.value === targetSemester || o.text.includes(targetSemester)
                );
                if (opt) {
                    sel.value = opt.value;
                    sel.dispatchEvent(new Event("change", { bubbles: true }));
                    return { selectName: sel.name || sel.id, optionText: opt.text };
                }
            }
            return null;
        }, semesterValue);

        if (matched) {
            logger.info(
                `Selected semester ${semesterId} via fallback (${matched.selectName}: "${matched.optionText}")`
            );
            return;
        }

        throw new Error(`Could not find semester ${semesterId} in any dropdown on the offerings page.`);
    }

    /**
     * Verifies credentials against the MU Portal.
     * Returns { valid: false } on failure, or { valid: true, studentName } on success.
     */
    static async verifyCredentials(universityId: string, password: string): Promise<PortalVerifyResult> {
        const normalizedUniversityId = String(universityId || "").trim();
        const normalizedPassword = String(password || "");
        logger.info(`Attempting portal login verification for ID: ${normalizedUniversityId}`);

        let browser;
        try {
            browser = await this.launchBrowser();
            const context = await browser.newContext();
            const page = await context.newPage();

            // Navigate to login page
            await page.goto(this.LOGIN_URL, { waitUntil: "domcontentloaded" });

            // Be permissive with field selectors because the portal HTML changes.
            const usernameSelector = 'input[name="username"], input[name="user_id"], input[name="userid"], input[id*="user" i], input[type="text"]';
            const passwordSelector = 'input[name="password"], input[id*="pass" i], input[type="password"]';
            await page.fill(usernameSelector, normalizedUniversityId);
            await page.fill(passwordSelector, normalizedPassword);

            const submitSelectors = [
                'button[onclick*="submit" i]',
                'button[type="submit"]',
                'input[type="submit"]',
                '.form-actions button',
                'button.btn-bricky',
                'button'
            ];

            // Try click submit first, then keyboard submit as fallback.
            let submitted = false;
            for (const selector of submitSelectors) {
                const button = await page.$(selector);
                if (!button) continue;
                submitted = true;
                await Promise.all([
                    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null),
                    button.click().catch(() => null)
                ]);
                break;
            }
            if (!submitted) {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null),
                    page.keyboard.press("Enter")
                ]);
            }

            const url = page.url().toLowerCase();
            const bodyText = await page.locator("body").innerText().catch(() => "");
            const bodyTextLower = bodyText.toLowerCase();
            const hasPortalError =
                /invalid|incorrect|wrong|authentication failed|login failed|try again/.test(bodyTextLower);
            const looksLikeDashboard =
                /student|dashboard|logout|profile|course|history|welcome/.test(bodyTextLower);
            const hasSessionCookies = (await context.cookies()).some((cookie) =>
                /php|sess|session|ums/i.test(cookie.name)
            );
            const likelyLoginPage = url.includes("login.php");

            if ((likelyLoginPage && !looksLikeDashboard) || hasPortalError || !hasSessionCookies) {
                logger.warn(`Login failed for ID: ${normalizedUniversityId}`);
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
                    logger.info(`Scraped student name: "${studentName}" for ID: ${normalizedUniversityId}`);
                } else {
                    logger.info(`Could not find student name on portal dashboard for ID: ${normalizedUniversityId}`);
                }
            } catch (nameErr: any) {
                logger.warn(`Non-fatal: Failed to scrape student name: ${nameErr.message}`);
            }

            logger.info(`Login successful for ID: ${normalizedUniversityId}`);
            return { valid: true, studentName };

        } catch (error: any) {
            const msg = error?.message || String(error);
            logger.error(`Error during portal scraping: ${msg}`);
            if (/executable doesn't exist|playwright install|could not launch a browser/i.test(msg)) {
                return {
                    valid: false,
                    error:
                        "Portal login is unavailable on this server. Install Playwright browsers with `npx playwright install chromium` in the backend folder, or ensure Google Chrome is installed.",
                };
            }
            return { valid: false };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    static async extractCourses(
        universityId: string,
        password: string,
        semesterId?: number
    ): Promise<{ courses: any[]; semesterId: number }> {
        logger.info(
            `Extracting courses for semester ${semesterId ?? "(auto-detect)"} from portal...`
        );

        let browser;
        try {
            browser = await this.launchBrowser();
            const context = await browser.newContext();
            const page = await context.newPage();
            page.setDefaultTimeout(90_000);
            page.setDefaultNavigationTimeout(90_000);

            await this.portalLogin(page, universityId, password);

            // Establish session on the student dashboard before opening offerings
            await this.gotoWithFallback(page, "https://ums.mu.edu.lb/Student/index.php", 60_000);

            // Open the offerings page (form loads first; semester must be chosen before List)
            const offeringsUrl = "https://ums.mu.edu.lb/Student/list_offering.php";
            try {
                await this.gotoWithFallback(page, offeringsUrl, 90_000);
            } catch (navErr: any) {
                const hasPartialContent = await page.$(
                    'select[name*="semester" i], button:has-text("List"), tbody tr, .dataTables_length select, form'
                );
                if (!hasPartialContent) {
                    throw navErr;
                }
                logger.warn(
                    `Offerings navigation timed out but page content is present — continuing extraction. (${navErr.message})`
                );
            }

            // Resolve semester: explicit arg → portal dropdown (selected or latest option)
            let activeSemesterId = semesterId;
            if (!activeSemesterId) {
                activeSemesterId = await this.detectSemesterFromOfferingsPage(page);
            }

            await this.selectSemesterOnOfferingsPage(page, activeSemesterId);
            await page.waitForTimeout(500);

            try {
                const listButton = await page.$(
                    'button.btn:has-text("List"), input[type="submit"][value="List"], .btn-primary:has-text("List"), button:has-text("List")'
                );
                if (listButton) {
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => null),
                        listButton.click(),
                    ]);
                    logger.info("Selected semester and clicked 'List' to load course offerings.");
                    await page.waitForTimeout(3000);
                } else {
                    logger.warn("Could not find 'List' button — course table may not load.");
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


            // 2c. Extract ALL courses from ALL tables (header-mapped columns + table category headings)
            await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => null);

            const extractResult = await page.evaluate((resolvedSemesterId) => {
                const extracted: any[] = [];
                const warnings: string[] = [];

                const normalizeHeader = (h: string) =>
                    h.toLowerCase().replace(/\s+/g, " ").trim();

                const resolveCol = (headers: string[], predicates: RegExp[]): number => {
                    for (let i = 0; i < headers.length; i++) {
                        const h = headers[i];
                        if (predicates.some((re) => re.test(h))) return i;
                    }
                    return -1;
                };

                const categoryFromTable = (table: Element): string => {
                    let previousElem = table.parentElement?.previousElementSibling as Element | null | undefined;
                    if (previousElem && previousElem.tagName === "H2") {
                        return previousElem.textContent?.trim() || "Unknown";
                    }
                    if (
                        previousElem &&
                        previousElem.tagName === "DIV" &&
                        previousElem.previousElementSibling?.tagName === "H2"
                    ) {
                        return previousElem.previousElementSibling.textContent?.trim() || "Unknown";
                    }
                    // DataTables often wrap the table; walk up a few levels
                    let el: Element | null = table.parentElement;
                    for (let depth = 0; depth < 4 && el; depth++) {
                        const prev = el.previousElementSibling;
                        if (prev?.tagName === "H2") {
                            return prev.textContent?.trim() || "Unknown";
                        }
                        if (prev?.tagName === "H3" || prev?.tagName === "H4") {
                            return prev.textContent?.trim() || "Unknown";
                        }
                        el = el.parentElement;
                    }
                    return "Unknown";
                };

                const tables = Array.from(document.querySelectorAll("table"));
                for (const table of tables) {
                    const category = categoryFromTable(table);
                    const headerCells = Array.from(
                        table.querySelectorAll("thead th, thead td, tr:first-child th")
                    );
                    let headers = headerCells.map((c) => normalizeHeader(c.textContent || ""));

                    // Fallback: first row may be header cells as <td>
                    if (headers.length === 0) {
                        const firstRow = table.querySelector("tr");
                        if (firstRow) {
                            headers = Array.from(firstRow.querySelectorAll("th, td")).map((c) =>
                                normalizeHeader(c.textContent || "")
                            );
                        }
                    }

                    const idx = {
                        courseCode: resolveCol(headers, [/^code$/, /course\s*code/, /^crs/]),
                        courseName: resolveCol(headers, [/^name$/, /course\s*name/, /title/, /description/]),
                        section: resolveCol(headers, [/^sec/, /section/]),
                        type: resolveCol(headers, [/^type$/]),
                        credits: resolveCol(headers, [/^cred/, /^cr$/]),
                        instructor: resolveCol(headers, [/instructor/, /teacher/, /faculty/]),
                        schedule: resolveCol(headers, [/schedule/, /timing/, /^time$/, /days?/]),
                        capacity: resolveCol(headers, [/capacit/, /^cap$/, /size/, /limit/]),
                        enrolled: resolveCol(headers, [/enroll/, /registered/, /taken/, /^reg$/]),
                        room: resolveCol(headers, [/room/, /location/, /venue/]),
                    };

                    // Legacy positional fallback when headers are missing/unrecognized
                    const useLegacy = idx.courseCode < 0 || idx.courseName < 0;
                    if (useLegacy && headers.length > 0) {
                        warnings.push(
                            `Table category="${category}" missing expected headers; using legacy column indices`
                        );
                    }

                    const rows = Array.from(table.querySelectorAll("tbody tr"));
                    // If no tbody, use all tr except header
                    const bodyRows =
                        rows.length > 0
                            ? rows
                            : Array.from(table.querySelectorAll("tr")).slice(headerCells.length > 0 ? 1 : 0);

                    for (const row of bodyRows) {
                        const columns = row.querySelectorAll("td");
                        if (columns.length < 5) continue;

                        const cell = (i: number) =>
                            i >= 0 && i < columns.length ? columns[i].innerText.trim() : "";

                        let courseCode: string;
                        let courseName: string;
                        let section: string;
                        let type: string;
                        let credits: number;
                        let instructor: string;
                        let schedule: string;
                        let capacity: number;
                        let enrolled: number;
                        let room: string;

                        if (!useLegacy) {
                            courseCode = cell(idx.courseCode);
                            courseName = cell(idx.courseName);
                            section = cell(idx.section);
                            type = cell(idx.type) || "Lecture";
                            credits = parseInt(cell(idx.credits) || "0", 10) || 0;
                            instructor = cell(idx.instructor);
                            schedule = cell(idx.schedule);
                            capacity = parseInt(cell(idx.capacity) || "0", 10) || 0;
                            enrolled = parseInt(cell(idx.enrolled) || "0", 10) || 0;
                            room = cell(idx.room);
                        } else if (columns.length >= 12) {
                            courseCode = cell(1);
                            courseName = cell(2);
                            section = cell(3);
                            type = cell(4) || "Lecture";
                            credits = parseInt(cell(5) || "0", 10) || 0;
                            instructor = cell(6);
                            schedule = cell(8);
                            capacity = parseInt(cell(9) || "0", 10) || 0;
                            enrolled = parseInt(cell(10) || "0", 10) || 0;
                            room = cell(11);
                        } else {
                            continue;
                        }

                        // Skip header-like or total rows
                        if (!courseCode || !courseName) continue;
                        if (/^code$/i.test(courseCode) || /total/i.test(courseCode)) continue;

                        extracted.push({
                            courseCode,
                            courseName,
                            sectionNumber: section,
                            type,
                            category,
                            credits,
                            instructor,
                            schedule,
                            capacity,
                            enrolled,
                            room,
                            semesterId: resolvedSemesterId,
                        });
                    }
                }

                return { courses: extracted, warnings };
            }, activeSemesterId);

            for (const w of extractResult.warnings || []) {
                logger.warn(`Offerings extract: ${w}`);
            }

            const allCourses = extractResult.courses || [];
            if (allCourses.length === 0) {
                throw new Error(
                    `No course sections extracted from portal for semester ${activeSemesterId}. ` +
                        "The offerings table may have failed to load or the page layout changed."
                );
            }

            logger.info(`Successfully extracted a total of ${allCourses.length} course sections from portal.`);
            return { courses: allCourses, semesterId: activeSemesterId };

        } catch (error: any) {
            logger.error(`Error extracting courses from portal: ${error.message}`);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    static async extractHistory(universityId: string, password: string): Promise<PortalHistoryResult> {
        logger.info(`Extracting academic history for ${universityId} from portal...`);

        const HISTORY_URL = "https://ums.mu.edu.lb/Student/index.php";
        let browser;
        try {
            browser = await this.launchBrowser();
            const context = await browser.newContext();
            const page = await context.newPage();
            page.setDefaultTimeout(90_000);
            page.setDefaultNavigationTimeout(90_000);

            // 1. Login then open the student academic history page explicitly
            await this.portalLogin(page, universityId, password);
            await this.gotoWithFallback(page, HISTORY_URL, 60_000);

            // Ensure we landed on the student index (not login bounce / Main portal)
            const finalUrl = page.url();
            logger.info(`Academic history page loaded: ${finalUrl}`);
            if (!/\/Student\/index\.php/i.test(finalUrl)) {
                logger.warn(`Expected ${HISTORY_URL} but got ${finalUrl} — retrying navigation`);
                await this.gotoWithFallback(page, HISTORY_URL, 60_000);
                logger.info(`Retry landed on: ${page.url()}`);
            }

            // Wait for tables / profile widgets that carry course history & GPA
            await page.waitForSelector("table.table-bordered, table, .panel, .profile", {
                timeout: 20_000,
            }).catch(() => null);
            await page.waitForTimeout(1500);

            // 2. Extract course rows + last Cumulative GPA cell from Student/index.php tables
            const { courses, gpa, gpaDebug } = await page.evaluate(() => {
                const tables = Array.from(
                    document.querySelectorAll("table.table-bordered, table")
                );
                const extracted: Array<{
                    courseCode: string;
                    courseName: string;
                    credits: number;
                    status: string;
                    category: string;
                }> = [];

                const parseGpa = (raw: string): number | null => {
                    const m = raw.replace(/,/g, ".").match(/(\d+\.\d{1,2}|\d)/);
                    if (!m) return null;
                    const value = parseFloat(m[1]);
                    // Accept 0–4 scale decimals; allow whole 4 / reject bare semester "1" unless typed as 1.0+
                    if (Number.isNaN(value) || value <= 0 || value > 4) return null;
                    if (!raw.includes(".") && !raw.includes(",") && value < 2) return null;
                    return Math.round(value * 100) / 100;
                };

                const isCumulativeLabel = (text: string): boolean =>
                    /cumulative|cgpa|accumulat/i.test(text.trim());

                // All cumulative GPA values in document order — we keep the LAST one
                const cumulativeValues: Array<{ value: number; source: string }> = [];
                const debugLines: string[] = [];

                tables.forEach((table, tableIndex) => {
                    const isHistoryTable = table.classList.contains("table-bordered");

                    let category = "Unknown";
                    let previousElem = table.parentElement?.previousElementSibling;
                    if (previousElem && previousElem.tagName === "H2") {
                        category = previousElem.textContent?.trim() || "Unknown";
                    } else if (
                        previousElem &&
                        previousElem.tagName === "DIV" &&
                        previousElem.previousElementSibling?.tagName === "H2"
                    ) {
                        category = previousElem.previousElementSibling.textContent?.trim() || "Unknown";
                    }

                    const headerCells = Array.from(
                        table.querySelectorAll("thead th, thead td, tr:first-child th, tr:first-child td")
                    );
                    const headers = headerCells.map((c) => (c.textContent || "").trim());
                    const cumulativeCol = headers.findIndex((h) => isCumulativeLabel(h));

                    if (cumulativeCol >= 0) {
                        debugLines.push(
                            `table[${tableIndex}] cumulative column ${cumulativeCol} ("${headers[cumulativeCol]}")`
                        );
                    }

                    const rows = Array.from(table.querySelectorAll("tr"));
                    rows.forEach((row, rowIndex) => {
                        const columns = Array.from(
                            row.querySelectorAll("td, th")
                        ) as HTMLElement[];
                        if (columns.length === 0) return;

                        // Course extraction — only bordered academic-history tables
                        if (
                            isHistoryTable &&
                            columns.length >= 5 &&
                            columns[0].tagName.toLowerCase() === "td"
                        ) {
                            const courseCode = columns[1]?.innerText.trim() || "";
                            const courseName = columns[2]?.innerText.trim() || "";
                            const credits = parseFloat(columns[3]?.innerText.trim() || "") || 0;
                            const status = columns[4]?.innerText.trim() || "";
                            if (
                                courseCode &&
                                courseCode !== "Total Credits" &&
                                !isCumulativeLabel(courseCode) &&
                                !/total/i.test(courseCode)
                            ) {
                                extracted.push({
                                    courseCode,
                                    courseName,
                                    credits,
                                    status,
                                    category,
                                });
                            }
                        }

                        // Path 1: dedicated Cumulative column — take every numeric cell (last wins)
                        if (cumulativeCol >= 0 && cumulativeCol < columns.length) {
                            const cellText = (columns[cumulativeCol].textContent || "").trim();
                            const value = parseGpa(cellText);
                            if (value != null) {
                                cumulativeValues.push({
                                    value,
                                    source: `t${tableIndex}.r${rowIndex}.c${cumulativeCol}="${cellText}"`,
                                });
                            }
                        }

                        // Path 2: row labeled Cumulative / CGPA — value in same, next, or last cell
                        for (let i = 0; i < columns.length; i++) {
                            const label = (columns[i].textContent || "").trim();
                            if (!isCumulativeLabel(label)) continue;

                            const sameCell = parseGpa(label);
                            if (sameCell != null) {
                                cumulativeValues.push({
                                    value: sameCell,
                                    source: `t${tableIndex}.r${rowIndex}.same="${label.slice(0, 40)}"`,
                                });
                            }

                            if (i + 1 < columns.length) {
                                const nextText = (columns[i + 1].textContent || "").trim();
                                const nextVal = parseGpa(nextText);
                                if (nextVal != null) {
                                    cumulativeValues.push({
                                        value: nextVal,
                                        source: `t${tableIndex}.r${rowIndex}.next="${label}"→"${nextText}"`,
                                    });
                                }
                            }

                            const lastText = (columns[columns.length - 1].textContent || "").trim();
                            const lastVal = parseGpa(lastText);
                            if (lastVal != null && lastText !== label) {
                                cumulativeValues.push({
                                    value: lastVal,
                                    source: `t${tableIndex}.r${rowIndex}.lastCell="${lastText}"`,
                                });
                            }
                        }
                    });
                });

                const scrapedGpa =
                    cumulativeValues.length > 0
                        ? cumulativeValues[cumulativeValues.length - 1].value
                        : null;

                if (cumulativeValues.length) {
                    debugLines.push(
                        ...cumulativeValues.map((v) => `${v.source} => ${v.value}`)
                    );
                    debugLines.push(`SELECTED last cumulative => ${scrapedGpa}`);
                } else {
                    debugLines.push("No cumulative GPA cell found in tables");
                }

                return {
                    courses: extracted,
                    gpa: scrapedGpa,
                    gpaDebug: debugLines.slice(0, 50),
                };
            });

            logger.info(
                `History page ${page.url()} → ${courses.length} courses` +
                    (gpa != null ? `, last Cumulative GPA ${gpa}` : ", Cumulative GPA not found")
            );
            if (gpaDebug?.length) {
                logger.info(`GPA scrape debug: ${JSON.stringify(gpaDebug)}`);
            }

            return { courses, gpa };
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
