import { logger } from "../../../../core/logger/logger";

/**
 * Handles image analysis using Gemini Vision API.
 * Sends image as base64 inline data to extract text/descriptions.
 */
export class ImageVisionService {

    private static VISION_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ];

    static async analyzeImage(fileName: string, mimeType: string, buffer?: Buffer, userPrompt?: string): Promise<string> {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "";

        if (!buffer) {
            return `[No image buffer provided for "${fileName}"]`;
        }

        // If no Gemini key, fall back to a descriptive placeholder
        if (!geminiKey) {
            logger.warn("No GEMINI_API_KEY for vision analysis. Returning placeholder.");
            return `[Image uploaded: ${fileName} — vision analysis unavailable without GEMINI_API_KEY]`;
        }

        const base64Data = buffer.toString("base64");
        const prompt = userPrompt
            ? `Analyze this image and respond to the user's request: "${userPrompt}". Extract any visible text (OCR) and describe what you see.`
            : "Extract all visible text from this image (OCR). If there is no text, describe what the image contains in detail.";

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: { temperature: 0.2 }
        };

        const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

        for (const model of this.VISION_MODELS) {
            try {
                const url = `${baseUrl}/${model}:generateContent?key=${geminiKey}`;
                logger.info(`Vision analysis with ${model} for "${fileName}"`);

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                if (response.status === 429) {
                    logger.warn(`Vision rate limited on ${model}, trying next...`);
                    continue;
                }

                if (!response.ok) {
                    const errText = await response.text();
                    logger.error(`Vision API error (${response.status}) on ${model}: ${errText.substring(0, 200)}`);
                    continue;
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

                if (text) {
                    logger.info(`Vision extracted ${text.length} chars from "${fileName}" using ${model}`);
                    return text;
                }

                logger.warn(`Vision returned empty text for "${fileName}" on ${model}`);
                continue;

            } catch (error: any) {
                logger.error(`Vision exception on ${model}: ${error.message}`);
                continue;
            }
        }

        logger.error(`All vision models failed for "${fileName}"`);
        return `[Image "${fileName}" could not be analyzed — all vision models failed]`;
    }
}
