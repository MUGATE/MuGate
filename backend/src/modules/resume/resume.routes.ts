import { Router } from "express";
import { generateResumePdf, generateResumeDocx } from "./resume.service";

const router = Router();

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

export default router;
