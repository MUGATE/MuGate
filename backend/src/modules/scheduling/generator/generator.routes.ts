import { Router } from "express";
import { GeneratorController } from "./generator.controller";
import { authMiddleware } from "../../../core/middleware/auth.middleware";

const router = Router();

// Protect generator endpoint behind authentication
router.post("/", authMiddleware, GeneratorController.generate);

export const generatorRoutes = router;
