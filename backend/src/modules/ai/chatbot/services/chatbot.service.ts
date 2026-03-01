import { ChatbotMemoryService } from "./chatbot.memory.service";
import { isQuerySafe } from "../guards/chatbot-content.guard";
import { AiProvider } from "../ai/ai.provider";
import { generateSystemPrompt } from "../ai/ai.prompts";
import { getGreeting } from "../utils/greeting.util";
import { logger } from "../../../../core/logger/logger";
import { ChatSession } from "../models/chat-session.model";
import { ChatbotContextService } from "./chatbot.context.service";
import { ChatbotAnalyticsService } from "./chatbot.analytics.service";

export class ChatbotService {

    /**
     * Main Orchestrator for handling an incoming chat message.
     */
    static async handleMessage(
        sessionId: string,
        userId: string | null,
        messageContent: string,
        userName?: string
    ) {
        // 1. Content Moderation Check
        if (!isQuerySafe(messageContent)) {
            ChatbotAnalyticsService.logQuery("RESTRICTED_TOPIC", true, 0);
            return {
                text: "I cannot fulfill this request. My rules restrict me from discussing political debates, religious topics, or university gossip.",
                tokensUsed: 0
            };
        }

        try {
            // 2. Load History
            const history = await ChatbotMemoryService.getSessionHistory(sessionId, userId);

            // 3. Detect Mode & Build Context (Phase 2)
            let contextData = "";
            if (userId) {
                // Fetch dynamic data for authenticated users
                contextData = await ChatbotContextService.buildStudentContext(userId);
            }

            // 4. Save User Message
            await ChatbotMemoryService.saveMessage(sessionId, "user", messageContent, 0);

            // 5. Generate Response via AI Provider
            const systemPrompt = generateSystemPrompt(contextData);

            const startGenTime = Date.now();
            const aiResponse = await AiProvider.generateResponse(systemPrompt, history, messageContent);
            const durationMs = Date.now() - startGenTime;

            // 6. Save Assistant Response
            await ChatbotMemoryService.saveMessage(sessionId, "assistant", aiResponse.text, aiResponse.tokensUsed);

            // 7. Log Analytics
            ChatbotAnalyticsService.logQuery("GENERAL_QUERY", false, durationMs);

            // 8. Return response directly
            return aiResponse;
        } catch (error: any) {
            ChatbotAnalyticsService.logQuery("GENERAL_QUERY", true, 0);
            logger.error(`ChatbotService error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Creates a new chat session. If userId is provided, it's authenticated. Otherwise public.
     */
    static async createSession(userId: string | null, title?: string, isPinned: boolean = false, userName?: string): Promise<ChatSession> {
        const session = await ChatbotMemoryService.createSession(userId, title, isPinned);

        // Welcome message
        const welcomeMessage = getGreeting(userName);
        await ChatbotMemoryService.saveMessage(session.id, "assistant", welcomeMessage, 0);

        return session;
    }

    /**
     * Handles file uploads. If no prompt provided, it summarizes.
     */
    static async handleFileUpload(
        sessionId: string,
        userId: string | null,
        fileExtractedText: string,
        fileName: string,
        userPrompt?: string
    ) {
        let aiPrompt = "";
        if (!userPrompt) {
            aiPrompt = `Please summarize the following file content from [${fileName}]:\n\n${fileExtractedText}`;
        } else {
            aiPrompt = `Given the extracted text from [${fileName}]:\n\n${fileExtractedText}\n\nUser Question: ${userPrompt}`;
        }

        return this.handleMessage(sessionId, userId, aiPrompt);
    }

    /**
     * Handles a voice input by converting speech to text then processing.
     */
    static async handleVoiceMessage(
        sessionId: string,
        userId: string | null,
        transcription: string,
        userName?: string
    ) {
        return this.handleMessage(sessionId, userId, transcription, userName);
    }
}
