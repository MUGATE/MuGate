import { logger } from "../../../../core/logger/logger";
import { ChatMessage } from "../models/chat-message.model";

/**
 * AI Provider — Supports Google AI Studio (Gemini), DeepSeek, and OpenRouter.
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

    /** Fallback models for DeepSeek */
    private static DEEPSEEK_FALLBACK_MODELS = [
        "deepseek-chat",
        "deepseek-reasoner",
    ];

        static async generateResponse(
        systemPrompt: string,
        history: ChatMessage[],
        newMessage: string
    ): Promise<{ text: string; tokensUsed: number }> {
        // Separate API keys for each provider
        const deepseekKey = process.env.DEEPSEEK_API_KEY || "";
        const geminiKey = process.env.GEMINI_API_KEY || "";
        const openrouterKey = process.env.OPENROUTER_API_KEY || "";

        // Also support legacy single-key config
        const legacyKey = process.env.AI_API_KEY || "";
        const legacyUrl = process.env.AI_API_URL || "";

        // Primary provider preference (env: AI_PRIMARY_PROVIDER = deepseek | gemini | openrouter)
        const primaryProvider = (process.env.AI_PRIMARY_PROVIDER || "deepseek").toLowerCase();

        // Build ordered provider list: primary first, then others as fallback
        const providers: Array<{ name: string; call: () => Promise<{ text: string; tokensUsed: number }> }> = [];

        const deepseekModel = process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || "deepseek-chat";
        const geminiModel = process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash";
        const openrouterModel = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || "nvidia/nemotron-nano-9b-v2:free";

        // Resolve effective keys (provider-specific takes priority over legacy)
        const effectiveDeepseek = deepseekKey || (legacyUrl === "deepseek" || legacyUrl.includes("deepseek") ? legacyKey : "");
        const effectiveGemini = geminiKey || (legacyUrl === "gemini" || legacyUrl.includes("googleapis") ? legacyKey : "");
        const effectiveOpenrouter = openrouterKey || (legacyUrl.includes("openrouter") || (!legacyUrl.includes("deepseek") && !legacyUrl.includes("googleapis") && !legacyUrl.includes("gemini") && legacyKey) ? legacyKey : "");

        // Register available providers
        if (effectiveDeepseek) {
            providers.push({
                name: "deepseek",
                call: () => this.callDeepSeek(effectiveDeepseek, deepseekModel, systemPrompt, history, newMessage)
            });
        }
        if (effectiveGemini) {
            providers.push({
                name: "gemini",
                call: () => this.callGemini(effectiveGemini, geminiModel, systemPrompt, history, newMessage)
            });
        }
        if (effectiveOpenrouter) {
            providers.push({
                name: "openrouter",
                call: () => this.callOpenRouter(effectiveOpenrouter, "https://openrouter.ai/api/v1/chat/completions", openrouterModel, systemPrompt, history, newMessage)
            });
        }

        // No providers configured
        if (providers.length === 0) {
            logger.warn("No AI API keys configured. Using mock response.");
            return {
                text: "This is a mock response from MuChat. Add DEEPSEEK_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to your .env file for real responses.",
                tokensUsed: 42
            };
        }

        // Sort: primary provider first
        providers.sort((a, b) => {
            if (a.name === primaryProvider) return -1;
            if (b.name === primaryProvider) return 1;
            return 0;
        });

        logger.info(`AI providers available: [${providers.map(p => p.name).join(", ")}] (primary: ${primaryProvider})`);

        // Try each provider in order — cascade on failure
        for (const provider of providers) {
            try {
                logger.info(`Attempting provider: ${provider.name}`);
                const result = await provider.call();
                // Check if it's a fallback/error message (tokensUsed === 0 and specific text)
                if (result.tokensUsed === 0 && result.text.includes("trouble connecting")) {
                    logger.warn(`Provider ${provider.name} exhausted all models. Trying next...`);
                    continue;
                }
                return result;
            } catch (error: any) {
                logger.error(`Provider ${provider.name} failed: ${error.message}`);
                continue;
            }
        }

        // All providers failed
        logger.error("All AI providers exhausted.");
        return {
            text: "I'm having trouble connecting to all AI services right now. Please try again in a moment.",
            tokensUsed: 0
        };
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

    // ─── DeepSeek (OpenAI-compatible) ──────────────────────
    private static async callDeepSeek(
        apiKey: string,
        primaryModel: string,
        systemPrompt: string,
        history: ChatMessage[],
        newMessage: string
    ): Promise<{ text: string; tokensUsed: number }> {
        const apiUrl = "https://api.deepseek.com/chat/completions";

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: newMessage }
        ];

        const modelsToTry = [primaryModel, ...this.DEEPSEEK_FALLBACK_MODELS.filter(m => m !== primaryModel)];

        for (const model of modelsToTry) {
            for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
                try {
                    logger.info(`Calling DeepSeek: ${model} (attempt ${attempt + 1}/${this.MAX_RETRIES + 1})`);

                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({ model, messages, temperature: 0.3 })
                    });

                    if (response.status === 429) {
                        const errorBody = await response.text();
                        logger.warn(`Rate limited (429) on DeepSeek ${model}: ${errorBody.substring(0, 200)}`);
                        if (attempt < this.MAX_RETRIES) {
                            const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                        break;
                    }

                    if (!response.ok) {
                        const errorData = await response.text();
                        logger.error(`DeepSeek API Error (${response.status}) on ${model}: ${errorData.substring(0, 300)}`);
                        break;
                    }

                    const data = await response.json();
                    const textResult = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
                    const tokensUsed = data.usage?.total_tokens || 0;

                    logger.info(`DeepSeek response received from ${model} (${tokensUsed} tokens)`);
                    return { text: textResult, tokensUsed };

                } catch (error: any) {
                    logger.error(`DeepSeek Exception on ${model} (attempt ${attempt + 1}): ${error.message}`);
                    if (attempt >= this.MAX_RETRIES) break;
                    const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        logger.error("All DeepSeek models exhausted. Returning fallback message.");
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
