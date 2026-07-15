/**
 * Curriculum rules for the Degree Roadmap planner.
 *
 * Prerequisite chains and the per-semester credit cap mirror the CS curriculum
 * defined on the backend (`scheduling/generator/curriculum.ts`). Lab co-requisites
 * are folded into their parent course (e.g. CSC 210L → CSC 210) since the roadmap
 * tracks the combined course.
 */

export const CREDIT_CAP = 17;

const SEMESTER_ORDER: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };

/** Course code -> list of course codes that must come in an earlier semester. */
export const PREREQS: Record<string, string[]> = {
  'ENG 202': ['ENG 201'],
  'ENG 204': ['ENG 202'],
  'CST 201': ['CST 200'],
  'MAT 225': ['MAT 213'],
  'MAT 320': ['MAT 213'],
  'MAT 350': ['MAT 320'],
  'CSC 310': ['CSC 210'],
  'CSC 320': ['CSC 210'],
  'COE 360': ['CSC 210'],
  'CSC 330': ['CSC 320'],
  'COE 380': ['EEE 225'],
  'CSC 340': ['MAT 250', 'CSC 320'],
  'CSC 400': ['FOE 201', 'CSC 210'],
  'CSC 420': ['CSC 320'],
  'CSC 470': ['CSC 320'],
  'CSC 497': ['CSC 320', 'CSC 330'],
  'CSC 498': ['CSC 320', 'CSC 330'],
  'CSC 499': ['CSC 498'],
};

export type PlanLike = {
  courseCode: string;
  credits: number;
  year: number;
  semester: string;
  _key?: string;
};

/** A monotonic index so semesters can be compared chronologically. */
export function slotOrder(year: number, semester: string): number {
  return year * 10 + (SEMESTER_ORDER[semester] ?? 0);
}

export function semesterCredits(
  courses: PlanLike[],
  year: number,
  semester: string,
  excludeKey?: string
): number {
  return courses
    .filter((c) => c.year === year && c.semester === semester && c._key !== excludeKey)
    .reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
}

/**
 * Returns a human-readable reason if placing `target` at (year, semester) would
 * break the curriculum rules, or `null` if the placement is valid.
 */
export function checkPlacement(
  courses: PlanLike[],
  target: { courseCode: string; credits: number },
  year: number,
  semester: string,
  excludeKey?: string
): string | null {
  const order = slotOrder(year, semester);

  // 1) Per-semester credit cap.
  const existing = semesterCredits(courses, year, semester, excludeKey);
  const projected = existing + (Number(target.credits) || 0);
  if (projected > CREDIT_CAP) {
    return `Year ${year} ${semester} would reach ${projected} credits — the limit is ${CREDIT_CAP}.`;
  }

  // 2) Prerequisites already in the plan must sit in an earlier semester.
  for (const prereq of PREREQS[target.courseCode] ?? []) {
    const planned = courses.find((c) => c.courseCode === prereq && c._key !== excludeKey);
    if (planned && slotOrder(planned.year, planned.semester) >= order) {
      return `${target.courseCode} requires ${prereq} to be taken in an earlier semester.`;
    }
  }

  // 3) Courses that depend on this one must stay in a later semester.
  for (const dependent of courses) {
    if (dependent._key === excludeKey) continue;
    const deps = PREREQS[dependent.courseCode] ?? [];
    if (deps.includes(target.courseCode) && slotOrder(dependent.year, dependent.semester) <= order) {
      return `${dependent.courseCode} depends on ${target.courseCode}; keep it in an earlier semester.`;
    }
  }

  return null;
}
