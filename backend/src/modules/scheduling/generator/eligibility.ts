import { CS_CURRICULUM, CurriculumCourse } from "./curriculum";
import {
    isCompletedStatus,
    isRegisteredOrInProgressStatus,
    normalizeAcademicStatus,
} from "../../../core/utils/academic-status.util";

export type HistoryRow = {
    courseCode: string;
    status?: string | null;
    category?: string | null;
};

/** Remedial coreqs that block only when explicitly Failed (missing = waived / not required). */
const SOFT_REMEDIAL_COREQS = new Set(["ENG100"]);

export function normalizeCourseCode(code: string): string {
    return String(code || "").replace(/\s+/g, "").toUpperCase();
}

/** Normalize offering / curriculum elective category labels for matching. */
export function normalizeElectiveCategory(raw: string | null | undefined): string {
    return String(raw || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/electives$/, "elective");
}

/**
 * Pure eligibility from curriculum + academic history.
 * Shared by GeneratorService and HistoryService.checkEligibility.
 */
export function computeEligibleCourses(history: HistoryRow[]): CurriculumCourse[] {
    const passedCourses = new Set<string>();
    const registeredCourses = new Set<string>();
    const failedCourses = new Set<string>();
    const fulfilledElectivesByCategory: Record<string, string[]> = {};

    for (const record of history) {
        const code = normalizeCourseCode(record.courseCode);
        if (!code) continue;

        const status = normalizeAcademicStatus(record.status);
        if (isCompletedStatus(status)) {
            passedCourses.add(code);
            if (record.category && String(record.category).includes("Elective")) {
                const hardcodedMatch = CS_CURRICULUM.find(
                    (c) => normalizeCourseCode(c.courseCode) === code
                );
                if (!hardcodedMatch || hardcodedMatch.type === "Elective") {
                    const catStr = String(record.category).trim();
                    if (!fulfilledElectivesByCategory[catStr]) {
                        fulfilledElectivesByCategory[catStr] = [];
                    }
                    fulfilledElectivesByCategory[catStr].push(code);
                }
            }
        } else if (isRegisteredOrInProgressStatus(status)) {
            registeredCourses.add(code);
            // Registered electives also consume a placeholder slot for the semester
            if (record.category && String(record.category).includes("Elective")) {
                const hardcodedMatch = CS_CURRICULUM.find(
                    (c) => normalizeCourseCode(c.courseCode) === code
                );
                if (!hardcodedMatch || hardcodedMatch.type === "Elective") {
                    const catStr = String(record.category).trim();
                    if (!fulfilledElectivesByCategory[catStr]) {
                        fulfilledElectivesByCategory[catStr] = [];
                    }
                    fulfilledElectivesByCategory[catStr].push(code);
                }
            }
        } else if (status === "Failed") {
            failedCourses.add(code);
        }
    }

    const eligibleCourses: CurriculumCourse[] = [];
    const consumedPassedElectives = new Set<string>();

    for (const course of CS_CURRICULUM) {
        if (course.isElectivePlaceholder && course.category) {
            const catStr = course.category;
            const passedEquivalents = fulfilledElectivesByCategory[catStr] || [];

            let matchedIndex = -1;
            for (let i = 0; i < passedEquivalents.length; i++) {
                const passedCode = passedEquivalents[i];
                if (consumedPassedElectives.has(passedCode + "_" + i)) continue;

                if (course.allowedCodes) {
                    const normalizedAllowed = course.allowedCodes.map(normalizeCourseCode);
                    if (normalizedAllowed.includes(passedCode)) {
                        matchedIndex = i;
                        break;
                    }
                } else {
                    matchedIndex = i;
                    break;
                }
            }

            if (matchedIndex !== -1) {
                consumedPassedElectives.add(
                    passedEquivalents[matchedIndex] + "_" + matchedIndex
                );
                continue;
            }
            eligibleCourses.push(course);
            continue;
        }

        const courseCodeNorm = normalizeCourseCode(course.courseCode);
        if (passedCourses.has(courseCodeNorm)) continue;
        if (registeredCourses.has(courseCodeNorm)) continue;

        let prereqsMet = true;
        for (const prereq of course.prerequisites) {
            if (!passedCourses.has(normalizeCourseCode(prereq))) {
                prereqsMet = false;
                break;
            }
        }
        if (prereqsMet) eligibleCourses.push(course);
    }

    const eligibleCodes = new Set(
        eligibleCourses.map((c) => normalizeCourseCode(c.courseCode))
    );

    return eligibleCourses.filter((course) => {
        if (!course.corequisites || course.corequisites.length === 0) return true;

        for (const coreq of course.corequisites) {
            const coreqNorm = normalizeCourseCode(coreq);
            if (isSoftRemedialSatisfied(coreqNorm, passedCourses, failedCourses)) {
                continue;
            }
            if (!passedCourses.has(coreqNorm) && !eligibleCodes.has(coreqNorm)) {
                return false;
            }
        }
        return true;
    });
}

function isSoftRemedialSatisfied(
    coreqNorm: string,
    passed: Set<string>,
    failed: Set<string>
): boolean {
    if (!SOFT_REMEDIAL_COREQS.has(coreqNorm)) return false;
    if (passed.has(coreqNorm)) return true;
    // Missing from history or not Failed ⇒ treat as waived / not required
    return !failed.has(coreqNorm);
}

export function checkCourseEligibility(
    history: HistoryRow[],
    courseCodeRaw: string
): { eligible: boolean; missingPrereqs: string[]; reason?: string } {
    const courseCode = normalizeCourseCode(courseCodeRaw);
    if (!courseCode) {
        return { eligible: false, missingPrereqs: [] };
    }

    const completed = new Set(
        history
            .filter((row) => isCompletedStatus(row.status))
            .map((row) => normalizeCourseCode(row.courseCode))
    );
    const registered = new Set(
        history
            .filter((row) => isRegisteredOrInProgressStatus(row.status))
            .map((row) => normalizeCourseCode(row.courseCode))
    );

    if (completed.has(courseCode)) {
        return { eligible: false, missingPrereqs: [], reason: "already_completed" };
    }
    if (registered.has(courseCode)) {
        return { eligible: false, missingPrereqs: [], reason: "already_registered" };
    }

    const curriculum = CS_CURRICULUM.find(
        (c) => normalizeCourseCode(c.courseCode) === courseCode
    );

    if (!curriculum) {
        return { eligible: true, missingPrereqs: [] };
    }

    const missingPrereqs = curriculum.prerequisites.filter(
        (code) => !completed.has(normalizeCourseCode(code))
    );

    if (missingPrereqs.length > 0) {
        return { eligible: false, missingPrereqs };
    }

    const eligible = computeEligibleCourses(history);
    const inEligible = eligible.some(
        (c) => normalizeCourseCode(c.courseCode) === courseCode
    );

    return {
        eligible: inEligible,
        missingPrereqs: [],
        reason: inEligible ? undefined : "corequisites_or_curriculum",
    };
}

/** Schedule-level coreq check (Passed / soft remedial / in current combo). */
export function corequisitesMetInSchedule(
    corequisites: string[] | undefined,
    passedCourses: Set<string>,
    scheduledCodes: Set<string>,
    failedCourses: Set<string> = new Set()
): boolean {
    if (!corequisites || corequisites.length === 0) return true;
    for (const coreq of corequisites) {
        const coreqNorm = normalizeCourseCode(coreq);
        if (isSoftRemedialSatisfied(coreqNorm, passedCourses, failedCourses)) continue;
        if (!passedCourses.has(coreqNorm) && !scheduledCodes.has(coreqNorm)) {
            return false;
        }
    }
    return true;
}
