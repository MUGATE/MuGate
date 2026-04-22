import { Request, Response } from "express";
import { ChatbotService } from "../services/chatbot.service";
import { ChatbotMemoryService } from "../services/chatbot.memory.service";
import { SendMessageDto } from "../dto/send-message.dto";
import { CreateSessionDto } from "../dto/create-session.dto";

export class ChatbotController {

    static async createSession(req: Request, res: Response) {
        try {
            // @ts-ignore
            const user = req.user; // Set by optionalAuth middleware
            const userId = user ? user.userId : null;
            const userName = user ? user.name : undefined;

            const dto: CreateSessionDto = req.body;

            const session = await ChatbotService.createSession(userId, dto.title, dto.isPinned, userName);

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

            const response = await ChatbotService.handleMessage(dto.sessionId, userId, dto.content, userName);

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
