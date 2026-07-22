import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    parsePortalSchedule,
    sectionsHaveTimeConflict,
    hasOpenSeats,
    normalizeDayList,
    normalizeDayToken,
} from "./schedule-parse.util";

describe("schedule-parse.util", () => {
    it("parses multi-day schedules with different times per day", () => {
        const parsed = parsePortalSchedule("M 08:00:00->09:15:00\nW 17:30:00->18:45:00");
        assert.equal(parsed.day, "M,W");
        assert.equal(parsed.meetings.length, 2);
        assert.equal(parsed.meetings[0].startTime, "08:00:00");
        assert.equal(parsed.meetings[1].startTime, "17:30:00");
        assert.equal(parsed.meetings[1].day, "W");
    });

    it("normalizes Th / day spacing", () => {
        assert.equal(normalizeDayToken("Th"), "TH");
        assert.deepEqual(normalizeDayList("M, W"), ["M", "W"]);
        assert.deepEqual(normalizeDayList("T,Th"), ["T", "TH"]);
    });

    it("detects conflicts using per-day meetings", () => {
        const a = {
            meetings: [
                { day: "M", startTime: "08:00:00", endTime: "09:15:00" },
                { day: "W", startTime: "17:30:00", endTime: "18:45:00" },
            ],
        };
        const overlappingW = {
            meetings: [{ day: "W", startTime: "18:00:00", endTime: "19:00:00" }],
        };
        const onlyMonday = {
            meetings: [{ day: "M", startTime: "10:00:00", endTime: "11:00:00" }],
        };
        assert.equal(sectionsHaveTimeConflict(a, overlappingW), true);
        assert.equal(sectionsHaveTimeConflict(a, onlyMonday), false);
    });

    it("does not treat 00:00–00:00 as a conflict window against timed classes", () => {
        const timed = { day: "M", startTime: "08:00:00", endTime: "09:00:00", meetings: null };
        const untimed = { day: "M", startTime: "00:00:00", endTime: "00:00:00", meetings: null };
        assert.equal(sectionsHaveTimeConflict(timed, untimed), false);
    });

    it("treats capacity 0 as closed", () => {
        assert.equal(hasOpenSeats(0, 0), false);
        assert.equal(hasOpenSeats(30, 30), false);
        assert.equal(hasOpenSeats(30, 29), true);
    });
});
