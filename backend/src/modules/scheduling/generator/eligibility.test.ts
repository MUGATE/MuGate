import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    checkCourseEligibility,
    computeEligibleCourses,
    corequisitesMetInSchedule,
    normalizeCourseCode,
} from "./eligibility";

describe("eligibility", () => {
    it("excludes Registered courses from eligible list", () => {
        const eligible = computeEligibleCourses([
            { courseCode: "CSC 210", status: "Passed" },
            { courseCode: "CSC 320", status: "Registered" },
        ]);
        const codes = eligible.map((c) => normalizeCourseCode(c.courseCode));
        assert.ok(!codes.includes("CSC320"));
        assert.ok(codes.includes("CSC310") || codes.includes("COE360"));
    });

    it("treats missing ENG 100 as satisfied soft remedial (not Failed)", () => {
        const eligible = computeEligibleCourses([]);
        const codes = eligible.map((c) => normalizeCourseCode(c.courseCode));
        // FOE 201 / CSC 210 require ENG 100 as coreq — should remain eligible when ENG 100 absent
        assert.ok(codes.includes("FOE201"));
        assert.ok(codes.includes("CSC210"));
    });

    it("blocks soft remedial when ENG 100 is Failed", () => {
        const eligible = computeEligibleCourses([
            { courseCode: "ENG 100", status: "Failed" },
        ]);
        const codes = eligible.map((c) => normalizeCourseCode(c.courseCode));
        assert.ok(!codes.includes("FOE201"));
        assert.ok(!codes.includes("CSC210"));
    });

    it("consumes elective slots for Registered electives in category", () => {
        const eligible = computeEligibleCourses([
            {
                courseCode: "HIS 201",
                status: "Registered",
                category: "Liberal Arts Elective",
            },
        ]);
        const liberalPlaceholders = eligible.filter(
            (c) => c.isElectivePlaceholder && c.category === "Liberal Arts Elective"
        );
        // Curriculum has 2 liberal placeholders; one restricted to CST 202/HIS 201 should be consumed
        assert.ok(liberalPlaceholders.length >= 1);
        const restricted = liberalPlaceholders.find((c) =>
            c.allowedCodes?.some((code) => normalizeCourseCode(code) === "HIS201")
        );
        assert.equal(restricted, undefined);
    });

    it("checkCourseEligibility reports already_registered", () => {
        const result = checkCourseEligibility(
            [{ courseCode: "CSC 320", status: "Registered" }],
            "CSC 320"
        );
        assert.equal(result.eligible, false);
        assert.equal(result.reason, "already_registered");
    });

    it("checkCourseEligibility requires prerequisites", () => {
        const result = checkCourseEligibility([], "CSC 320");
        assert.equal(result.eligible, false);
        assert.ok(result.missingPrereqs.map(normalizeCourseCode).includes("CSC210"));
    });

    it("corequisitesMetInSchedule honors soft remedial", () => {
        assert.equal(
            corequisitesMetInSchedule(["ENG 100"], new Set(), new Set(), new Set()),
            true
        );
        assert.equal(
            corequisitesMetInSchedule(["ENG 100"], new Set(), new Set(), new Set(["ENG100"])),
            false
        );
    });
});
