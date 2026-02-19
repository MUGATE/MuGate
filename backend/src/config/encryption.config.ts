import { env } from "./env";

export const encryptionConfig = {
    secret: env.encryptionSecret || "default-secret-change-me",
    algorithm: "aes-256-cbc" as const,
};
