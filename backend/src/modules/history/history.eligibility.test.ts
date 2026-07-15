import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

describe("history.checkEligibility", () => {
    before(() => {
        process.env.JWT_SECRET = crypto.randomBytes(32).toString("base64url");
        process.env.ENCRYPTION_SECRET = crypto.randomBytes(32).toString("base64url");
    });

    it("returns missing prerequisites for CSC 320 without CSC 210", async () => {
        // Isolate from DB by stubbing HistoryRepository.findByUserId
        const repoPath = require.resolve("./history.repository");
        const servicePath = require.resolve("./history.service");
        delete require.cache[repoPath];
        delete require.cache[servicePath];

        const { HistoryRepository } = require("./history.repository");
        HistoryRepository.findByUserId = async () => [];

        const { HistoryService } = require("./history.service");
        const result = await HistoryService.checkEligibility("user-1", "CSC 320");
        assert.equal(result.eligible, false);
        assert.ok(result.missingPrereqs.map((c: string) => c.toUpperCase()).includes("CSC 210"));
    });

    it("is eligible when prerequisites are completed", async () => {
        const repoPath = require.resolve("./history.repository");
        const servicePath = require.resolve("./history.service");
        delete require.cache[repoPath];
        delete require.cache[servicePath];

        const { HistoryRepository } = require("./history.repository");
        HistoryRepository.findByUserId = async () => [
            { courseCode: "CSC 210", status: "Passed" },
        ];

        const { HistoryService } = require("./history.service");
        const result = await HistoryService.checkEligibility("user-1", "CSC 320");
        assert.equal(result.eligible, true);
        assert.deepEqual(result.missingPrereqs, []);
    });
});
