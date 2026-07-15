import { Request, Response } from "express";
import { generateResumePdf } from "../services/pdf-generator.service";
import { generateResumeDocx } from "../services/docx-generator.service";
import { editResumeDocument } from "../services/editor.service";
import { analyzeResume } from "../services/analyzer.service";
import { aiEditResume, parseResumeText } from "../services/ai-editor.service";
import { extractResumeText } from "../services/text-extract.service";

/** Multer on mobile sometimes omits the original filename — recover it from a form field. */
function fixUploadedFileName(req: Request): void {
  const file = req.file;
  if (!file) return;
  const fromBody = typeof req.body?.originalName === "string" ? req.body.originalName.trim() : "";
  if (fromBody && (!file.originalname || file.originalname === "file" || !/\.\w+$/.test(file.originalname))) {
    file.originalname = fromBody;
  }
}

function mimeFromFileName(name: string): string {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "doc") return "application/msword";
  return "application/octet-stream";
}

function bufferToMulterFile(buffer: Buffer, originalName: string): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: originalName,
    encoding: "7bit",
    mimetype: mimeFromFileName(originalName),
    buffer,
    size: buffer.length,
    stream: null as any,
    destination: "",
    filename: originalName,
    path: "",
  };
}

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
    // Mobile clients can't reliably read a binary body, so when `base64: true`
    // is sent we return the document as a base64 JSON payload instead.
    const asBase64 = req.body.base64 === true || req.body.base64 === "true";

    if (outputType === "docx") {
      const docxBuffer = await generateResumeDocx(format, formData, safeExtras);
      const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (asBase64) {
        return res.json({ success: true, base64: docxBuffer.toString("base64"), mimeType, filename: "resume.docx" });
      }
      res.set({
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="resume.docx"`,
        "Content-Length": docxBuffer.length.toString(),
      });
      res.send(docxBuffer);
    } else {
      const pdfBuffer = await generateResumePdf(format, formData, safeExtras);
      if (asBase64) {
        return res.json({ success: true, base64: pdfBuffer.toString("base64"), mimeType: "application/pdf", filename: "resume.pdf" });
      }
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
 * Controller for parsing raw resume text into a structured, editable resume.
 * Body: { resumeText: string, template?: 'local' | 'global' }
 * Always 200 with a resume — returns an empty structured resume on AI failure.
 */
export async function parseResumeController(req: Request, res: Response) {
  try {
    const { resumeText, template } = req.body;
    if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
      return res.status(400).json({ success: false, message: "resumeText is required" });
    }
    const tpl = template === "global" ? "global" : "local";
    const resume = await parseResumeText(resumeText, tpl);
    res.json({ success: true, resume });
  } catch (err: any) {
    console.error("Resume parse error:", err);
    res.status(500).json({ success: false, message: "Failed to parse resume" });
  }
}

/**
 * Controller for converting an uploaded resume FILE into a structured, editable
 * resume in one hop: extracts the FULL raw text server-side (no lossy AI
 * summarisation), then parses it into the chosen Local/Global template.
 * Body (multipart): file, template ('local' | 'global').
 */
export async function convertResumeController(req: Request, res: Response) {
  try {
    fixUploadedFileName(req);
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }
    const template = req.body.template === "global" ? "global" : "local";
    const text = await extractResumeText(req.file);
    if (!text || text.trim().length < 20) {
      return res.status(422).json({
        success: false,
        message: "Could not read text from this file — it may be a scanned image or empty.",
      });
    }
    const resume = await parseResumeText(text, template);
    res.json({ success: true, resume, text });
  } catch (err: any) {
    console.error("Resume convert error:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to convert resume" });
  }
}

/**
 * JSON base64 upload for mobile clients — avoids multipart / content:// URI issues on Android.
 * Body: { base64, originalName, template ('local' | 'global') }.
 */
export async function convertResumeBase64Controller(req: Request, res: Response) {
  try {
    const { base64, originalName, template } = req.body ?? {};
    if (!base64 || typeof base64 !== "string" || !base64.trim()) {
      return res.status(400).json({ success: false, message: "base64 is required" });
    }
    const name =
      typeof originalName === "string" && originalName.trim()
        ? originalName.trim()
        : "resume.docx";
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, "base64");
    } catch {
      return res.status(400).json({ success: false, message: "Invalid base64 payload" });
    }
    if (buffer.length === 0) {
      return res.status(400).json({ success: false, message: "Empty file" });
    }
    const tpl = template === "global" ? "global" : "local";
    const file = bufferToMulterFile(buffer, name);
    const text = await extractResumeText(file);
    if (!text || text.trim().length < 20) {
      return res.status(422).json({
        success: false,
        message: "Could not read text from this file — it may be a scanned image or empty.",
      });
    }
    const resume = await parseResumeText(text, tpl);
    res.json({ success: true, resume, text });
  } catch (err: any) {
    console.error("Resume convert-base64 error:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to convert resume" });
  }
}

/**
 * Controller for editing existing resumes via AI instructions
 */
export async function editResume(req: Request, res: Response) {
  try {
    fixUploadedFileName(req);
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }
    const instructions = req.body.instructions || "";
    if (!instructions.trim()) {
      return res.status(400).json({ success: false, message: "Edit instructions are required" });
    }

    const modifiedBuffer = await editResumeDocument(req.file, instructions);
    const rawName = String(req.file.originalname || "file").replace(/[\r\n"]/g, "_");
    const safeBase = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
    const filename = `modified_${safeBase}`;
    const asBase64 = req.body.asBase64 === true || req.body.asBase64 === "true";

    if (asBase64) {
      return res.json({
        success: true,
        base64: modifiedBuffer.toString("base64"),
        mimeType: req.file.mimetype,
        filename,
      });
    }

    res.set({
      "Content-Type": req.file.mimetype,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": modifiedBuffer.length.toString(),
    });
    res.send(modifiedBuffer);
  } catch (err: any) {
    console.error("Document edit error:", err);
    res.status(500).json({ success: false, message: `Failed to edit document: ${err.message}` });
  }
}
