import fs from "fs";
import path from "path";
import { env } from "../../../config/env";
import { pool } from "../connection";
import { logger } from "../../logger/logger";

function stripSqlServerBatchDirectives(sql: string): string {
    return sql
        .split(/\r?\n/)
        .filter(line => !/^\s*USE\s+\w+/i.test(line))
        .join("\n")
        .replace(/\bGO\b/gi, "\n");
}

async function runSqlBatches(sql: string, label: string): Promise<void> {
    const cleaned = stripSqlServerBatchDirectives(sql);
    const batches = cleaned
        .split(";")
        .map(b => b.trim())
        .filter(b => b.length > 0 && !b.startsWith("--") && !/^PRINT\b/i.test(b));

    for (const batch of batches) {
        if (!batch.trim()) continue;
        try {
            await pool.request().query(batch);
        } catch (err: any) {
            logger.warn(`Migration batch warning (${label}): ${err.message}`);
        }
    }
}

async function runRagV2Migration(): Promise<void> {
    const statements = [
        `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KnowledgeChunks') AND name = 'chromaSyncedAt')
            ALTER TABLE KnowledgeChunks ADD chromaSyncedAt DATETIME2 NULL`,

        `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KnowledgeChunks') AND name = 'embeddingModel')
            ALTER TABLE KnowledgeChunks ADD embeddingModel NVARCHAR(100) NULL`,

        `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KnowledgeChunks') AND name = 'entityType')
            ALTER TABLE KnowledgeChunks ADD entityType NVARCHAR(50) NULL`,

        `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KnowledgePages') AND name = 'sourceDomain')
            ALTER TABLE KnowledgePages ADD sourceDomain NVARCHAR(200) NULL`,

        `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ScrapeQueue' AND xtype='U')
            CREATE TABLE ScrapeQueue (
                id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                url         NVARCHAR(500)    NOT NULL,
                priority    INT              NOT NULL DEFAULT 0,
                status      NVARCHAR(50)     NOT NULL DEFAULT 'pending',
                runId       UNIQUEIDENTIFIER NULL,
                depth       INT              NOT NULL DEFAULT 0,
                createdAt   DATETIME2        NOT NULL DEFAULT GETDATE(),
                updatedAt   DATETIME2        NOT NULL DEFAULT GETDATE()
            )`,

        `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ScrapeQueue_Status')
            CREATE INDEX IX_ScrapeQueue_Status ON ScrapeQueue(status, priority DESC)`,

        `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KnowledgeChunks_ChromaSynced')
            CREATE INDEX IX_KnowledgeChunks_ChromaSynced ON KnowledgeChunks(chromaSyncedAt)`,
    ];

    for (const stmt of statements) {
        try {
            await pool.request().query(stmt);
        } catch (err: any) {
            logger.warn(`RAG v2 migration warning: ${err.message}`);
        }
    }
}

export async function runRagMigrations(): Promise<void> {
    // Schema already applied on Supabase; skip T-SQL catalog migrations.
    if (env.usePostgres) {
        logger.info("Skipping RAG SQL Server migrations (Postgres mode).");
        return;
    }

    const migrationsDir = path.join(__dirname);
    const ragTables = path.join(migrationsDir, "rag-tables.sql");

    if (fs.existsSync(ragTables)) {
        const sql = fs.readFileSync(ragTables, "utf-8");
        await runSqlBatches(sql, "rag-tables");
        logger.info("RAG tables migration applied.");
    }

    await runRagV2Migration();
    logger.info("RAG v2 migration applied.");
}
