import { Router } from "express";
import multer from "multer";
import { generateResume, editResume, analyzeResumeController, aiEditResumeController, parseResumeController } from "./controllers/resume.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/resume/generate
router.post("/generate", generateResume);

// POST /api/resume/analyze — explainable AI scoring (resumeText, optional jobDescription)
router.post("/analyze", analyzeResumeController);

// POST /api/resume/ai-edit — structured AI rewrite of a resume / section (editor)
router.post("/ai-edit", aiEditResumeController);

// POST /api/resume/parse — parse raw resume text into structured editable JSON
router.post("/parse", parseResumeController);

// POST /api/resume/edit
router.post("/edit", upload.single("file"), editResume);

export default router;
