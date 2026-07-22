import { Router } from "express";
import { CoursesController } from "./courses.controller";
import { authMiddleware } from "../../../core/middleware/auth.middleware";
import { syncRateLimiter } from "../../../core/middleware/rateLimiter.middleware";

const router = Router();

// General user routes (protected)
router.use(authMiddleware);
router.get("/", CoursesController.getAll);
router.get("/:id", CoursesController.getById);

router.post("/sync", syncRateLimiter, CoursesController.syncCourses);

export default router;
