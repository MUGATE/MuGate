export const APP_CONSTANTS = {
    // Token expiration
    JWT_EXPIRY: "24h",
    REFRESH_TOKEN_EXPIRY: "7d",

    // Rate limiting (global)
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 300,

    // Stricter limits
    AUTH_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    AUTH_RATE_LIMIT_MAX_REQUESTS: 20,
    AI_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    AI_RATE_LIMIT_MAX_REQUESTS: 60,

    // Portal course sync (Playwright)
    SYNC_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    SYNC_RATE_LIMIT_MAX_REQUESTS: 5,

    // Uploads
    RESUME_UPLOAD_MAX_BYTES: 5 * 1024 * 1024, // 5 MB

    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,

    // Scraper
    SCRAPER_TIMEOUT_MS: 30000,
} as const;
