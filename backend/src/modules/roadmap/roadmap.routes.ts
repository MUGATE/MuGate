import { Router } from "express";
import { RoadMapController } from "./roadmap.controller";
import { authMiddleware } from "../../core/middleware/auth.middleware";
import { optionalAuthMiddleware } from "../../core/middleware/optionalAuth.middleware";

const router = Router();

router.get("/", optionalAuthMiddleware, RoadMapController.getRoadmap);
router.post("/", authMiddleware, RoadMapController.saveRoadmap);
router.post("/reset", authMiddleware, RoadMapController.resetRoadmap);

export default router;
