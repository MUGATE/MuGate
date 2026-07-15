import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

/**
 * Encryption tests load the module after injecting strong secrets so env.ts
 * does not throw during import.
 */
describe("encryption.util", () => {
    before(() => {
        process.env.JWT_SECRET = crypto.randomBytes(32).toString("base64url");
        process.env.ENCRYPTION_SECRET = crypto.randomBytes(32).toString("base64url");
        // Clear cached modules so env picks up the new secrets
        const roots = [
            require.resolve("../../config/env"),
            require.resolve("../../config/encryption.config"),
            require.resolve("./encryption.util"),
        ];
        for (const id of roots) {
            try {
                delete require.cache[id];
            } catch {
                /* ignore */
            }
        }
    });

    it("round-trips AES-GCM payloads", () => {
        const { encrypt, decrypt } = require("./encryption.util") as typeof import("./encryption.util");
        const plain = "portal-password-secret";
        const sealed = encrypt(plain);
        assert.match(sealed, /^gcm:/);
        assert.equal(decrypt(sealed), plain);
    });

    it("still decrypts legacy CBC payloads written with the same secret", () => {
        const { encrypt, decrypt } = require("./encryption.util") as typeof import("./encryption.util");
        // Produce a legacy-shaped ciphertext using the same scrypt+CBC scheme
        const cryptoNode = require("crypto") as typeof import("crypto");
        const { encryptionConfig } = require("../../config/encryption.config") as typeof import("../../config/encryption.config");
        const iv = cryptoNode.randomBytes(16);
        const key = cryptoNode.scryptSync(encryptionConfig.secret, "salt", 32);
        const cipher = cryptoNode.createCipheriv("aes-256-cbc", key, iv);
        let encrypted = cipher.update("legacy-secret", "utf8", "hex");
        encrypted += cipher.final("hex");
        const legacy = `${iv.toString("hex")}:${encrypted}`;
        assert.equal(decrypt(legacy), "legacy-secret");
        // And new writes remain GCM
        assert.match(encrypt("x"), /^gcm:/);
    });
});
