import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

describe("isSuperAdminUniversityId", () => {
    before(() => {
        process.env.JWT_SECRET = crypto.randomBytes(32).toString("base64url");
        process.env.ENCRYPTION_SECRET = crypto.randomBytes(32).toString("base64url");
        process.env.SUPER_ADMIN_UNIVERSITY_ID = "999000111";
        try {
            delete require.cache[require.resolve("./env")];
        } catch {
            /* ignore */
        }
    });

    it("uses SUPER_ADMIN_UNIVERSITY_ID from env", () => {
        const { isSuperAdminUniversityId } = require("./env") as typeof import("./env");
        assert.equal(isSuperAdminUniversityId("999000111"), true);
        assert.equal(isSuperAdminUniversityId("101230004"), false);
        assert.equal(isSuperAdminUniversityId(""), false);
    });
});
