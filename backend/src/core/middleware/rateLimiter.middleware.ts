import rateLimit from "express-rate-limit";
import { APP_CONSTANTS } from "../../config/constants";

export const rateLimiter = rateLimit({
    windowMs: APP_CONSTANTS.RATE_LIMIT_WINDOW_MS,
    max: APP_CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
    message: { success: false, message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
