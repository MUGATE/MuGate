import { Request, Response } from "express";
import { ChatbotService } from "../services/chatbot.service";
import { ChatbotMemoryService } from "../services/chatbot.memory.service";
import { SendMessageDto } from "../dto/send-message.dto";
import { CreateSessionDto } from "../dto/create-session.dto";
import { FileUploadService } from "../files/file-upload.service";
import { AiProvider } from "../ai/ai.provider";

export class ChatbotController {

    static async createSession(req: Request, res: Response) {
        try {
            // @ts-ignore
            const user = req.user; // Set by optionalAuth middleware
            const userId = user ? user.userId : null;
            const userName = user ? user.name : undefined;

            const dto: CreateSessionDto = req.body;
            const source = dto.source === "resume" ? "resume" : "chat";

            const session = await ChatbotService.createSession(userId, dto.title, dto.isPinned, userName, source);

            res.status(201).json({ success: true, session });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getSessions(req: Request, res: Response) {
        try {
            // @ts-ignore
            const user = req.user;
            if (!user) {
                // For anonymous users, check if session IDs were sent as query param
                const idsParam = req.query.ids as string;
                if (idsParam) {
                    const sessionIds = idsParam.split(",").map(id => id.trim()).filter(Boolean);
                    const sessions = await ChatbotMemoryService.getSessionsByIds(sessionIds);
                    return res.status(200).json({ success: true, sessions });
                }
                return res.status(200).json({ success: true, sessions: [] });
            }

            const sessions = await ChatbotMemoryService.getSessions(user.userId);
            res.status(200).json({ success: true, sessions });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async sendMessage(req: Request, res: Response) {
        try {
            // @ts-ignore
            const user = req.user;
            const userId = user ? user.userId : null;
            const userName = user ? user.name : undefined;

            const dto: SendMessageDto = req.body;
            if (!dto.sessionId || !dto.content) {
                return res.status(400).json({ success: false, message: "sessionId and content are required." });
            }

            const response = await ChatbotService.handleMessage(dto.sessionId, userId, dto.content, userName, dto.reasoning);

            res.status(200).json({ success: true, ...response });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async deleteSession(req: Request, res: Response) {
        try {
            const sessionId = req.params.sessionId as string;
            // @ts-ignore
            const user = req.user;
            const userId = user ? user.userId : null;

            // Optional: verify ownership
            // Done implicitly inside memory logic if desired or we can do it here.
            await ChatbotMemoryService.getSessionHistory(sessionId, userId); // Throws if unauthorized

            await ChatbotMemoryService.deleteSession(sessionId);
            res.status(200).json({ success: true, message: "Session deleted." });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getAnalytics(req: Request, res: Response) {
        try {
            const { ChatbotAnalyticsService } = require("../services/chatbot.analytics.service");
            const stats = await ChatbotAnalyticsService.getAggregatedStats();
            res.status(200).json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async uploadFile(req: Request, res: Response) {
        try {
            // @ts-ignore
            const user = req.user;
            const userId = user ? user.userId : null;

            const sessionId = req.body.sessionId;
            const userPrompt = req.body.prompt || "";

            if (!sessionId) {
                return res.status(400).json({ success: false, message: "sessionId is required." });
            }

            // @ts-ignore - multer adds file to req
            const file = req.file;
            if (!file) {
                return res.status(400).json({ success: false, message: "No file uploaded." });
            }

            // Process the file (validate, extract text / vision)
            const uploadResult = await FileUploadService.processUploadedFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                file.size
            );

            // Send extracted content to AI via handleFileUpload
            const response = await ChatbotService.handleFileUpload(
                sessionId,
                userId,
                uploadResult.extractedText || "[No text could be extracted from this file]",
                uploadResult.fileName,
                userPrompt || undefined
            );

            res.status(200).json({
                success: true,
                ...response,
                attachment: {
                    fileName: uploadResult.fileName,
                    mimeType: uploadResult.mimeType,
                    isImage: uploadResult.isImage
                }
            });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async enhancePrompt(req: Request, res: Response) {
        try {
            const { prompt } = req.body;
            if (!prompt || !prompt.trim()) {
                return res.status(400).json({ success: false, message: "prompt is required." });
            }

            const systemPrompt = `You are a prompt optimizer and rewriting assistant.
Your ONLY job is to take a raw user query and rewrite it into a highly clear, descriptive, and well-structured prompt that a chatbot can answer perfectly.

CRITICAL DIRECTIVES:
- DO NOT answer the query or question. You must only rewrite and improve the query itself. Under no circumstances should you provide the answer to what the user is asking.
- Keep the language of the prompt exactly as it is (e.g. if the query is in Arabic, rewrite it in Arabic).
- Do NOT add any preamble or prefixes like "Enhanced:", "Here is the improved query:", or quotes around the result.
- Return ONLY the rewritten query text.

Examples:
Input: "who is dean of engineering"
Output: "Can you list the name and contact details of the current Dean of the Faculty of Engineering at Al Maaref University?"

Input: "tuition fees"
Output: "What is the detailed tuition fee structure for undergraduate and graduate programs at Al Maaref University?"

Input: "من هم الدكاترة في كلية العلوم"
Output: "هل يمكنك تزويدي بقائمة بأسماء الدكاترة والأساتذة المحاضرين في كلية العلوم وتخصصاتهم؟"`;

            const result = await AiProvider.generateResponse(systemPrompt, [], prompt.trim());

            res.status(200).json({
                success: true,
                enhancedPrompt: result.text.trim(),
                tokensUsed: result.tokensUsed
            });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getSessionMessages(req: Request, res: Response) {
        try {
            const sessionId = req.params.sessionId as string;
            // @ts-ignore
            const user = req.user;
            const userId = user ? user.userId : null;

            const messages = await ChatbotMemoryService.getSessionHistory(sessionId, userId);
            res.status(200).json({ success: true, messages });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
