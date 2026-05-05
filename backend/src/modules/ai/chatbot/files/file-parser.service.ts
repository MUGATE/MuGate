import { logger } from "../../../../core/logger/logger";
import path from "path";
import { pathToFileURL } from "url";

/**
 * Parses files like PDF or DOCX to extract text.
 * Uses pdf-parse for PDFs and mammoth for DOCX.
 */
export class FileParserService {

    static async extractText(fileName: string, mimeType: string, buffer?: Buffer): Promise<string> {
        const ext = path.extname(fileName).toLowerCase();

        try {
            if (ext === ".pdf" || mimeType === "application/pdf") {
                logger.info(`Extracting text from PDF: ${fileName}`);
                                if (!buffer) throw new Error("No buffer provided for PDF parsing");
                // pdf-parse v2+ exports PDFParse class
                const { PDFParse } = await import("pdf-parse");
                // Worker path must be a file:// URL for Node.js ESM loader
                const workerPath = path.join(path.dirname(require.resolve("pdf-parse")), "pdf.worker.mjs");
                PDFParse.setWorker(pathToFileURL(workerPath).href);
                const parser = new PDFParse({ data: buffer, verbosity: 0 });
                const result = await parser.getText();
                const text = result?.text?.trim() || "";
                                if (!text || text.length === 0) {
                    return `[PDF "${fileName}" contained no extractable text — it may be a scanned/image-based PDF]`;
                }
                logger.info(`Extracted ${text.length} chars from PDF "${fileName}"`);
                return text;
            } else if (ext === ".docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                logger.info(`Extracting text from DOCX: ${fileName}`);
                if (!buffer) throw new Error("No buffer provided for DOCX parsing");
                const mammoth = await import("mammoth");
                const result = await mammoth.extractRawText({ buffer });
                const text = result.value?.trim();
                if (!text || text.length === 0) {
                    return `[DOCX "${fileName}" contained no extractable text]`;
                }
                logger.info(`Extracted ${text.length} chars from DOCX "${fileName}"`);
                return text;
            } else {
                return `[Unsupported file type: ${ext}]`;
            }
        } catch (error: any) {
            logger.error(`Failed to parse file "${fileName}": ${error.message}`);
            throw new Error(`Failed to extract text from "${fileName}": ${error.message}`);
        }
    }
}
