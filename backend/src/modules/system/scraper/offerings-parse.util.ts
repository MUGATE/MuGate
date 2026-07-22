/**
 * Pure helpers for mapping UMS offerings table headers → column indices.
 * Kept outside Playwright evaluate so unit tests can cover layout changes.
 */

export type OfferingsColIndex = {
    courseCode: number;
    courseName: number;
    section: number;
    type: number;
    credits: number;
    instructor: number;
    schedule: number;
    capacity: number;
    enrolled: number;
    room: number;
};

export function normalizeHeader(h: string): string {
    return String(h || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

export function resolveCol(headers: string[], predicates: RegExp[]): number {
    for (let i = 0; i < headers.length; i++) {
        if (predicates.some((re) => re.test(headers[i]))) return i;
    }
    return -1;
}

/** Map normalized header labels to column indices; -1 when missing. */
export function mapOfferingsHeaders(rawHeaders: string[]): OfferingsColIndex {
    const headers = rawHeaders.map(normalizeHeader);
    return {
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
}

export function offeringsHeaderMapIsUsable(idx: OfferingsColIndex): boolean {
    return idx.courseCode >= 0 && idx.courseName >= 0;
}
