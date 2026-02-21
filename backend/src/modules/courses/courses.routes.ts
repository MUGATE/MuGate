import { Router } from "express";
import { CoursesController } from "./courses.controller";
import { authMiddleware } from "../../core/middleware/auth.middleware";

const router = Router();

// General user routes (protected)
router.use(authMiddleware);
router.get("/", CoursesController.getAll);
router.get("/:id", CoursesController.getById);

// Admin / Sync routes will go here
router.post("/sync", CoursesController.syncCourses);

export default router;
