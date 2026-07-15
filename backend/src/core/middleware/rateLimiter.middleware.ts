import rateLimit from "express-rate-limit";
import { APP_CONSTANTS } from "../../config/constants";

export const rateLimiter = rateLimit({
    windowMs: APP_CONSTANTS.RATE_LIMIT_WINDOW_MS,
    max: APP_CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
    message: { success: false, message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
    windowMs: APP_CONSTANTS.AUTH_RATE_LIMIT_WINDOW_MS,
    max: APP_CONSTANTS.AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: { success: false, message: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const aiRateLimiter = rateLimit({
    windowMs: APP_CONSTANTS.AI_RATE_LIMIT_WINDOW_MS,
    max: APP_CONSTANTS.AI_RATE_LIMIT_MAX_REQUESTS,
    message: { success: false, message: "AI rate limit exceeded. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
