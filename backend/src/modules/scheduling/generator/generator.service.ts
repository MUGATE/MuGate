import { pool } from "../../../core/database/connection";
import { CS_CURRICULUM, CurriculumCourse } from "./curriculum";
import { logger } from "../../../core/logger/logger";
import { HistoryService } from "../../history/history.service";
import { CoursesService } from "../../academic/courses/courses.service";
import { env } from "../../../config/env";
import { isCompletedStatus } from "../../../core/utils/academic-status.util";

export class GeneratorService {

    private static async getLatestSemesterFromDb(): Promise<number | undefined> {
        const result = await pool.request().query(`
            SELECT semester FROM Courses
            WHERE semester IS NOT NULL AND semester <> ''
            ORDER BY CASE WHEN semester ~ '^[0-9]+$' THEN semester::int ELSE NULL END DESC NULLS LAST
            LIMIT 1
        `);
        const val = parseInt(result.recordset[0]?.semester, 10);
        return !isNaN(val) && val > 0 ? val : undefined;
    }

    private static async hasCachedOfferings(semesterId: number): Promise<boolean> {
        const result = await pool.request()
            .input("semester", semesterId.toString())
            .query(`
                SELECT COUNT(*) as cnt
                FROM CourseSections s
                INNER JOIN Courses c ON c.id = s.courseId
                WHERE c.semester = @semester
            `);
        return (result.recordset[0]?.cnt ?? 0) > 0;
    }

    /**
     * Determine which courses from the curriculum a student is eligible to take.
     * This considers passed history and prerequisite chains.
     */
    static async getEligibleCourses(userId: string): Promise<CurriculumCourse[]> {
        logger.info(`Calculating eligible courses for user ${userId}`);

        // 1. Fetch academic history (filter completed in code for legacy portal strings)
        const historyResult = await pool.request()
            .input("userId", userId)
            .query("SELECT courseCode, status, category FROM AcademicHistory WHERE userId = @userId");

        // Helper function to normalize course codes (removes all spaces and capitalizes)
        const normalizeCode = (code: string) => code.replace(/\s+/g, '').toUpperCase();

        const passedCourses = new Set<string>();
        // Tracks electives of each category the user has already passed
        const fulfilledElectivesByCategory: Record<string, string[]> = {};

        historyResult.recordset
            .filter((record: any) => isCompletedStatus(record.status))
            .forEach((record: any) => {
            passedCourses.add(normalizeCode(record.courseCode));

            // If the course has an elective category, track it
            if (record.category && record.category.includes("Elective")) {
                // Safeguard: Check if this course is actually hardcoded in the curriculum as a mandatory GER/Major
                const hardcodedMatch = CS_CURRICULUM.find(c => c.courseCode.replace(/\s+/g, '').toUpperCase() === normalizeCode(record.courseCode));
                if (!hardcodedMatch || hardcodedMatch.type === 'Elective') {
                    const catStr = record.category.trim();
                    if (!fulfilledElectivesByCategory[catStr]) fulfilledElectivesByCategory[catStr] = [];
                    fulfilledElectivesByCategory[catStr].push(normalizeCode(record.courseCode));
                }
            }
        });

        // 2. Determine eligibility based on curriculum
        const eligibleCourses: CurriculumCourse[] = [];

        // Tracks which specific passed electives have already been assigned to a placeholder
        const consumedPassedElectives = new Set<string>();

        for (const course of CS_CURRICULUM) {

            // Handle generic elective slots
            if (course.isElectivePlaceholder && course.category) {
                const catStr = course.category;
                const passedEquivalents = fulfilledElectivesByCategory[catStr] || [];

                let matchedIndex = -1;
                for (let i = 0; i < passedEquivalents.length; i++) {
                    const passedCode = passedEquivalents[i];
                    // Skip if already consumed by a previous placeholder
                    if (consumedPassedElectives.has(passedCode + '_' + i)) continue;

                    // If this placeholder has strict constraints, the passed course must match one of them
                    if (course.allowedCodes) {
                        const normalizedAllowed = course.allowedCodes.map(code => code.replace(/\s+/g, '').toUpperCase());
                        if (normalizedAllowed.includes(passedCode)) {
                            matchedIndex = i;
                            break;
                        }
                    } else {
                        // Any passed course in this category works
                        matchedIndex = i;
                        break;
                    }
                }

                if (matchedIndex !== -1) {
                    // They have already taken an actual course to fill this slot
                    consumedPassedElectives.add(passedEquivalents[matchedIndex] + '_' + matchedIndex);
                    continue;
                } else {
                    // They haven't filled this slot yet, so it is an eligible requirement
                    eligibleCourses.push(course);
                    continue;
                }
            }

            // Normal fixed-code courses
            const courseCodeNorm = normalizeCode(course.courseCode);

            // If already passed, skip
            if (passedCourses.has(courseCodeNorm)) continue;

            // Check prerequisites (must be PASSED)
            let prereqsMet = true;
            for (const prereq of course.prerequisites) {
                if (!passedCourses.has(normalizeCode(prereq))) {
                    prereqsMet = false;
                    break;
                }
            }

            if (prereqsMet) {
                eligibleCourses.push(course);
            }
        }

        // Second pass: validate corequisites
        // A corequisite is met if it is PASSED or is also in the eligible list (can be taken concurrently)
        const eligibleCodes = new Set(eligibleCourses.map(c => normalizeCode(c.courseCode)));
        const finalEligible = eligibleCourses.filter(course => {
            if (!course.corequisites || course.corequisites.length === 0) return true;

            for (const coreq of course.corequisites) {
                const coreqNorm = normalizeCode(coreq);
                if (!passedCourses.has(coreqNorm) && !eligibleCodes.has(coreqNorm)) {
                    logger.info(`Excluding ${course.courseCode}: corequisite ${coreq} is neither passed nor eligible`);
                    return false;
                }
            }
            return true;
        });

        logger.info(`Found ${finalEligible.length} eligible courses for user ${userId}`);
        return finalEligible;
    }

    /**
     * Main algorithm entry point: Generate optimal, conflict-free schedules
     */
    static async generateSchedules(userId: string, semesterId?: number, preferences: any = {}) {
        let activeSemesterId = semesterId ?? env.currentSemesterId;

        // Step 0a: Ensure the user has academic history scraped — if empty, scrape now
        const historyCheck = await pool.request()
            .input("userId", userId)
            .query("SELECT COUNT(*) as cnt FROM AcademicHistory WHERE userId = @userId");

        if (historyCheck.recordset[0].cnt === 0) {
            logger.info(`No academic history found for user ${userId}, triggering auto-scrape...`);
            try {
                await HistoryService.syncStudentHistoryFromPortal(userId);
                logger.info(`Successfully scraped history for user ${userId} before generation.`);
            } catch (err: any) {
                logger.warn(`Failed to auto-scrape history for ${userId}: ${err.message}`);
                throw new Error(
                    "Unable to load your academic history from the MU Portal. Please try again after logging in successfully, or sync history from your profile."
                );
            }

            const after = await pool.request()
                .input("userId", userId)
                .query("SELECT COUNT(*) as cnt FROM AcademicHistory WHERE userId = @userId");
            if (after.recordset[0].cnt === 0) {
                throw new Error(
                    "No academic history is available yet. Schedule generation cannot run without your course history."
                );
            }
        }

        // Step 0b: Sync offerings from portal unless we already have cached sections for this semester
        const forceSync = process.env.FORCE_COURSE_SYNC === "true";
        let shouldSync = forceSync;

        if (!shouldSync) {
            const cachedSemester = activeSemesterId ?? await this.getLatestSemesterFromDb();
            if (cachedSemester && await this.hasCachedOfferings(cachedSemester)) {
                activeSemesterId = cachedSemester;
                logger.info(`Using cached course offerings for semester ${activeSemesterId} (skipping portal sync)`);
            } else {
                shouldSync = true;
            }
        }

        if (shouldSync) {
            try {
                logger.info(
                    `Auto-syncing courses for semester ${activeSemesterId ?? "(auto-detect)"} before generation...`
                );
                activeSemesterId = await CoursesService.syncCoursesFromPortal(userId, activeSemesterId);
                logger.info(`Course sync completed for semester ${activeSemesterId}.`);
            } catch (err: any) {
                logger.warn(`Course auto-sync failed (using existing DB data): ${err.message}`);
                if (!activeSemesterId) {
                    activeSemesterId = await this.getLatestSemesterFromDb();
                }
            }
        }

        if (!activeSemesterId) {
            throw new Error(
                "Could not determine the current semester. Please try again or set CURRENT_SEMESTER_ID in the server environment."
            );
        }

        // Step 1: Get what they *can* take
        const eligibleCourses = await this.getEligibleCourses(userId);

        // Fetch passed courses to validate corequisites during backtracking
        const historyResult = await pool.request()
            .input("userId", userId)
            .query("SELECT courseCode, status FROM AcademicHistory WHERE userId = @userId");
        const passedCourses = new Set<string>();
        historyResult.recordset
            .filter((row: any) => isCompletedStatus(row.status))
            .forEach((row: any) => {
            passedCourses.add(row.courseCode.replace(/\s+/g, '').toUpperCase());
        });

        // Step 2: Fetch actual offerings for this semester that match eligible courses
        // We need to fetch from Courses and CourseSections where semester = semesterId
        const eligibleCodes = eligibleCourses
            .filter(c => !c.isElectivePlaceholder)
            .map(c => c.courseCode.replace(/\s+/g, '').toUpperCase());

        const electiveCategories = eligibleCourses
            .filter(c => c.isElectivePlaceholder && c.category)
            .map(c => c.category!.trim().toLowerCase());

        const electiveLimits: Record<string, number> = {};
        const freeElectiveLimits: Record<string, number> = {}; // Only free slots (no allowedCodes)
        for (const cat of electiveCategories) {
            electiveLimits[cat] = (electiveLimits[cat] || 0) + 1;
        }
        // Count free slots — placeholders without allowedCodes
        for (const placeholder of eligibleCourses.filter(c => c.isElectivePlaceholder && c.category)) {
            const cat = placeholder.category!.trim().toLowerCase();
            if (!placeholder.allowedCodes) {
                freeElectiveLimits[cat] = (freeElectiveLimits[cat] || 0) + 1;
            }
        }

        logger.info(`Elective limits: ${JSON.stringify(electiveLimits)}`);
        logger.info(`Eligible elective categories: ${JSON.stringify(electiveCategories)}`);
        logger.info(`Eligible fixed courses: ${eligibleCodes.join(', ')}`);
        logger.info(`Eligible placeholders: ${eligibleCourses.filter(c => c.isElectivePlaceholder).map(c => `${c.courseCode}(${c.category})`).join(', ')}`);

        logger.info(`Fetching available offerings for semester ${activeSemesterId}...`);

        const offeringsResult = await pool.request()
            .input("semester", activeSemesterId.toString())
            .query(`
                SELECT 
                    c.id as courseId, c.courseCode, c.courseName, c.credits, c.department,
                    s.id as sectionId, s.sectionNumber, s.instructor, s.day, s.startTime, s.endTime, s.type, s.capacity, s.enrolled, s.room
                FROM Courses c
                INNER JOIN CourseSections s ON c.id = s.courseId
                WHERE c.semester = @semester
            `);

        // Group sections by Course
        const availableCoursesWithSections = new Map<string, any>();

        offeringsResult.recordset.forEach(row => {
            const courseCodeNorm = row.courseCode.replace(/\s+/g, '').toUpperCase();

            // Check if this offered course matches an eligible requirement
            let isEligible = false;
            let matchingType = 'Major';

            // 1. Is it a direct course match?
            if (eligibleCodes.includes(courseCodeNorm)) {
                isEligible = true;
                const match = eligibleCourses.find(c => c.courseCode.replace(/\s+/g, '').toUpperCase() === courseCodeNorm);
                if (match) matchingType = match.type;
            }
            // 2. Is it an elective that fills an open placeholder?
            else if (row.type && electiveCategories.includes(row.type.trim().toLowerCase())) {
                const categoryRaw = row.type.trim().toLowerCase();

                // Find all placeholders of this specific category that haven't been fulfilled yet
                const matchingPlaceholders = eligibleCourses.filter(c =>
                    c.isElectivePlaceholder && c.category?.trim().toLowerCase() === categoryRaw
                );

                if (matchingPlaceholders.length > 0) {
                    // Check if *any* of the open placeholders will accept this course
                    let acceptedByAnyPlaceholder = false;
                    let isFreeSlotOnly = false;
                    for (const placeholder of matchingPlaceholders) {
                        if (placeholder.allowedCodes) {
                            // This placeholder only accepts specific codes
                            const normalizedAllowed = placeholder.allowedCodes.map(code => code.replace(/\s+/g, '').toUpperCase());
                            if (normalizedAllowed.includes(courseCodeNorm)) {
                                acceptedByAnyPlaceholder = true;
                                isFreeSlotOnly = false; // Matches a restricted slot — not limited by free count
                                break;
                            }
                        }
                    }
                    // If not accepted by any restricted placeholder, check free slots
                    if (!acceptedByAnyPlaceholder) {
                        for (const placeholder of matchingPlaceholders) {
                            if (!placeholder.allowedCodes) {
                                acceptedByAnyPlaceholder = true;
                                isFreeSlotOnly = true; // Can only fill a free slot
                                break;
                            }
                        }
                    }

                    if (!acceptedByAnyPlaceholder) return; // Blocked

                    isEligible = true;
                    // Tag free-slot-only electives with a special suffix so the backtracker can enforce free limits
                    matchingType = isFreeSlotOnly ? categoryRaw + ':free' : categoryRaw;
                }
            }

            if (!isEligible) {
                if (courseCodeNorm === 'MAT350') logger.info(`MAT350 dropped: not eligible. courseCodeNorm=${courseCodeNorm}`);
                return;
            }

            // Only consider sections with open seats
            if (row.capacity > 0 && row.enrolled >= row.capacity) {
                if (courseCodeNorm === 'MAT350') logger.info(`MAT350 dropped: full. cap=${row.capacity}, enr=${row.enrolled}`);
                return;
            }

            // Filter out A- rooms (annex building, not valid)
            // Also filter out null/empty/TBA rooms — these are A- building sections with unassigned rooms
            const roomVal = row.room ? row.room.trim() : '';
            if (!roomVal || roomVal.toUpperCase() === 'TBA' || roomVal.toUpperCase() === 'T B A' || roomVal.toUpperCase().startsWith('A-')) {
                return;
            }

            if (courseCodeNorm === 'MAT350') logger.info(`MAT350 SURVIVED! Adding to availableCourses...`);

            if (!availableCoursesWithSections.has(courseCodeNorm)) {
                const match = eligibleCourses.find(c => c.courseCode.replace(/\s+/g, '').toUpperCase() === courseCodeNorm);
                availableCoursesWithSections.set(courseCodeNorm, {
                    courseId: row.courseId,
                    courseCode: row.courseCode,
                    courseName: row.courseName,
                    credits: row.credits,
                    type: matchingType, // Inherit type from curriculum mapping or offering
                    corequisites: match ? match.corequisites : [],
                    sections: []
                });
            }

            availableCoursesWithSections.get(courseCodeNorm).sections.push({
                sectionId: row.sectionId,
                sectionNumber: row.sectionNumber,
                instructor: row.instructor,
                day: row.day,
                startTime: row.startTime,
                endTime: row.endTime,
                type: row.type,
                room: row.room
            });
        });

        // Convert Map to Array for the backtracking engine
        const coursesToSchedule = Array.from(availableCoursesWithSections.values());

        logger.info(`Found ${coursesToSchedule.length} available eligible courses with open sections.`);
        logger.info(`Courses to schedule keys: ${Array.from(availableCoursesWithSections.keys()).join(", ")}`);

        // --- Helper: Conflict Checker ---
        // SQL Server returns TIME as a string or Date obj depending on the driver, 
        // but typically e.g. "17:30:00". We'll convert to simple total minutes for safe comparison.
        const timeToMinutes = (timeValue: any): number => {
            if (!timeValue) return 0;
            // If it's a Date object (mssql tedious sometimes casts it), get UTC
            if (timeValue instanceof Date) {
                return (timeValue.getUTCHours() * 60) + timeValue.getUTCMinutes();
            }
            // If it's a string like "17:30:00"
            const str = timeValue.toString();
            const parts = str.split(":");
            if (parts.length >= 2) {
                return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
            }
            return 0;
        };

        const filteredCoursesToSchedule: any[] = [];
        const dayMap: Record<string, number> = { 'M': 0, 'T': 1, 'W': 2, 'TH': 3, 'F': 4, 'S': 5 };

        for (const course of coursesToSchedule) {
            const validSections = course.sections.filter((sec: any) => {
                // If the user wants no classes on a specific day
                if (preferences?.excludeDays && preferences.excludeDays.length > 0 && sec.day) {
                    const secDays = sec.day.split(",");
                    if (secDays.some((d: string) => preferences.excludeDays.includes(dayMap[d.trim().toUpperCase()]))) return false;
                }

                // If the user wants no classes before a specific time
                if (preferences?.startTime && timeToMinutes(sec.startTime) < timeToMinutes(preferences.startTime)) return false;

                return true;
            });

            if (validSections.length > 0) {
                // Keep the course only if it still has valid sections available
                course.sections = validSections;
                filteredCoursesToSchedule.push(course);
            }
        }

        const hasTimeConflict = (currentSchedule: any[], newSection: any): boolean => {
            const newStart = timeToMinutes(newSection.startTime);
            const newEnd = timeToMinutes(newSection.endTime);

            // Time conflict doesn't apply to purely online/TBA courses that have no time
            if (newStart === 0 && newEnd === 0) return false;

            const newDays: string[] = newSection.day ? newSection.day.split(",") : [];

            for (const scheduledCourse of currentSchedule) {
                const sSec = scheduledCourse.section;
                const existingDays: string[] = sSec.day ? sSec.day.split(",") : [];

                const sharedDays = existingDays.filter((d: string) => newDays.includes(d) && d !== "TBA");

                if (sharedDays.length > 0) {
                    const existingStart = timeToMinutes(sSec.startTime);
                    const existingEnd = timeToMinutes(sSec.endTime);

                    // If times overlap on ANY shared day, conflict!
                    // (newStart < existingEnd AND newEnd > existingStart)
                    if (newStart < existingEnd && newEnd > existingStart) {
                        return true; // Conflict found
                    }
                }
            }
            return false;
        };

        // Step 4: Backtracking Cartesian Engine
        const MAX_CREDITS = preferences?.maxCredits || 17;
        const generatedSchedules: any[] = [];

        const backtrack = (courseIndex: number, currentSchedule: any[], currentCredits: number, currentElectiveCounts: Record<string, number>) => {
            // Stop generating if we hit the credit limit
            if (currentCredits > MAX_CREDITS) return;

            // If we've made decisions for all available courses or we hit the maximum reasonable credits, save it
            if (courseIndex === filteredCoursesToSchedule.length) {
                if (currentSchedule.length > 0) {
                    // Validate mutual corequisites
                    const scheduledCodes = new Set(currentSchedule.map(item => item.course.courseCode.replace(/\s+/g, '').toUpperCase()));
                    let isValid = true;
                    for (const item of currentSchedule) {
                        for (const coreq of item.course.corequisites || []) {
                            const coreqNorm = coreq.replace(/\s+/g, '').toUpperCase();
                            if (!passedCourses.has(coreqNorm) && !scheduledCodes.has(coreqNorm)) {
                                isValid = false;
                                break;
                            }
                        }
                        if (!isValid) break;
                    }
                    if (isValid) {
                        generatedSchedules.push([...currentSchedule]);
                    }
                }
                return;
            }

            const course = filteredCoursesToSchedule[courseIndex];

            // Branch 1: Skip taking this course this semester
            backtrack(courseIndex + 1, currentSchedule, currentCredits, { ...currentElectiveCounts });

            // Branch 2: Try to take this course by iterating over its available sections
            if (currentCredits + course.credits <= MAX_CREDITS) {
                // Check if this course is an elective that hit its limit
                const typeNorm = course.type.trim().toLowerCase();
                const baseCat = typeNorm.replace(':free', '');
                const isElective = Object.keys(electiveLimits).includes(baseCat);

                if (isElective) {
                    // Check overall category limit
                    if ((currentElectiveCounts[baseCat] || 0) >= (electiveLimits[baseCat] || 0)) {
                        return; // Cannot add any more electives of this category
                    }
                    // Check free-slot limit (courses that don't match restricted allowedCodes)
                    if (typeNorm.endsWith(':free')) {
                        if ((currentElectiveCounts[typeNorm] || 0) >= (freeElectiveLimits[baseCat] || 0)) {
                            return; // Cannot add more free-slot electives of this category
                        }
                    }
                }

                // If adding, increment the count for the next recursive call
                const nextElectiveCounts = { ...currentElectiveCounts };
                if (isElective) {
                    nextElectiveCounts[baseCat] = (nextElectiveCounts[baseCat] || 0) + 1;
                    if (typeNorm.endsWith(':free')) {
                        nextElectiveCounts[typeNorm] = (nextElectiveCounts[typeNorm] || 0) + 1;
                    }
                }

                for (const section of course.sections) {
                    if (!hasTimeConflict(currentSchedule, section)) {
                        // Choose
                        currentSchedule.push({ course, section });
                        // Explore
                        backtrack(courseIndex + 1, currentSchedule, currentCredits + course.credits, nextElectiveCounts);
                        // Un-choose (backtrack)
                        currentSchedule.pop();
                    }
                }
            }
        };

        logger.info("Running backtracking engine...");
        backtrack(0, [], 0, {});

        // Step 5: Scoring (Prioritize Majors > Course Count > Credits > Compactness)
        const scoredSchedules = generatedSchedules.map(schedule => {
            let score = 0;
            let majorCredits = 0;
            let totalCredits = 0;
            let courseCount = schedule.length;
            let daysOnCampus = new Set<string>();

            schedule.forEach((item: any) => {
                totalCredits += item.course.credits;
                if (item.section.day) {
                    item.section.day.split(",").forEach((d: string) => {
                        if (d !== "TBA") daysOnCampus.add(d);
                    });
                }
                // Heavy priority for Major courses
                if (item.course.type === 'Major') {
                    majorCredits += item.course.credits;
                    score += (item.course.credits * 10);
                } else {
                    score += (item.course.credits * 5); // Still good to take electives
                }

                // Bonus per course — rewards 0-credit courses (e.g., Capstone Project Proposal)
                // that contribute academic progress even without credits
                score += 8;
                if (item.course.credits === 0) {
                    score += 15; // Extra incentive: 0-credit courses are still valuable for progress
                }
            });

            // Compactness Bonus: Less days on campus = higher score
            const daysCount = daysOnCampus.size;
            score += ((5 - daysCount) * 5); // If 2 days on campus, (3 * 5) = +15 bonus.

            // Reward actually getting close to the 17 credit limit
            score += totalCredits;

            return {
                schedule: schedule.map((item: any) => ({
                    courseId: item.course.courseId,
                    courseCode: item.course.courseCode,
                    courseName: item.course.courseName,
                    credits: item.course.credits,
                    type: item.course.type,
                    section: item.section
                })),
                totalCredits,
                majorCredits,
                daysOnCampus: Array.from(daysOnCampus),
                score
            };
        });

        // Strict Filter: Two Days Only
        let finalSchedules = scoredSchedules;
        if (preferences?.twoDaysOnly) {
            finalSchedules = scoredSchedules.filter(s => s.daysOnCampus.length <= 2);
        }

        // Sort by highest score first
        finalSchedules.sort((a, b) => b.score - a.score);

        // return top 20 distinct schedules
        const topSchedules = finalSchedules.slice(0, 20);

        logger.info(`Generated ${generatedSchedules.length} valid combinations. Returning top ${topSchedules.length}.`);

        return {
            status: "success",
            semesterId: activeSemesterId,
            eligibleCount: eligibleCourses.length,
            offeringsFound: coursesToSchedule.length,
            validCombinations: generatedSchedules.length,
            topSchedules
        };
    }
}
