import { Router } from "express";
import multer from "multer";
import { generateResumePdf, generateResumeDocx, editResumeDocument } from "./resume.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/generate", async (req, res) => {
  try {
    const { format, formData, fileType } = req.body;
    if (!format || !formData) {
      return res.status(400).json({ success: false, message: "format and formData are required" });
    }
    if (format !== "local" && format !== "global") {
      return res.status(400).json({ success: false, message: "format must be 'local' or 'global'" });
    }

    const outputType = fileType === "docx" ? "docx" : "pdf";

    if (outputType === "docx") {
      const docxBuffer = await generateResumeDocx(format, formData);
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="resume.docx"`,
        "Content-Length": docxBuffer.length.toString(),
      });
      res.send(docxBuffer);
    } else {
      const pdfBuffer = await generateResumePdf(format, formData);
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
});

/**
 * POST /api/resume/edit
 * Allows AI to edit an uploaded resume document.
 * Accepts: file (PDF/DOCX), instructions (string of edits to apply)
 * Returns: modified file buffer
 */
router.post("/edit", upload.single("file"), async (req, res) => {
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
});

export default router;

