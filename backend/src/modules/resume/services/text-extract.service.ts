import { FileParserService } from "../../ai/chatbot/files/file-parser.service";

/**
 * Extract the FULL raw text from an uploaded resume (PDF or DOCX) server-side.
 * Reuses the chatbot's proven PDF/DOCX parser (pdf-parse v2 + mammoth) so the
 * structured resume parser receives the complete, lossless CV content.
 * Returns "" when the file has no extractable text (e.g. scanned image).
 */
export async function extractResumeText(file: Express.Multer.File): Promise<string> {
  const text = await FileParserService.extractText(file.originalname, file.mimetype, file.buffer);
  // FileParserService returns a bracketed placeholder when nothing was extracted.
  if (!text || /^\[(PDF|DOCX|Unsupported)/i.test(text.trim())) return "";
  return text.trim();
}
