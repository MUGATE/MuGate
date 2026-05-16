import { Router } from "express";
import { RoadMapController } from "./roadmap.controller";
import { authMiddleware } from "../../core/middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, RoadMapController.getRoadmap);
router.post("/", authMiddleware, RoadMapController.saveRoadmap);
router.post("/reset", authMiddleware, RoadMapController.resetRoadmap);

export default router;
