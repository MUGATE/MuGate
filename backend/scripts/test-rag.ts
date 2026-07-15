import { poolConnect, pool } from "../src/core/database/connection";
import { runRagMigrations } from "../src/core/database/migrations/run-migrations";
import { bootstrapRag } from "../src/modules/ai/rag/rag.bootstrap";
import { KnowledgeService } from "../src/modules/ai/chatbot/services/knowledge.service";

async function main() {
    await poolConnect;
    await runRagMigrations();

    const cols = await pool.request().query(`
        SELECT name FROM sys.columns
        WHERE object_id = OBJECT_ID('KnowledgeChunks')
          AND name IN ('chromaSyncedAt', 'entityType', 'embeddingModel')
    `);
    console.log("RAG columns:", cols.recordset.map((r: { name: string }) => r.name));

    const tables = await pool.request().query(`
        SELECT name FROM sysobjects WHERE name='ScrapeQueue' AND xtype='U'
    `);
    console.log("ScrapeQueue exists:", tables.recordset.length > 0);

    await bootstrapRag();

    const stats = await pool.request().query(`
        SELECT (SELECT COUNT(*) FROM KnowledgePages) as pages,
               (SELECT COUNT(*) FROM KnowledgeChunks) as chunks
    `);
    console.log("KB stats:", stats.recordset[0]);

    const result = await KnowledgeService.retrieveContext("Who teaches Computer Networks at MU?");
    console.log("RAG test:", {
        sourcesFound: result.sourcesFound,
        confidence: result.confidence,
        categories: result.categories,
        contextLength: result.context.length,
    });

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
