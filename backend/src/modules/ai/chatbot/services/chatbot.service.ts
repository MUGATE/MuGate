import { ChatbotMemoryService } from "./chatbot.memory.service";
import { isQuerySafe } from "../guards/chatbot-content.guard";
import { AiProvider } from "../ai/ai.provider";
import { generateSystemPrompt } from "../ai/ai.prompts";
import { getGreeting } from "../utils/greeting.util";
import { logger } from "../../../../core/logger/logger";
import { ChatSession } from "../models/chat-session.model";
import { ChatbotContextService } from "./chatbot.context.service";
import { ChatbotAnalyticsService } from "./chatbot.analytics.service";
import { KnowledgeService } from "./knowledge.service";
import { ClassifierService, QuestionType } from "./classifier.service";

import { pool } from "../../../../core/database/connection";

export class ChatbotService {

    /**
     * Main Orchestrator for handling an incoming chat message.
     * Implements RAG pipeline: classify → retrieve → generate.
     */
        static async handleMessage(
        sessionId: string,
        userId: string | null,
        messageContent: string,
        userName?: string,
        reasoning?: boolean
    ) {
                // 1. Content Moderation Check
        if (!isQuerySafe(messageContent)) {
            const refusalText = "I cannot fulfill this request. My rules restrict me from discussing political debates, religious topics, or university gossip.";
            // Save both messages to DB so history is preserved
            await ChatbotMemoryService.saveMessage(sessionId, "user", messageContent, 0);
            await ChatbotMemoryService.saveMessage(sessionId, "assistant", refusalText, 0);
            ChatbotAnalyticsService.logQuery("RESTRICTED_TOPIC", true, 0);
            return { text: refusalText, tokensUsed: 0 };
        }

        try {
            // Check session source
            const sessionResult = await pool.request()
                .input("sessionId", sessionId)
                .query("SELECT source FROM ChatSessions WHERE id = @sessionId AND isActive = 1");
            const isResumeSession = sessionResult.recordset.length > 0 && sessionResult.recordset[0].source === "resume";

            if (isResumeSession) {
                const systemPrompt = `You are a professional, clear, and comprehensive AI resume optimizer and advisor for MuGate. You assist the student in reviewing, writing, and formatting their resume.
You should provide constructive, direct feedback on their resume content, vocabulary, metrics, and structure.
If they ask to add, change, remove, or modify something in their resume, write or rewrite the requested text/bullet points clearly and cleanly. Respond concisely and professionally in Markdown format.`;

                const history = await ChatbotMemoryService.getSessionHistory(sessionId, userId);
                await ChatbotMemoryService.saveMessage(sessionId, "user", messageContent, 0);

                const startGenTime = Date.now();
                const aiResponse = await AiProvider.generateResponse(systemPrompt, history, messageContent);
                const durationMs = Date.now() - startGenTime;

                await ChatbotMemoryService.saveMessage(sessionId, "assistant", aiResponse.text, aiResponse.tokensUsed);
                ChatbotAnalyticsService.logQuery("RESUME_CHAT", false, durationMs);
                return aiResponse;
            }

            // 2. Classify the question
            const questionType = ClassifierService.classify(messageContent);
            logger.info(`Question classified as: ${ClassifierService.describe(questionType)}`);

            // 3. Handle off-topic questions immediately (no AI call needed)
            if (questionType === QuestionType.OFF_TOPIC) {
                const refusalText = "I'm MuChat, your academic assistant — I'm here to help with university and study-related questions. Feel free to ask about courses, programs, admissions, schedules, regulations, or anything academic!";
                await ChatbotMemoryService.saveMessage(sessionId, "user", messageContent, 0);
                await ChatbotMemoryService.saveMessage(sessionId, "assistant", refusalText, 0);
                ChatbotAnalyticsService.logQuery("OFF_TOPIC", false, 0);
                return { text: refusalText, tokensUsed: 0 };
            }

            // 4. Load History
            const history = await ChatbotMemoryService.getSessionHistory(sessionId, userId);

            // 5. Build context based on question type
            let studentContext = "";
            let ragContext = "";
            let ragSourcesFound = 0;
            let ragCategories: string[] = [];
            let ragFreshlyScraped = false;

            // Personal academic context (for authenticated users)
            if (userId && (questionType === QuestionType.PERSONAL_ACADEMIC || questionType === QuestionType.UNIVERSITY_ACADEMIC)) {
                studentContext = await ChatbotContextService.buildStudentContext(userId);
            }

            // RAG retrieval from knowledge base (for university-related questions)
            if (questionType === QuestionType.UNIVERSITY_ACADEMIC) {
                const ragResult = await KnowledgeService.retrieveContext(messageContent);
                ragContext = ragResult.context;
                ragSourcesFound = ragResult.sourcesFound;
                ragCategories = ragResult.categories;
                ragFreshlyScraped = ragResult.freshlyScraped;
                logger.info(`RAG: Found ${ragSourcesFound} sources (confidence=${ragResult.confidence.toFixed(2)}, live=${ragFreshlyScraped}) from [${ragCategories.join(", ")}]`);
            }

            // 6. Save User Message
            await ChatbotMemoryService.saveMessage(sessionId, "user", messageContent, 0);

            // 7. Generate AI Response with RAG-enhanced prompt
            const systemPrompt = generateSystemPrompt(studentContext, ragContext, questionType, reasoning, ragFreshlyScraped);

            const startGenTime = Date.now();
            const aiResponse = await AiProvider.generateResponse(systemPrompt, history, messageContent);
            const durationMs = Date.now() - startGenTime;

            // 8. Save Assistant Response
            await ChatbotMemoryService.saveMessage(sessionId, "assistant", aiResponse.text, aiResponse.tokensUsed);

            // 9. Log Analytics with category info
            const analyticsCategory = ragSourcesFound > 0
                ? `RAG_${ragCategories[0]?.toUpperCase() || "GENERAL"}`
                : questionType.toUpperCase();
            ChatbotAnalyticsService.logQuery(analyticsCategory, false, durationMs);

            // 10. Return response
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
    static async createSession(userId: string | null, title?: string, isPinned: boolean = false, userName?: string, source: string = "chat"): Promise<ChatSession> {
        const session = await ChatbotMemoryService.createSession(userId, title, isPinned, source);

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
