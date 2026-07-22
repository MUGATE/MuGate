import { Router } from "express";
import multer from "multer";
import { ChatbotController } from "../controllers/chatbot.controller";
import { authMiddleware } from "../../../../core/middleware/auth.middleware";
import { optionalAuthMiddleware } from "../../../../core/middleware/optionalAuth.middleware";
import { adminMiddleware } from "../../../../core/middleware/admin.middleware";
import { aiRateLimiter } from "../../../../core/middleware/rateLimiter.middleware";

// Multer config: store in memory (buffer), max 5MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

// Public chatbot surfaces — optional auth attaches user when logged in
router.post("/sessions", optionalAuthMiddleware, ChatbotController.createSession);
router.post("/message", optionalAuthMiddleware, aiRateLimiter, ChatbotController.sendMessage);
router.post("/upload", optionalAuthMiddleware, aiRateLimiter, upload.single("file"), ChatbotController.uploadFile);

router.get("/sessions", optionalAuthMiddleware, ChatbotController.getSessions);
router.delete("/sessions/:sessionId", optionalAuthMiddleware, ChatbotController.deleteSession);

router.get("/analytics", authMiddleware, adminMiddleware, ChatbotController.getAnalytics);

router.get("/sessions/:sessionId/messages", optionalAuthMiddleware, ChatbotController.getSessionMessages);

router.post("/enhance-prompt", optionalAuthMiddleware, aiRateLimiter, ChatbotController.enhancePrompt);


export default router;
