import { chromium } from "playwright";

(async () => {
    console.log("Launching browser...");
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

    // Navigate to chatbot page
    console.log("Navigating to chatbot...");
    await page.goto("http://localhost:5174/chatbot", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Wait for the input to be enabled (session created)
    console.log("Waiting for input to be ready...");
    await page.waitForSelector(".chatbox-input:not([disabled])", { timeout: 15000 });

    // Type a message
    console.log("Typing message...");
    await page.fill(".chatbox-input", "Hello! What is MuGate and what can you help me with?");
    await page.waitForTimeout(500);

    // Click send button
    console.log("Sending message...");
    await page.click(".send-btn");

    // Wait for typing indicator to appear (confirms message was sent)
    console.log("Waiting for typing indicator...");
    await page.waitForSelector(".typing-indicator", { timeout: 10000 });

    // Wait for typing indicator to disappear (response received)
    console.log("Waiting for AI response...");
    await page.waitForSelector(".typing-indicator", { state: "hidden", timeout: 60000 });

    // Wait for actual text in assistant message
    await page.waitForSelector(".message-bubble.assistant .message-content p", { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Take screenshot
    console.log("Taking screenshot...");
    await page.screenshot({ path: "chatbot_test_result.png", fullPage: false });
    console.log("Screenshot saved as chatbot_test_result.png");

    // Get all assistant response texts
    const responses = await page.$$eval(".message-bubble.assistant .message-content p", els => els.map(e => e.textContent));
    console.log(`\nAI Responses found: ${responses.length}`);
    responses.forEach((r, i) => console.log(`  [${i}]: ${r}`));

    await browser.close();
    console.log("\nDone!");
})();
