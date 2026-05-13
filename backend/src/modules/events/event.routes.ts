import { Router } from "express";
import { EventController } from "./event.controller";

const router = Router();

// Public routes — no auth required for reading events
router.get("/", EventController.getUpcoming);
router.get("/categories", EventController.getCategories);
router.get("/stats", EventController.getStats);
router.get("/:id", EventController.getById);

// Scrape trigger — could be protected with auth in production
router.post("/scrape", EventController.triggerScrape);

export default router;