import { logger } from "../../../../core/logger/logger";
import { FileParserService } from "./file-parser.service";
import { ImageVisionService } from "./image-vision.service";
import { FileUploadResult } from "./file.types";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "image/jpeg",
    "image/png",
    "image/webp"
];

export class FileUploadService {

    /**
     * Processing a raw uploaded buffer.
     * In a real system, 'multer' would handle the Express request.
     */
    static async processUploadedFile(buffer: Buffer, fileName: string, mimeType: string, fileSize: number): Promise<FileUploadResult> {

        // 1. Validation
        if (fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
            throw new Error(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        }

        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, DOCX, or images.`);
        }

        // 2. Sanitization (basic)
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        logger.info(`Processing safe file: ${safeFileName}`);

        const isImage = mimeType.startsWith("image/");
        let extractedText = undefined;

        // 3. Extraction / Vision
        if (isImage) {
            // Wait for user prompt to combine with vision later, 
            // or extract initial OCR text if no prompt given yet.
            extractedText = await ImageVisionService.analyzeImage(safeFileName, mimeType, buffer);
        } else {
            extractedText = await FileParserService.extractText(safeFileName, mimeType, buffer);
        }

        return {
            fileName: safeFileName,
            mimeType,
            extractedText,
            isImage
        };
    }
}
