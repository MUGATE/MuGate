import { Router } from "express";
import { HistoryController } from "./history.controller";
import { authMiddleware } from "../../core/middleware/auth.middleware";

const router = Router();

// Protect all history routes with JWT authentication
router.use(authMiddleware);

router.get("/", HistoryController.getStudentHistory);
router.post("/sync", HistoryController.syncHistory);

export default router;
