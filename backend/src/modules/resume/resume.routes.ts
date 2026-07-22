import { Router } from "express";
import multer from "multer";
import { generateResume, editResume, analyzeResumeController, aiEditResumeController, parseResumeController, convertResumeController, convertResumeBase64Controller } from "./controllers/resume.controller";
import { optionalAuthMiddleware } from "../../core/middleware/optionalAuth.middleware";
import { aiRateLimiter } from "../../core/middleware/rateLimiter.middleware";
import { APP_CONSTANTS } from "../../config/constants";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: APP_CONSTANTS.RESUME_UPLOAD_MAX_BYTES },
});

// Public resume tools — optional auth attaches user when logged in
router.use(optionalAuthMiddleware);
router.use(aiRateLimiter);

// POST /api/resume/generate
router.post("/generate", generateResume);

// POST /api/resume/analyze — explainable AI scoring (resumeText, optional jobDescription)
router.post("/analyze", analyzeResumeController);

// POST /api/resume/ai-edit — structured AI rewrite of a resume / section (editor)
router.post("/ai-edit", aiEditResumeController);

// POST /api/resume/parse — parse raw resume text into structured editable JSON
router.post("/parse", parseResumeController);

// POST /api/resume/convert — upload a file, extract full text, return structured JSON
router.post("/convert", upload.single("file"), convertResumeController);

// POST /api/resume/convert-base64 — same as convert, but JSON body (mobile-friendly)
router.post("/convert-base64", convertResumeBase64Controller);

// POST /api/resume/edit
router.post("/edit", upload.single("file"), editResume);

export default router;
