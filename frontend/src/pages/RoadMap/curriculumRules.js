/**
 * Curriculum rules for the Degree Roadmap planner.
 *
 * Prerequisite chains and the per-semester credit cap mirror the CS curriculum
 * defined on the backend (`scheduling/generator/curriculum.ts`). Lab co-requisites
 * are folded into their parent course (e.g. CSC 210L → CSC 210) since the roadmap
 * tracks the combined course.
 */

export const CREDIT_CAP = 17;

/** Fixed degree-chart requirement totals (not live sums of planned courses). */
export const CATEGORY_REQUIREMENTS = {
  'General Requirements': 18,
  'Free Liberal Arts Requirements': 9,
  'Mathematics & Sciences Requirements': 18,
  'Major Requirements': 46,
  'Technical Electives': 6,
};

export const DEGREE_PLAN_CREDITS = Object.values(CATEGORY_REQUIREMENTS).reduce(
  (sum, n) => sum + n,
  0
);

export const REMEDIAL_CATEGORY = 'Remedial';

/** Live sum of credits for courses tagged as Remedial (extra, not in the degree plan). */
export function sumRemedialCredits(courses) {
  if (!Array.isArray(courses)) return 0;
  return courses.reduce((sum, c) => {
    if (c.category !== REMEDIAL_CATEGORY) return sum;
    return sum + (Number(c.credits) || 0);
  }, 0);
}

/** Codes that may appear more than once (different semesters). */
const MULTI_SLOT_CODES = new Set(['TECH ELEC']);

const SEMESTER_ORDER = { Fall: 0, Spring: 1, Summer: 2 };

/** Course code -> list of course codes that must come in an earlier semester. */
export const PREREQS = {
  // Remedial English placement sequence (lvl0 → lvl1 → lvl2)
  'ENG 051': ['ENG 000'],
  'ENG 100': ['ENG 051'],
  // Remedial math / Arabic (only enforced when those remediials are on the plan)
  'MAT 213': ['MAT 102'],
  'ARB 201': ['ABR 200'],
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

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function courseKey(c) {
  return c._key ?? c.id;
}

function dedupeKey(c) {
  const code = normalizeCode(c.courseCode);
  if (MULTI_SLOT_CODES.has(code)) {
    return `${code}|${c.year}|${c.semester}`;
  }
  return code;
}

/** Collapse duplicate course rows (keeps first). Allows multi-slot electives. */
export function dedupeCourses(courses) {
  if (!Array.isArray(courses)) return [];
  const seen = new Set();
  const out = [];
  for (const c of courses) {
    const key = dedupeKey(c);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

export function isDuplicateCourse(courses, courseCode, excludeId) {
  const code = normalizeCode(courseCode);
  if (!code) return false;
  if (MULTI_SLOT_CODES.has(code)) return false;
  return courses.some(
    (c) => normalizeCode(c.courseCode) === code && String(c.id) !== String(excludeId)
  );
}

/** A monotonic index so semesters can be compared chronologically. */
export function slotOrder(year, semester) {
  return year * 10 + (SEMESTER_ORDER[semester] ?? 0);
}

/** Sum credits for a semester, counting each courseCode only once. */
export function semesterCredits(courses, year, semester, excludeKey) {
  const seen = new Set();
  let sum = 0;
  for (const c of courses) {
    if (c.year !== year || c.semester !== semester) continue;
    if (courseKey(c) === excludeKey) continue;
    const code = normalizeCode(c.courseCode);
    if (seen.has(code)) continue;
    seen.add(code);
    sum += Number(c.credits) || 0;
  }
  return sum;
}

/**
 * Returns a human-readable reason if placing `target` at (year, semester) would
 * break the curriculum rules, or `null` if the placement is valid.
 */
export function checkPlacement(courses, target, year, semester, excludeKey) {
  const order = slotOrder(year, semester);
  const uniqueCourses = dedupeCourses(courses);

  const existing = semesterCredits(uniqueCourses, year, semester, excludeKey);
  const projected = existing + (Number(target.credits) || 0);
  if (projected > CREDIT_CAP) {
    return `Year ${year} ${semester} would reach ${projected} credits — the limit is ${CREDIT_CAP}.`;
  }

  const targetCode = normalizeCode(target.courseCode);
  for (const prereq of PREREQS[targetCode] ?? []) {
    const planned = uniqueCourses.find(
      (c) => normalizeCode(c.courseCode) === prereq && courseKey(c) !== excludeKey
    );
    if (planned && slotOrder(planned.year, planned.semester) >= order) {
      return `${targetCode} requires ${prereq} to be taken in an earlier semester.`;
    }
  }

  for (const dependent of uniqueCourses) {
    if (courseKey(dependent) === excludeKey) continue;
    const depCode = normalizeCode(dependent.courseCode);
    const deps = PREREQS[depCode] ?? [];
    if (deps.includes(targetCode) && slotOrder(dependent.year, dependent.semester) <= order) {
      return `${depCode} depends on ${targetCode}; keep ${targetCode} in an earlier semester.`;
    }
  }

  return null;
}
