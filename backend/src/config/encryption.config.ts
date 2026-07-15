import { env } from "./env";

export const encryptionConfig = {
    secret: env.encryptionSecret,
    /** Legacy CBC kept only for decrypting rows written before AES-GCM migration */
    legacyAlgorithm: "aes-256-cbc" as const,
    algorithm: "aes-256-gcm" as const,
};
