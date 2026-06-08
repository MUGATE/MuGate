/**
 * Test script: Run the university scraper and populate the knowledge base.
 * Usage: npx ts-node-dev test_scraper.ts
 */
import dotenv from "dotenv";
dotenv.config();

import { pool, poolConnect } from "./src/core/database/connection";
import { UniversityScraper } from "./src/modules/system/scraper/university.scraper";
import { KnowledgeRepository } from "./src/modules/system/scraper/knowledge.repository";
import { KnowledgeService } from "./src/modules/ai/chatbot/services/knowledge.service";

async function main() {
    console.log("⏳ Waiting for database connection...");
    await poolConnect;
    console.log("✅ Database connected.\n");

    // 1. Run the scraper
    console.log("🕷️  Starting university website scraper...");
    console.log(`Target: ${process.env.UNIVERSITY_WEBSITE_URL || "https://mu.edu.lb"}`);
    console.log("Config: maxPages=50 (limited for test), maxDepth=3, delay=1500ms\n");

    const scraper = new UniversityScraper({
        maxPages: 50,
        maxDepth: 3,
        delayMs: 1500,
    });

    const { pages, errors } = await scraper.crawl();

    console.log(`\n📊 Crawl Results:`);
    console.log(`   Pages scraped: ${pages.length}`);
    console.log(`   Errors: ${errors.length}`);

    if (pages.length === 0) {
        console.log("\n⚠️  No pages were scraped. The website might be blocking automated requests.");
        console.log("   Clearing existing knowledge base for fresh manual seed...");
        
        await pool.request().query("DELETE FROM KnowledgeChunks");
        await pool.request().query("DELETE FROM KnowledgePages");

        console.log("   Adding verified manual knowledge base content...\n");

        // Add some sample university content for testing
        await addManualContent();
    } else {
        // 2. Store in database
        console.log("\n💾 Storing pages in knowledge base...");
        let newCount = 0, updatedCount = 0, unchangedCount = 0;

        for (const page of pages) {
            try {
                const result = await KnowledgeRepository.upsertPage(page);
                if (result === "new") newCount++;
                else if (result === "updated") updatedCount++;
                else unchangedCount++;
                process.stdout.write(".");
            } catch (err: any) {
                process.stdout.write("x");
            }
        }

        console.log(`\n   New: ${newCount}, Updated: ${updatedCount}, Unchanged: ${unchangedCount}`);
    }

    // 3. Check knowledge base stats
    const stats = await KnowledgeRepository.getStats();
    console.log("\n📖 Knowledge Base Stats:");
    console.log(`   Total pages: ${stats.totalPages}`);
    console.log(`   Active pages: ${stats.activePages}`);
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Categories: ${JSON.stringify(stats.categoryBreakdown)}`);

    // 4. Test RAG retrieval
    console.log("\n🔍 Testing RAG Retrieval:");
    const testQuestions = [
        "What faculties does the university have?",
        "How do I apply for admission?",
        "What are the tuition fees?",
        "Tell me about the computer science program",
    ];

    for (const q of testQuestions) {
        const result = await KnowledgeService.retrieveContext(q);
        console.log(`\n   Q: "${q}"`);
        console.log(`   Sources found: ${result.sourcesFound}`);
        console.log(`   Categories: [${result.categories.join(", ")}]`);
        if (result.context) {
            console.log(`   Context preview: ${result.context.substring(0, 150)}...`);
        }
    }

    console.log("\n✅ Test complete!");
    process.exit(0);
}

/**
 * Add sample university content manually for testing when scraper can't access the website
 */
async function addManualContent() {
    console.log("📝 Adding sample university content for testing...\n");

    const { samplePages } = await import("./src/modules/system/scraper/manual_knowledge");
    const { ContentCleaner } = await import("./src/modules/system/scraper/content.cleaner");

    for (const page of samplePages) {
        const fullPage = {
            ...page,
            rawHtml: "",
            contentHash: ContentCleaner.computeHash(page.cleanContent),
            wordCount: page.cleanContent.split(/\s+/).length,
        };

        try {
            const result = await KnowledgeRepository.upsertPage(fullPage as any);
            console.log(`   ✅ ${result}: ${page.title}`);
        } catch (err: any) {
            console.log(`   ❌ Failed: ${page.title} — ${err.message}`);
        }
    }

    console.log("\n📝 Curated university content added to knowledge base.");
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});

