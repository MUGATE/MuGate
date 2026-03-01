import { logger } from "../../../../core/logger/logger";
import { ChatMessage } from "../models/chat-message.model";

/**
 * AI Provider — Supports Google AI Studio (Gemini) and OpenRouter.
 * Detects the provider based on AI_API_URL env var.
 * Includes retry with exponential backoff.
 */
export class AiProvider {
    private static MAX_RETRIES = 2;
    private static BASE_DELAY_MS = 2000;

    /** Fallback Gemini models for Google AI Studio */
    private static GEMINI_FALLBACK_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ];

    /** Fallback free models for OpenRouter */
    private static OPENROUTER_FALLBACK_MODELS = [
        "nvidia/nemotron-nano-9b-v2:free",
        "google/gemma-3-12b-it:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "qwen/qwen3-4b:free",
        "mistralai/mistral-small-3.1-24b-instruct:free",
    ];

    static async generateResponse(
        systemPrompt: string,
        history: ChatMessage[],
        newMessage: string
    ): Promise<{ text: string; tokensUsed: number }> {
        const apiKey = process.env.AI_API_KEY;
        const apiUrl = process.env.AI_API_URL || "";
        const primaryModel = process.env.AI_MODEL || "gemini-2.5-flash";

        // If no API key, return mock response
        if (!apiKey || apiKey === "mock") {
            logger.warn("No AI_API_KEY provided. Using mock AI response.");
            return {
                text: "This is a mock response from MuChat. Add AI_API_KEY to your .env file for real responses.",
                tokensUsed: 42
            };
        }

        // Detect provider: Google AI Studio vs OpenRouter
        const isGemini = apiUrl.includes("generativelanguage.googleapis.com") || apiUrl === "gemini";

        if (isGemini) {
            return this.callGemini(apiKey, primaryModel, systemPrompt, history, newMessage);
        } else {
            return this.callOpenRouter(apiKey, apiUrl || "https://openrouter.ai/api/v1/chat/completions", primaryModel, systemPrompt, history, newMessage);
        }
    }

    // ─── Google AI Studio (Gemini) ────────────────────────
    private static async callGemini(
        apiKey: string,
        primaryModel: string,
        systemPrompt: string,
        history: ChatMessage[],
        newMessage: string
    ): Promise<{ text: string; tokensUsed: number }> {
        const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

        // Build Gemini-format contents array
        const contents: any[] = [];

        // Add history messages (skip system role — handled via systemInstruction)
        for (const msg of history) {
            if (msg.role === "system") continue;
            contents.push({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }]
            });
        }

        // Add the new user message
        contents.push({
            role: "user",
            parts: [{ text: newMessage }]
        });

        const requestBody = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.3 }
        };

        // Build model list: primary first, then fallbacks
        const modelsToTry = [primaryModel, ...this.GEMINI_FALLBACK_MODELS.filter(m => m !== primaryModel)];

        for (const model of modelsToTry) {
            for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
                try {
                    const url = `${baseUrl}/${model}:generateContent?key=${apiKey}`;
                    logger.info(`Calling Gemini: ${model} (attempt ${attempt + 1}/${this.MAX_RETRIES + 1})`);

                    const response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody)
                    });

                    if (response.status === 429) {
                        const errorBody = await response.text();
                        logger.warn(`Rate limited (429) on ${model}: ${errorBody.substring(0, 200)}`);

                        if (attempt < this.MAX_RETRIES) {
                            const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
                            logger.info(`Retrying ${model} in ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                        break; // Try next model
                    }

                    if (!response.ok) {
                        const errorData = await response.text();
                        logger.error(`Gemini API Error (${response.status}) on ${model}: ${errorData.substring(0, 300)}`);
                        break; // Try next model
                    }

                    const data = await response.json();
                    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
                    const tokensUsed = (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0);

                    logger.info(`Gemini response received from ${model} (${tokensUsed} tokens)`);
                    return { text: textResult, tokensUsed };

                } catch (error: any) {
                    logger.error(`Gemini Exception on ${model} (attempt ${attempt + 1}): ${error.message}`);
                    if (attempt >= this.MAX_RETRIES) break;
                    const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        logger.error("All Gemini models exhausted. Returning fallback message.");
        return {
            text: "I'm having trouble connecting right now. Please try again in a moment.",
            tokensUsed: 0
        };
    }

    // ─── OpenRouter (OpenAI-compatible) ───────────────────
    private static async callOpenRouter(
        apiKey: string,
        apiUrl: string,
        primaryModel: string,
        systemPrompt: string,
        history: ChatMessage[],
        newMessage: string
    ): Promise<{ text: string; tokensUsed: number }> {
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: newMessage }
        ];

        const modelsToTry = [primaryModel, ...this.OPENROUTER_FALLBACK_MODELS.filter(m => m !== primaryModel)];

        for (const model of modelsToTry) {
            for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
                try {
                    logger.info(`Calling OpenRouter: ${model} (attempt ${attempt + 1}/${this.MAX_RETRIES + 1})`);

                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`,
                            "HTTP-Referer": "https://mugate.app",
                            "X-Title": "MuChat"
                        },
                        body: JSON.stringify({ model, messages, temperature: 0.3 })
                    });

                    if (response.status === 429) {
                        const errorBody = await response.text();
                        logger.warn(`Rate limited (429) on ${model}: ${errorBody.substring(0, 200)}`);
                        if (attempt < this.MAX_RETRIES) {
                            const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                        break;
                    }

                    if (response.status === 400 || response.status === 402) {
                        const errorData = await response.text();
                        logger.warn(`Model ${model} returned ${response.status}: ${errorData.substring(0, 200)}`);
                        break;
                    }

                    if (!response.ok) {
                        const errorData = await response.text();
                        logger.error(`AI API Error (${response.status}): ${errorData}`);
                        throw new Error(`AI API returned ${response.status}`);
                    }

                    const data = await response.json();
                    const textResult = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
                    const tokensUsed = data.usage?.total_tokens || 0;

                    logger.info(`OpenRouter response received from ${model} (${tokensUsed} tokens)`);
                    return { text: textResult, tokensUsed };

                } catch (error: any) {
                    logger.error(`OpenRouter Exception on ${model} (attempt ${attempt + 1}): ${error.message}`);
                    if (attempt >= this.MAX_RETRIES) break;
                    const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        logger.error("All OpenRouter models exhausted. Returning fallback message.");
        return {
            text: "I'm having trouble connecting right now. Please try again in a moment.",
            tokensUsed: 0
        };
    }
}
