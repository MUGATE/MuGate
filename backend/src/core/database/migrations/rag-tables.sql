-- ============================================
-- MuGate RAG Knowledge Base - Schema Extension
-- Run this script AFTER init.sql
-- ============================================

USE MuGate;
GO

-- ============================================
-- 12. KnowledgePages - Scraped university web pages
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='KnowledgePages' AND xtype='U')
CREATE TABLE KnowledgePages (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    url             NVARCHAR(500)    NOT NULL UNIQUE,
    title           NVARCHAR(500)    NOT NULL,
    content         NVARCHAR(MAX)    NOT NULL,
    contentHash     NVARCHAR(64)     NOT NULL,       -- SHA-256 for change detection
    category        NVARCHAR(100)    NOT NULL,       -- faculty, program, course, regulation, calendar, faq, admission, announcement, general
    subcategory     NVARCHAR(200)    NULL,
    language        NVARCHAR(10)     NOT NULL DEFAULT 'en',
    wordCount       INT              NOT NULL DEFAULT 0,
    lastScrapedAt   DATETIME2        NOT NULL DEFAULT GETDATE(),
    isActive        BIT              NOT NULL DEFAULT 1,
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
    updatedAt       DATETIME2        NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================
-- 13. KnowledgeChunks - Searchable content chunks
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='KnowledgeChunks' AND xtype='U')
CREATE TABLE KnowledgeChunks (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    pageId          UNIQUEIDENTIFIER NOT NULL,
    chunkIndex      INT              NOT NULL,
    content         NVARCHAR(MAX)    NOT NULL,
    keywords        NVARCHAR(MAX)    NULL,            -- comma-separated extracted keywords
    category        NVARCHAR(100)    NOT NULL,
    title           NVARCHAR(500)    NULL,            -- inherited from parent page
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_KnowledgeChunks_Pages FOREIGN KEY (pageId) REFERENCES KnowledgePages(id) ON DELETE CASCADE
);
GO

-- ============================================
-- 14. ScraperRuns - Track scraping history
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ScraperRuns' AND xtype='U')
CREATE TABLE ScraperRuns (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    runType         NVARCHAR(50)     NOT NULL,       -- 'full', 'incremental'
    status          NVARCHAR(50)     NOT NULL,       -- 'running', 'completed', 'failed'
    baseUrl         NVARCHAR(500)    NULL,
    pagesScraped    INT              NOT NULL DEFAULT 0,
    pagesUpdated    INT              NOT NULL DEFAULT 0,
    pagesNew        INT              NOT NULL DEFAULT 0,
    pagesUnchanged  INT              NOT NULL DEFAULT 0,
    errorCount      INT              NOT NULL DEFAULT 0,
    errorDetails    NVARCHAR(MAX)    NULL,
    startedAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
    completedAt     DATETIME2        NULL
);
GO

-- ============================================
-- Indexes for RAG performance
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KnowledgePages_Category')
    CREATE INDEX IX_KnowledgePages_Category ON KnowledgePages(category);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KnowledgePages_IsActive')
    CREATE INDEX IX_KnowledgePages_IsActive ON KnowledgePages(isActive);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KnowledgeChunks_PageId')
    CREATE INDEX IX_KnowledgeChunks_PageId ON KnowledgeChunks(pageId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KnowledgeChunks_Category')
    CREATE INDEX IX_KnowledgeChunks_Category ON KnowledgeChunks(category);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ScraperRuns_Status')
    CREATE INDEX IX_ScraperRuns_Status ON ScraperRuns(status);
GO

PRINT '✅ RAG Knowledge Base tables created successfully!';
GO
