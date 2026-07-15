import crypto from "crypto";
import { encryptionConfig } from "../../config/encryption.config";

const SECRET = encryptionConfig.secret;
const IV_LENGTH = 12; // AES-GCM recommended IV size
const LEGACY_IV_LENGTH = 16;
const SALT_LENGTH = 16;
const LEGACY_SALT = "salt";
const GCM_PREFIX = "gcm";

function deriveKey(salt: Buffer | string): Buffer {
    return crypto.scryptSync(SECRET, salt, 32);
}

/** Encrypt with AES-256-GCM and a per-encryption random salt. Format: gcm:salt:iv:tag:ciphertext */
export const encrypt = (text: string): string => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(salt);
    const cipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
        GCM_PREFIX,
        salt.toString("hex"),
        iv.toString("hex"),
        tag.toString("hex"),
        encrypted.toString("hex"),
    ].join(":");
};

/** Decrypt GCM payloads; fall back to legacy AES-CBC (iv:ciphertext) for existing rows. */
export const decrypt = (encrypted: string): string => {
    const parts = encrypted.split(":");

    if (parts[0] === GCM_PREFIX && parts.length === 5) {
        const [, saltHex, ivHex, tagHex, encryptedHex] = parts;
        const key = deriveKey(Buffer.from(saltHex, "hex"));
        const decipher = crypto.createDecipheriv(
            encryptionConfig.algorithm,
            key,
            Buffer.from(ivHex, "hex")
        );
        decipher.setAuthTag(Buffer.from(tagHex, "hex"));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, "hex")),
            decipher.final(),
        ]);
        return decrypted.toString("utf8");
    }

    // Legacy: ivHex:encryptedHex (AES-256-CBC, static salt)
    if (parts.length === 2) {
        const [ivHex, encryptedText] = parts;
        if (ivHex.length === LEGACY_IV_LENGTH * 2) {
            const key = deriveKey(LEGACY_SALT);
            const decipher = crypto.createDecipheriv(
                encryptionConfig.legacyAlgorithm,
                key,
                Buffer.from(ivHex, "hex")
            );
            let decrypted = decipher.update(encryptedText, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        }
    }

    throw new Error("Unrecognized encrypted payload format");
};
