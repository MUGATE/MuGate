import { chromium } from "playwright";

async function testSource(name: string, url: string, selector: string) {
    let browser;
    try {
        browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        });
        const page = await context.newPage();
        console.log(`\n=== Testing ${name}: ${url} ===`);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(4000);
        
        const title = await page.title();
        console.log(`Title: ${title}`);
        
        const items = await page.evaluate((sel) => {
            const elements = document.querySelectorAll(sel);
            return Array.from(elements).slice(0, 8).map(el => el.textContent?.trim().substring(0, 120));
        }, selector);
        
        console.log(`Found ${items.length} elements:`);
        items.forEach((item, i) => console.log(`  ${i+1}. ${item}`));
        
        await page.close();
        await context.close();
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    } finally {
        if (browser) await browser.close();
    }
}

(async () => {
    // AUB events
    await testSource("AUB Events", "https://www.aub.edu.lb/Events/Pages/default.aspx", 
        "[class*='event'] a, [class*='Event'] a, .ms-wpContentDivSpace a, h2 a, h3 a");
    
    // Lebtivity
    await testSource("Lebtivity", "https://www.lebtivity.com/events/lebanon/technology", 
        "h2, h3, .event-title, [class*='title']");
    
    // Devpost
    await testSource("Devpost Lebanon", "https://devpost.com/hackathons?search=lebanon&status=upcoming",
        ".hackathon-title, h2, h3, .challenge-title, a[href*='/hackathons/']");
    
    // Google search for tech events Lebanon
    await testSource("Google Events", "https://www.google.com/search?q=tech+events+Lebanon+2026&tbm=evt",
        "div[role='heading'], h3, [class*='event'], [jsname]");
    
    console.log("\n=== All tests done ===");
})();
