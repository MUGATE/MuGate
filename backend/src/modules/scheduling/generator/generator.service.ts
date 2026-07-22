import { pool } from "../../../core/database/connection";
import { CurriculumCourse } from "./curriculum";
import {
    computeEligibleCourses,
    corequisitesMetInSchedule,
    normalizeCourseCode,
    normalizeElectiveCategory,
} from "./eligibility";
import { logger } from "../../../core/logger/logger";
import { HistoryService } from "../../history/history.service";
import { CoursesService, OFFERINGS_CACHE_TTL_MS } from "../../academic/courses/courses.service";
import { env } from "../../../config/env";
import {
    isCompletedStatus,
    normalizeAcademicStatus,
} from "../../../core/utils/academic-status.util";
import {
    hasOpenSeats,
    normalizeDayList,
    sectionsHaveTimeConflict,
    timeToMinutes,
} from "../../../core/utils/schedule-parse.util";

const MAX_GENERATED_COMBOS = 8000;

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
     */
    static async getEligibleCourses(userId: string): Promise<CurriculumCourse[]> {
        logger.info(`Calculating eligible courses for user ${userId}`);

        const historyResult = await pool.request()
            .input("userId", userId)
            .query("SELECT courseCode, status, category FROM AcademicHistory WHERE userId = @userId");

        const finalEligible = computeEligibleCourses(historyResult.recordset);
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

        // Step 0b: Sync offerings when missing or stale (TTL), unless FORCE_COURSE_SYNC
        const forceSync = process.env.FORCE_COURSE_SYNC === "true";
        let shouldSync = forceSync;

        if (!shouldSync) {
            const cachedSemester = activeSemesterId ?? await this.getLatestSemesterFromDb();
            if (cachedSemester && await this.hasCachedOfferings(cachedSemester)) {
                const fresh = await CoursesService.areOfferingsFresh(cachedSemester, OFFERINGS_CACHE_TTL_MS);
                if (fresh) {
                    activeSemesterId = cachedSemester;
                    logger.info(
                        `Using fresh cached offerings for semester ${activeSemesterId} (TTL ${OFFERINGS_CACHE_TTL_MS / 60000}m)`
                    );
                } else {
                    activeSemesterId = cachedSemester;
                    shouldSync = true;
                    logger.info(`Cached offerings for semester ${activeSemesterId} are stale — refreshing`);
                }
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

        await CoursesService.ensureSectionSchema();

        const eligibleCourses = await this.getEligibleCourses(userId);

        const historyResult = await pool.request()
            .input("userId", userId)
            .query("SELECT courseCode, status FROM AcademicHistory WHERE userId = @userId");
        const passedCourses = new Set<string>();
        const failedCourses = new Set<string>();
        historyResult.recordset.forEach((row: any) => {
            const code = normalizeCourseCode(row.courseCode);
            if (isCompletedStatus(row.status)) passedCourses.add(code);
            else if (normalizeAcademicStatus(row.status) === "Failed") failedCourses.add(code);
        });

        const eligibleCodes = eligibleCourses
            .filter(c => !c.isElectivePlaceholder)
            .map(c => normalizeCourseCode(c.courseCode));

        const electiveCategories = eligibleCourses
            .filter(c => c.isElectivePlaceholder && c.category)
            .map(c => normalizeElectiveCategory(c.category));

        const electiveLimits: Record<string, number> = {};
        const freeElectiveLimits: Record<string, number> = {};
        for (const cat of electiveCategories) {
            electiveLimits[cat] = (electiveLimits[cat] || 0) + 1;
        }
        for (const placeholder of eligibleCourses.filter(c => c.isElectivePlaceholder && c.category)) {
            const cat = normalizeElectiveCategory(placeholder.category);
            if (!placeholder.allowedCodes) {
                freeElectiveLimits[cat] = (freeElectiveLimits[cat] || 0) + 1;
            }
        }

        logger.info(`Elective limits: ${JSON.stringify(electiveLimits)}`);
        logger.info(`Eligible elective categories: ${JSON.stringify(electiveCategories)}`);
        logger.info(`Eligible fixed courses: ${eligibleCodes.join(', ')}`);

        const offeringsResult = await pool.request()
            .input("semester", activeSemesterId.toString())
            .query(`
                SELECT 
                    c.id as courseId, c.courseCode, c.courseName, c.credits, c.department,
                    s.id as sectionId, s.sectionNumber, s.instructor, s.day, s.startTime, s.endTime,
                    s.type, s.category, s.meetings, s.capacity, s.enrolled, s.room
                FROM Courses c
                INNER JOIN CourseSections s ON c.id = s.courseId
                WHERE c.semester = @semester
            `);

        const availableCoursesWithSections = new Map<string, any>();

        offeringsResult.recordset.forEach(row => {
            const courseCodeNorm = normalizeCourseCode(row.courseCode);

            let isEligible = false;
            let matchingType = 'Major';

            if (eligibleCodes.includes(courseCodeNorm)) {
                isEligible = true;
                const match = eligibleCourses.find(c => normalizeCourseCode(c.courseCode) === courseCodeNorm);
                if (match) matchingType = match.type;
            } else {
                // Electives: match offering category (table heading), not Lecture/Lab type
                const offeringCategory = normalizeElectiveCategory(row.category);
                if (offeringCategory && electiveCategories.includes(offeringCategory)) {
                    const categoryRaw = offeringCategory;
                    const matchingPlaceholders = eligibleCourses.filter(c =>
                        c.isElectivePlaceholder &&
                        normalizeElectiveCategory(c.category) === categoryRaw
                    );

                    if (matchingPlaceholders.length > 0) {
                        let acceptedByAnyPlaceholder = false;
                        let isFreeSlotOnly = false;
                        for (const placeholder of matchingPlaceholders) {
                            if (placeholder.allowedCodes) {
                                const normalizedAllowed = placeholder.allowedCodes.map(normalizeCourseCode);
                                if (normalizedAllowed.includes(courseCodeNorm)) {
                                    acceptedByAnyPlaceholder = true;
                                    isFreeSlotOnly = false;
                                    break;
                                }
                            }
                        }
                        if (!acceptedByAnyPlaceholder) {
                            for (const placeholder of matchingPlaceholders) {
                                if (!placeholder.allowedCodes) {
                                    acceptedByAnyPlaceholder = true;
                                    isFreeSlotOnly = true;
                                    break;
                                }
                            }
                        }

                        if (!acceptedByAnyPlaceholder) return;

                        isEligible = true;
                        matchingType = isFreeSlotOnly ? categoryRaw + ':free' : categoryRaw;
                    }
                }
            }

            if (!isEligible) return;

            if (!hasOpenSeats(row.capacity, row.enrolled)) return;

            const roomVal = row.room ? row.room.trim() : '';
            if (!roomVal || roomVal.toUpperCase() === 'TBA' || roomVal.toUpperCase() === 'T B A' || roomVal.toUpperCase().startsWith('A-')) {
                return;
            }

            if (!availableCoursesWithSections.has(courseCodeNorm)) {
                const match = eligibleCourses.find(c => normalizeCourseCode(c.courseCode) === courseCodeNorm);
                availableCoursesWithSections.set(courseCodeNorm, {
                    courseId: row.courseId,
                    courseCode: row.courseCode,
                    courseName: row.courseName,
                    credits: row.credits,
                    type: matchingType,
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
                meetings: row.meetings,
                type: row.type,
                category: row.category,
                room: row.room
            });
        });

        const coursesToSchedule = Array.from(availableCoursesWithSections.values());
        logger.info(`Found ${coursesToSchedule.length} available eligible courses with open sections.`);

        const toTimeStr = (timeValue: any): string => {
            if (!timeValue) return "00:00:00";
            if (timeValue instanceof Date) {
                const h = timeValue.getUTCHours().toString().padStart(2, "0");
                const m = timeValue.getUTCMinutes().toString().padStart(2, "0");
                const s = timeValue.getUTCSeconds().toString().padStart(2, "0");
                return `${h}:${m}:${s}`;
            }
            return timeValue.toString();
        };

        const filteredCoursesToSchedule: any[] = [];
        const dayMap: Record<string, number> = { 'M': 0, 'T': 1, 'W': 2, 'TH': 3, 'F': 4, 'S': 5 };

        for (const course of coursesToSchedule) {
            const validSections = course.sections.filter((sec: any) => {
                sec.startTime = toTimeStr(sec.startTime);
                sec.endTime = toTimeStr(sec.endTime);

                if (preferences?.excludeDays && preferences.excludeDays.length > 0 && sec.day) {
                    const secDays = normalizeDayList(sec.day);
                    if (secDays.some((d: string) => preferences.excludeDays.includes(dayMap[d]))) return false;
                }

                if (preferences?.startTime && timeToMinutes(sec.startTime) < timeToMinutes(preferences.startTime)) {
                    // If multi-meeting, reject only if ANY meeting starts before preferred time
                    return false;
                }

                return true;
            });

            if (validSections.length > 0) {
                course.sections = validSections;
                filteredCoursesToSchedule.push(course);
            }
        }

        const hasTimeConflict = (currentSchedule: any[], newSection: any): boolean => {
            for (const scheduledCourse of currentSchedule) {
                if (sectionsHaveTimeConflict(scheduledCourse.section, newSection)) {
                    return true;
                }
            }
            return false;
        };

        const MAX_CREDITS = preferences?.maxCredits || 17;
        const generatedSchedules: any[] = [];
        let comboCapHit = false;

        const backtrack = (courseIndex: number, currentSchedule: any[], currentCredits: number, currentElectiveCounts: Record<string, number>) => {
            if (comboCapHit) return;
            if (currentCredits > MAX_CREDITS) return;

            if (courseIndex === filteredCoursesToSchedule.length) {
                if (currentSchedule.length > 0) {
                    const scheduledCodes = new Set(
                        currentSchedule.map(item => normalizeCourseCode(item.course.courseCode))
                    );
                    let isValid = true;
                    for (const item of currentSchedule) {
                        if (!corequisitesMetInSchedule(
                            item.course.corequisites,
                            passedCourses,
                            scheduledCodes,
                            failedCourses
                        )) {
                            isValid = false;
                            break;
                        }
                    }
                    if (isValid) {
                        if (generatedSchedules.length >= MAX_GENERATED_COMBOS) {
                            comboCapHit = true;
                            return;
                        }
                        generatedSchedules.push([...currentSchedule]);
                    }
                }
                return;
            }

            const course = filteredCoursesToSchedule[courseIndex];

            backtrack(courseIndex + 1, currentSchedule, currentCredits, { ...currentElectiveCounts });
            if (comboCapHit) return;

            if (currentCredits + course.credits <= MAX_CREDITS) {
                const typeNorm = course.type.trim().toLowerCase();
                const baseCat = typeNorm.replace(':free', '');
                const isElective = Object.keys(electiveLimits).includes(baseCat);

                if (isElective) {
                    if ((currentElectiveCounts[baseCat] || 0) >= (electiveLimits[baseCat] || 0)) {
                        return;
                    }
                    if (typeNorm.endsWith(':free')) {
                        if ((currentElectiveCounts[typeNorm] || 0) >= (freeElectiveLimits[baseCat] || 0)) {
                            return;
                        }
                    }
                }

                const nextElectiveCounts = { ...currentElectiveCounts };
                if (isElective) {
                    nextElectiveCounts[baseCat] = (nextElectiveCounts[baseCat] || 0) + 1;
                    if (typeNorm.endsWith(':free')) {
                        nextElectiveCounts[typeNorm] = (nextElectiveCounts[typeNorm] || 0) + 1;
                    }
                }

                for (const section of course.sections) {
                    if (!hasTimeConflict(currentSchedule, section)) {
                        currentSchedule.push({ course, section });
                        backtrack(courseIndex + 1, currentSchedule, currentCredits + course.credits, nextElectiveCounts);
                        currentSchedule.pop();
                        if (comboCapHit) return;
                    }
                }
            }
        };

        logger.info("Running backtracking engine...");
        backtrack(0, [], 0, {});
        if (comboCapHit) {
            logger.warn(`Backtracking hit combo cap (${MAX_GENERATED_COMBOS}); scoring partial result set.`);
        }

        const scoredSchedules = generatedSchedules.map(schedule => {
            let score = 0;
            let majorCredits = 0;
            let totalCredits = 0;
            const daysOnCampus = new Set<string>();

            schedule.forEach((item: any) => {
                totalCredits += item.course.credits;
                if (item.section.day) {
                    normalizeDayList(item.section.day).forEach((d: string) => {
                        if (d !== "TBA") daysOnCampus.add(d);
                    });
                }
                if (item.course.type === 'Major') {
                    majorCredits += item.course.credits;
                    score += (item.course.credits * 10);
                } else {
                    score += (item.course.credits * 5);
                }

                score += 8;
                if (item.course.credits === 0) {
                    score += 15;
                }
            });

            const daysCount = daysOnCampus.size;
            score += ((5 - daysCount) * 5);
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

        let finalSchedules = scoredSchedules;
        if (preferences?.twoDaysOnly) {
            finalSchedules = scoredSchedules.filter(s => s.daysOnCampus.length <= 2);
        }

        finalSchedules.sort((a, b) => b.score - a.score);
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
