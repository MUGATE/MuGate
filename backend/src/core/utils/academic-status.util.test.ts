import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    normalizeAcademicStatus,
    isCompletedStatus,
    isRegisteredOrInProgressStatus,
} from "./academic-status.util";

describe("normalizeAcademicStatus", () => {
    it("maps common pass aliases", () => {
        assert.equal(normalizeAcademicStatus("Passed"), "Passed");
        assert.equal(normalizeAcademicStatus("pass"), "Passed");
        assert.equal(normalizeAcademicStatus("P"), "Passed");
        assert.equal(normalizeAcademicStatus(" Completed "), "Passed");
    });

    it("maps transfer aliases", () => {
        assert.equal(normalizeAcademicStatus("Transferred"), "Transferred");
        assert.equal(normalizeAcademicStatus("Transfer Credit"), "Transferred");
    });

    it("treats passed and transferred as completed", () => {
        assert.equal(isCompletedStatus("Pass"), true);
        assert.equal(isCompletedStatus("Transferred"), true);
        assert.equal(isCompletedStatus("Registered"), false);
        assert.equal(isCompletedStatus("Failed"), false);
    });

    it("detects registered / in-progress", () => {
        assert.equal(isRegisteredOrInProgressStatus("Registered"), true);
        assert.equal(isRegisteredOrInProgressStatus("In Progress"), true);
        assert.equal(isRegisteredOrInProgressStatus("Passed"), false);
    });
});
