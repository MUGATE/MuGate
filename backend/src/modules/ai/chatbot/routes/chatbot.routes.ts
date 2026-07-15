import { Router } from "express";
import multer from "multer";
import { ChatbotController } from "../controllers/chatbot.controller";
import { authMiddleware } from "../../../../core/middleware/auth.middleware";
import { adminMiddleware } from "../../../../core/middleware/admin.middleware";
import { aiRateLimiter } from "../../../../core/middleware/rateLimiter.middleware";

// Multer config: store in memory (buffer), max 5MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

// All chatbot surfaces require authentication (prevents anonymous AI spend + session IDOR)
router.post("/sessions", authMiddleware, ChatbotController.createSession);
router.post("/message", authMiddleware, aiRateLimiter, ChatbotController.sendMessage);
router.post("/upload", authMiddleware, aiRateLimiter, upload.single("file"), ChatbotController.uploadFile);

router.get("/sessions", authMiddleware, ChatbotController.getSessions);
router.delete("/sessions/:sessionId", authMiddleware, ChatbotController.deleteSession);

router.get("/analytics", authMiddleware, adminMiddleware, ChatbotController.getAnalytics);

router.get("/sessions/:sessionId/messages", authMiddleware, ChatbotController.getSessionMessages);

router.post("/enhance-prompt", authMiddleware, aiRateLimiter, ChatbotController.enhancePrompt);

export default router;
