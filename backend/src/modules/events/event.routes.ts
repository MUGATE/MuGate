import { Router } from "express";
import { EventController } from "./event.controller";
import { authMiddleware } from "../../core/middleware/auth.middleware";
import { adminMiddleware } from "../../core/middleware/admin.middleware";

const router = Router();

// Public routes — no auth required for reading events
router.get("/", EventController.getUpcoming);
router.get("/categories", EventController.getCategories);
router.get("/stats", EventController.getStats);
router.get("/:id", EventController.getById);

// Admin-only event routes
router.post("/", authMiddleware, adminMiddleware, EventController.addManualEvent);
router.put("/:id", authMiddleware, adminMiddleware, EventController.updateManualEvent);
router.delete("/:id", authMiddleware, adminMiddleware, EventController.deleteManualEvent);

// Scrape trigger — admin only
router.post("/scrape", authMiddleware, adminMiddleware, EventController.triggerScrape);

export default router;