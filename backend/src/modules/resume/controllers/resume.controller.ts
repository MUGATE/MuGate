import { Request, Response } from "express";
import { generateResumePdf } from "../services/pdf-generator.service";
import { generateResumeDocx } from "../services/docx-generator.service";
import { editResumeDocument } from "../services/editor.service";
import { analyzeResume } from "../services/analyzer.service";
import { aiEditResume } from "../services/ai-editor.service";

/**
 * Controller for generating resumes in PDF or DOCX formats
 */
export async function generateResume(req: Request, res: Response) {
  try {
    const { format, formData, extras, fileType } = req.body;
    if (!format || !formData) {
      return res.status(400).json({ success: false, message: "format and formData are required" });
    }
    if (format !== "local" && format !== "global") {
      return res.status(400).json({ success: false, message: "format must be 'local' or 'global'" });
    }

    // `extras` holds the dynamically-added repeatable entries (extra education,
    // experience, projects, leadership). It is optional for backward compatibility.
    const safeExtras = extras && typeof extras === "object" ? extras : {};

    const outputType = fileType === "docx" ? "docx" : "pdf";

    if (outputType === "docx") {
      const docxBuffer = await generateResumeDocx(format, formData, safeExtras);
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="resume.docx"`,
        "Content-Length": docxBuffer.length.toString(),
      });
      res.send(docxBuffer);
    } else {
      const pdfBuffer = await generateResumePdf(format, formData, safeExtras);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      });
      res.send(pdfBuffer);
    }
  } catch (err: any) {
    console.error("Document generation error:", err);
    res.status(500).json({ success: false, message: "Failed to generate document" });
  }
}

/**
 * Controller for AI-powered resume analysis.
 * Body: { resumeText: string, jobDescription?: string }
 * Returns explainable structured scoring (always 200 with a result — the service
 * falls back to a deterministic heuristic if the AI is unavailable).
 */
export async function analyzeResumeController(req: Request, res: Response) {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
      return res.status(400).json({ success: false, message: "resumeText is required" });
    }

    const analysis = await analyzeResume(
      resumeText,
      typeof jobDescription === "string" ? jobDescription : undefined
    );

    res.json({ success: true, analysis });
  } catch (err: any) {
    console.error("Resume analysis error:", err);
    res.status(500).json({ success: false, message: "Failed to analyze resume" });
  }
}

/**
 * Controller for AI-powered structured resume editing (Jobsuit-style editor).
 * Body: { resume: NormalizedResume, instruction: string, scope?: string }
 * Always 200 with a resume — on AI failure it echoes the input unchanged.
 */
export async function aiEditResumeController(req: Request, res: Response) {
  try {
    const { resume, instruction, scope } = req.body;
    if (!resume || typeof resume !== "object") {
      return res.status(400).json({ success: false, message: "resume object is required" });
    }
    const result = await aiEditResume(
      resume,
      typeof instruction === "string" ? instruction : "",
      typeof scope === "string" ? scope : undefined
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("AI resume edit error:", err);
    res.status(500).json({ success: false, message: "Failed to edit resume" });
  }
}

/**
 * Controller for editing existing resumes via AI instructions
 */
export async function editResume(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }
    const instructions = req.body.instructions || "";
    if (!instructions.trim()) {
      return res.status(400).json({ success: false, message: "Edit instructions are required" });
    }

    const modifiedBuffer = await editResumeDocument(req.file, instructions);

    res.set({
      "Content-Type": req.file.mimetype,
      "Content-Disposition": `attachment; filename="modified_${req.file.originalname}"`,
      "Content-Length": modifiedBuffer.length.toString(),
    });
    res.send(modifiedBuffer);
  } catch (err: any) {
    console.error("Document edit error:", err);
    res.status(500).json({ success: false, message: `Failed to edit document: ${err.message}` });
  }
}
