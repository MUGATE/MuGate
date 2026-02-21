import { pool } from "../../core/database/connection";
import { CS_CURRICULUM, CurriculumCourse } from "./curriculum";
import { logger } from "../../core/logger/logger";

export class GeneratorService {

    /**
     * Determine which courses from the curriculum a student is eligible to take.
     * This considers passed history and prerequisite chains.
     */
    static async getEligibleCourses(userId: string): Promise<CurriculumCourse[]> {
        logger.info(`Calculating eligible courses for user ${userId}`);

        // 1. Fetch academic history
        const historyResult = await pool.request()
            .input("userId", userId)
            .query("SELECT courseCode, status, category FROM AcademicHistory WHERE userId = @userId AND status = 'Passed'");

        // Helper function to normalize course codes (removes all spaces and capitalizes)
        const normalizeCode = (code: string) => code.replace(/\s+/g, '').toUpperCase();

        const passedCourses = new Set<string>();
        // Tracks electives of each category the user has already passed
        const fulfilledElectivesByCategory: Record<string, string[]> = {};

        historyResult.recordset.forEach(record => {
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

            // Check prerequisites
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

        logger.info(`Found ${eligibleCourses.length} eligible courses for user ${userId}`);
        return eligibleCourses;
    }

    /**
     * Main algorithm entry point: Generate optimal, conflict-free schedules
     */
    static async generateSchedules(userId: string, semesterId: number, preferences: any) {
        // Step 1: Get what they *can* take
        const eligibleCourses = await this.getEligibleCourses(userId);

        // Step 2: Fetch actual offerings for this semester that match eligible courses
        // We need to fetch from Courses and CourseSections where semester = semesterId
        const eligibleCodes = eligibleCourses
            .filter(c => !c.isElectivePlaceholder)
            .map(c => c.courseCode.replace(/\s+/g, '').toUpperCase());

        const electiveCategories = eligibleCourses
            .filter(c => c.isElectivePlaceholder && c.category)
            .map(c => c.category!.trim().toLowerCase());

        const electiveLimits: Record<string, number> = {};
        for (const cat of electiveCategories) {
            electiveLimits[cat] = (electiveLimits[cat] || 0) + 1;
        }

        logger.info(`Fetching available offerings for semester ${semesterId}...`);

        const offeringsResult = await pool.request()
            .input("semester", semesterId.toString())
            .query(`
                SELECT 
                    c.id as courseId, c.courseCode, c.courseName, c.credits, c.department,
                    s.id as sectionId, s.sectionNumber, s.instructor, s.day, s.startTime, s.endTime, s.type, s.capacity, s.enrolled
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
                    for (const placeholder of matchingPlaceholders) {
                        if (!placeholder.allowedCodes) {
                            // This placeholder accepts ANY course in the category
                            acceptedByAnyPlaceholder = true;
                            break;
                        } else {
                            // This placeholder only accepts specific codes
                            const normalizedAllowed = placeholder.allowedCodes.map(code => code.replace(/\s+/g, '').toUpperCase());
                            if (normalizedAllowed.includes(courseCodeNorm)) {
                                acceptedByAnyPlaceholder = true;
                                break;
                            }
                        }
                    }

                    if (!acceptedByAnyPlaceholder) return; // Blocked because it doesn't fit the allowedCodes of any open slot

                    isEligible = true;
                    matchingType = categoryRaw;
                }
            }

            if (!isEligible) return;

            // Only consider sections with open seats
            if (row.capacity > 0 && row.enrolled >= row.capacity) return;

            if (!availableCoursesWithSections.has(courseCodeNorm)) {
                availableCoursesWithSections.set(courseCodeNorm, {
                    courseId: row.courseId,
                    courseCode: row.courseCode,
                    courseName: row.courseName,
                    credits: row.credits,
                    type: matchingType, // Inherit type from curriculum mapping or offering
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
                type: row.type
            });
        });

        // Convert Map to Array for the backtracking engine
        const coursesToSchedule = Array.from(availableCoursesWithSections.values());

        logger.info(`Found ${coursesToSchedule.length} available eligible courses with open sections.`);

        // Step 3: Preference Filtering (Hard constraints)
        // E.g., if preferences specify no days like "Sunday", we can filter those sections out now.
        const filteredCoursesToSchedule: any[] = [];

        for (const course of coursesToSchedule) {
            const validSections = course.sections.filter((sec: any) => {
                // If the user wants no classes on a specific day
                if (preferences?.excludeDays && preferences.excludeDays.includes(sec.day)) return false;

                // If the user wants no classes before a specific time
                if (preferences?.startTime && sec.startTime < preferences.startTime) return false;

                return true;
            });

            if (validSections.length > 0) {
                // Keep the course only if it still has valid sections available
                course.sections = validSections;
                filteredCoursesToSchedule.push(course);
            }
        }

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
                    generatedSchedules.push([...currentSchedule]);
                }
                return;
            }

            const course = filteredCoursesToSchedule[courseIndex];

            // Branch 1: Skip taking this course this semester
            backtrack(courseIndex + 1, currentSchedule, currentCredits, { ...currentElectiveCounts });

            // Branch 2: Try to take this course by iterating over its available sections
            if (currentCredits + course.credits <= MAX_CREDITS) {
                // Check if this course is an elective that hit its limit
                if (course.type !== 'Major' && course.type !== 'GER' && course.type !== 'Elective') {
                    const catStr = course.type;
                    if ((currentElectiveCounts[catStr] || 0) >= (electiveLimits[catStr] || 0)) {
                        return; // Cannot add any more electives of this type
                    }
                }

                // If adding, increment the count for the next recursive call
                const nextElectiveCounts = { ...currentElectiveCounts };
                if (course.type !== 'Major' && course.type !== 'GER' && course.type !== 'Elective') {
                    nextElectiveCounts[course.type] = (nextElectiveCounts[course.type] || 0) + 1;
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

        // Step 5: Scoring (Prioritize Majors > Credits > Compactness)
        const scoredSchedules = generatedSchedules.map(schedule => {
            let score = 0;
            let majorCredits = 0;
            let totalCredits = 0;
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

        // Sort by highest score first
        scoredSchedules.sort((a, b) => b.score - a.score);

        // return top 20 distinct schedules
        const topSchedules = scoredSchedules.slice(0, 20);

        logger.info(`Generated ${generatedSchedules.length} valid combinations. Returning top ${topSchedules.length}.`);

        return {
            status: "success",
            eligibleCount: eligibleCourses.length,
            offeringsFound: coursesToSchedule.length,
            validCombinations: generatedSchedules.length,
            topSchedules
        };
    }
}
