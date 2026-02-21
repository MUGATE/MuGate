import { Router } from "express";
import { SchedulesController } from "./schedules.controller";
import { authMiddleware } from "../../core/middleware/auth.middleware";

const router = Router();

// Retrieve all saved schedules for the authenticated user
router.get("/", authMiddleware, SchedulesController.getAll);

// Save a newly chosen schedule
router.post("/save", authMiddleware, SchedulesController.save);

// Delete a specific saved schedule
router.delete("/:id", authMiddleware, SchedulesController.remove);

export default router;
