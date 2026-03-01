import { logger } from "../../../../core/logger/logger";
import path from "path";

/**
 * Parses files like PDF or DOCX to extract text.
 * Requires libraries like pdf-parse, mammoth, etc. depending on implementation.
 * Currently returns a mock extraction string.
 */
export class FileParserService {

    static async extractText(filePath: string, mimeType: string): Promise<string> {
        const ext = path.extname(filePath).toLowerCase();

        try {
            // Placeholder: Here you would integrate 'pdf-parse' for PDFs or 'mammoth' for DOCX.
            if (ext === ".pdf" || mimeType === "application/pdf") {
                logger.info(`Extracting text from PDF: ${filePath}`);
                // Mock extracted text
                return `[Extracted Text from PDF ${path.basename(filePath)}]: The quick brown fox jumps over the lazy dog.`;
            } else if (ext === ".docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                logger.info(`Extracting text from DOCX: ${filePath}`);
                // Mock extracted text
                return `[Extracted Text from DOCX ${path.basename(filePath)}]: Academic regulations require 120 credits for graduation.`;
            } else {
                return `[Extracted content from unsupported file type ${ext}]`;
            }
        } catch (error: any) {
            logger.error(`Failed to parse file: ${error.message}`);
            throw new Error(`Failed to extract text from file ${path.basename(filePath)}`);
        }
    }
}
