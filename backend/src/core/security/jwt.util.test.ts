import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

describe("jwt.util", () => {
    before(() => {
        process.env.JWT_SECRET = crypto.randomBytes(32).toString("base64url");
        process.env.ENCRYPTION_SECRET = crypto.randomBytes(32).toString("base64url");
        for (const id of [
            require.resolve("../../config/env"),
            require.resolve("./jwt.util"),
        ]) {
            try {
                delete require.cache[id];
            } catch {
                /* ignore */
            }
        }
    });

    it("signs and verifies tokens without a fallback secret", () => {
        const { generateToken, verifyToken } = require("./jwt.util") as typeof import("./jwt.util");
        const token = generateToken({
            userId: "u1",
            email: "u1@mu.edu.lb",
            universityId: "12345",
            name: "Test",
        });
        const payload = verifyToken(token);
        assert.equal(payload.userId, "u1");
        assert.equal(payload.universityId, "12345");
    });
});
