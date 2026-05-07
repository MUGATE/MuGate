import { Router } from "express";
import multer from "multer";
import { ChatbotController } from "../controllers/chatbot.controller";
import { optionalAuthMiddleware } from "../../../../core/middleware/optionalAuth.middleware";
import { authMiddleware } from "../../../../core/middleware/auth.middleware";

// Multer config: store in memory (buffer), max 5MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

// Routes
// Note: Some endpoints might require firm auth (like getting history), 
// but for public mode we use optional auth to create/send messages.

router.post("/sessions", optionalAuthMiddleware, ChatbotController.createSession);
router.post("/message", optionalAuthMiddleware, ChatbotController.sendMessage);
router.post("/upload", optionalAuthMiddleware, upload.single("file"), ChatbotController.uploadFile);

// These could strictly require authMiddleware if public users aren't allowed to load/delete histories.
// Based on current logic, public might not have persistence, so optional auth is okay. The controller checks `req.user`.
router.get("/sessions", optionalAuthMiddleware, ChatbotController.getSessions);
router.delete("/sessions/:sessionId", optionalAuthMiddleware, ChatbotController.deleteSession);

// Admin-only (protected by standard auth for now, or admin middleware if available)
router.get("/analytics", authMiddleware, ChatbotController.getAnalytics);

// Load message history for a specific session
router.get("/sessions/:sessionId/messages", optionalAuthMiddleware, ChatbotController.getSessionMessages);

// Enhance prompt using AI
router.post("/enhance-prompt", optionalAuthMiddleware, ChatbotController.enhancePrompt);

export default router;
