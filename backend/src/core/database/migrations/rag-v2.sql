-- MuGate RAG v2 — vector sync + crawl queue extensions
-- Applied programmatically on startup (no USE/GO)

-- KnowledgeChunks: vector sync tracking
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KnowledgeChunks') AND name = 'chromaSyncedAt')
    ALTER TABLE KnowledgeChunks ADD chromaSyncedAt DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KnowledgeChunks') AND name = 'embeddingModel')
    ALTER TABLE KnowledgeChunks ADD embeddingModel NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KnowledgeChunks') AND name = 'entityType')
    ALTER TABLE KnowledgeChunks ADD entityType NVARCHAR(50) NULL;

-- KnowledgePages: source domain
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KnowledgePages') AND name = 'sourceDomain')
    ALTER TABLE KnowledgePages ADD sourceDomain NVARCHAR(200) NULL;

-- ScrapeQueue for resumable crawls
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ScrapeQueue' AND xtype='U')
CREATE TABLE ScrapeQueue (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    url         NVARCHAR(500)    NOT NULL,
    priority    INT              NOT NULL DEFAULT 0,
    status      NVARCHAR(50)     NOT NULL DEFAULT 'pending',
    runId       UNIQUEIDENTIFIER NULL,
    depth       INT              NOT NULL DEFAULT 0,
    createdAt   DATETIME2        NOT NULL DEFAULT GETDATE(),
    updatedAt   DATETIME2        NOT NULL DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ScrapeQueue_Status')
    CREATE INDEX IX_ScrapeQueue_Status ON ScrapeQueue(status, priority DESC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KnowledgeChunks_ChromaSynced')
    CREATE INDEX IX_KnowledgeChunks_ChromaSynced ON KnowledgeChunks(chromaSyncedAt);
