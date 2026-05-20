import { Router } from "express";
import multer from "multer";
import { generateResume, editResume } from "./controllers/resume.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/resume/generate
router.post("/generate", generateResume);

// POST /api/resume/edit
router.post("/edit", upload.single("file"), editResume);

export default router;
