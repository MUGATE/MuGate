/**
 * Portal schedule parsing and conflict helpers for CourseSections.
 */

export type MeetingSlot = {
    day: string;
    startTime: string;
    endTime: string;
};

/** Normalize day tokens: "Th"/"TH"/"th" → "TH", trim spaces. */
export function normalizeDayToken(raw: string): string {
    const d = String(raw || "").trim().toUpperCase();
    if (!d || d === "TBA") return d === "TBA" ? "TBA" : "";
    if (d === "TH" || d === "R" || d === "THU" || d === "THURS") return "TH";
    if (d === "T" || d === "TU" || d === "TUE" || d === "TUES") return "T";
    if (d === "M" || d === "MON") return "M";
    if (d === "W" || d === "WED") return "W";
    if (d === "F" || d === "FRI") return "F";
    if (d === "S" || d === "SAT") return "S";
    if (d === "SU" || d === "SUN") return "SU";
    return d;
}

export function normalizeDayList(dayField: string | null | undefined): string[] {
    if (!dayField) return [];
    return String(dayField)
        .split(",")
        .map((d) => normalizeDayToken(d))
        .filter((d) => d.length > 0);
}

export function timeToMinutes(timeStr: string | null | undefined): number {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(":");
    if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (Number.isNaN(h) || Number.isNaN(m)) return 0;
        return h * 60 + m;
    }
    return 0;
}

/**
 * Parse portal schedule text like:
 *   "W 17:30:00->18:45:00"
 *   or multi-line with different times per day.
 */
export function parsePortalSchedule(schedule: string | null | undefined): {
    day: string;
    startTime: string;
    endTime: string;
    meetings: MeetingSlot[];
} {
    const empty = {
        day: "TBA",
        startTime: "00:00:00",
        endTime: "00:00:00",
        meetings: [] as MeetingSlot[],
    };

    if (!schedule || !schedule.includes("->")) return empty;

    const meetings: MeetingSlot[] = [];
    const scheduleLines = schedule.trim().split(/\r?\n/);

    for (const line of scheduleLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length < 2) continue;

        const day = normalizeDayToken(parts[0]);
        const times = parts[1].split("->");
        if (times.length !== 2 || !day) continue;

        const startTime = times[0].trim();
        const endTime = times[1].trim();
        if (!startTime || !endTime) continue;

        meetings.push({ day, startTime, endTime });
    }

    if (meetings.length === 0) return empty;

    const uniqueDays = [...new Set(meetings.map((m) => m.day))];
    return {
        day: uniqueDays.join(","),
        startTime: meetings[0].startTime,
        endTime: meetings[0].endTime,
        meetings,
    };
}

export function meetingsFromSection(section: {
    day?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    meetings?: MeetingSlot[] | string | null;
}): MeetingSlot[] {
    if (section.meetings) {
        let parsed = section.meetings;
        if (typeof parsed === "string") {
            try {
                parsed = JSON.parse(parsed) as MeetingSlot[];
            } catch {
                parsed = [];
            }
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((m) => ({
                day: normalizeDayToken(m.day),
                startTime: m.startTime,
                endTime: m.endTime,
            })).filter((m) => m.day && m.day !== "TBA");
        }
    }

    const days = normalizeDayList(section.day);
    if (days.length === 0 || (days.length === 1 && days[0] === "TBA")) return [];

    return days
        .filter((d) => d !== "TBA")
        .map((day) => ({
            day,
            startTime: String(section.startTime || "00:00:00"),
            endTime: String(section.endTime || "00:00:00"),
        }));
}

/** True when a slot has no usable clock times (online / TBA). */
export function isUntimedMeeting(m: MeetingSlot): boolean {
    return timeToMinutes(m.startTime) === 0 && timeToMinutes(m.endTime) === 0;
}

export function meetingsOverlap(a: MeetingSlot, b: MeetingSlot): boolean {
    if (normalizeDayToken(a.day) !== normalizeDayToken(b.day)) return false;
    if (a.day === "TBA" || b.day === "TBA") return false;
    if (isUntimedMeeting(a) || isUntimedMeeting(b)) return false;

    const aStart = timeToMinutes(a.startTime);
    const aEnd = timeToMinutes(a.endTime);
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);

    return aStart < bEnd && aEnd > bStart;
}

export function sectionsHaveTimeConflict(
    existingSection: Parameters<typeof meetingsFromSection>[0],
    newSection: Parameters<typeof meetingsFromSection>[0]
): boolean {
    const existing = meetingsFromSection(existingSection);
    const incoming = meetingsFromSection(newSection);
    if (existing.length === 0 || incoming.length === 0) return false;

    for (const a of existing) {
        for (const b of incoming) {
            if (meetingsOverlap(a, b)) return true;
        }
    }
    return false;
}

/** Open seats: capacity must be positive and enrolled strictly below capacity. */
export function hasOpenSeats(capacity: number, enrolled: number): boolean {
    const cap = Number(capacity);
    const enr = Number(enrolled);
    if (!Number.isFinite(cap) || cap <= 0) return false;
    if (!Number.isFinite(enr) || enr < 0) return false;
    return enr < cap;
}
