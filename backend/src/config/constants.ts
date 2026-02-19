export const APP_CONSTANTS = {
    // Token expiration
    JWT_EXPIRY: "24h",
    REFRESH_TOKEN_EXPIRY: "7d",

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,

    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,

    // Scraper
    SCRAPER_TIMEOUT_MS: 30000,
} as const;
