-- ============================================
-- MuGate → Supabase (PostgreSQL) schema
-- Translated from SQL Server init + RAG + runtime tables
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- SQL Server compatibility helpers (used by existing queries during cutover)
CREATE OR REPLACE FUNCTION GETDATE() RETURNS timestamptz
LANGUAGE sql STABLE AS $$ SELECT NOW(); $$;

CREATE OR REPLACE FUNCTION NEWID() RETURNS uuid
LANGUAGE sql VOLATILE AS $$ SELECT gen_random_uuid(); $$;

-- ============================================
-- 1. Users
-- ============================================
CREATE TABLE IF NOT EXISTS "Users" (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email           text NOT NULL UNIQUE,
    "passwordHash"  text NOT NULL,
    name            text NOT NULL,
    "universityId"  text NULL,
    gpa             numeric(3,2) NULL,
    "gpaUpdatedAt"  timestamptz NULL,
    "lastActiveAt"  timestamptz NULL,
    "createdAt"     timestamptz NOT NULL DEFAULT NOW(),
    "updatedAt"     timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_Users_universityId"
    ON "Users" ("universityId")
    WHERE "universityId" IS NOT NULL;

-- ============================================
-- 2. PortalCredentials
-- ============================================
CREATE TABLE IF NOT EXISTS "PortalCredentials" (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"              uuid NOT NULL UNIQUE REFERENCES "Users"(id) ON DELETE CASCADE,
    "encryptedUsername"   text NOT NULL,
    "encryptedPassword"   text NOT NULL,
    "createdAt"           timestamptz NOT NULL DEFAULT NOW(),
    "updatedAt"           timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. Courses
-- ============================================
CREATE TABLE IF NOT EXISTS "Courses" (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseCode"    text NOT NULL,
    "courseName"    text NOT NULL,
    credits         integer NOT NULL,
    department      text NULL,
    semester        text NOT NULL,
    "createdAt"     timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_Courses_Code_Semester" UNIQUE ("courseCode", semester)
);

-- ============================================
-- 4. CourseSections
-- ============================================
CREATE TABLE IF NOT EXISTS "CourseSections" (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId"        uuid NOT NULL REFERENCES "Courses"(id) ON DELETE CASCADE,
    "sectionNumber"   text NOT NULL,
    instructor        text NULL,
    day               text NOT NULL,
    "startTime"       time NOT NULL,
    "endTime"         time NOT NULL,
    type              text NOT NULL,
    category          text NULL,
    meetings          text NULL,
    capacity          integer NOT NULL DEFAULT 0,
    enrolled          integer NOT NULL DEFAULT 0,
    room              text NULL,
    "syncedAt"        timestamptz NULL
);

-- ============================================
-- 5. AcademicHistory
-- ============================================
CREATE TABLE IF NOT EXISTS "AcademicHistory" (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"        uuid NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    "courseCode"    text NOT NULL,
    "courseName"    text NOT NULL,
    grade           text NULL,
    credits         integer NOT NULL,
    semester        text NULL,
    status          text NOT NULL DEFAULT 'Passed',
    category        text NULL,
    "isElective"    boolean NOT NULL DEFAULT false,
    "updatedAt"     timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_AcademicHistory_User_Course"
    ON "AcademicHistory" ("userId", "courseCode");

-- ============================================
-- 6. Schedules
-- ============================================
CREATE TABLE IF NOT EXISTS "Schedules" (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"          uuid NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    name              text NULL,
    score             double precision NOT NULL DEFAULT 0,
    "totalCredits"    integer NOT NULL DEFAULT 0,
    "createdAt"       timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. ScheduleSections
-- ============================================
CREATE TABLE IF NOT EXISTS "ScheduleSections" (
    "scheduleId"  uuid NOT NULL REFERENCES "Schedules"(id) ON DELETE CASCADE,
    "sectionId"   uuid NOT NULL REFERENCES "CourseSections"(id),
    PRIMARY KEY ("scheduleId", "sectionId")
);

-- ============================================
-- 8. Sessions
-- ============================================
CREATE TABLE IF NOT EXISTS "Sessions" (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"    uuid NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    cookies     text NOT NULL,
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. ChatSessions
-- ============================================
CREATE TABLE IF NOT EXISTS "ChatSessions" (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"    uuid NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    title       text NULL,
    source      text NOT NULL DEFAULT 'chat',
    "isPinned"  boolean NOT NULL DEFAULT false,
    "isActive"  boolean NOT NULL DEFAULT true,
    "createdAt" timestamptz NOT NULL DEFAULT NOW(),
    "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. ChatMessages
-- ============================================
CREATE TABLE IF NOT EXISTS "ChatMessages" (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId"   uuid NOT NULL REFERENCES "ChatSessions"(id) ON DELETE CASCADE,
    role          text NOT NULL,
    content       text NOT NULL,
    "tokensUsed"  integer NOT NULL DEFAULT 0,
    "createdAt"   timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. ChatAnalytics
-- ============================================
CREATE TABLE IF NOT EXISTS "ChatAnalytics" (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "questionCategory"  text NULL,
    "isFailed"          boolean NOT NULL DEFAULT false,
    "responseTimeMs"    integer NOT NULL DEFAULT 0,
    "createdAt"         timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. Admins
-- ============================================
CREATE TABLE IF NOT EXISTS "Admins" (
    "universityId"  text PRIMARY KEY,
    "createdAt"     timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. KnowledgePages
-- ============================================
CREATE TABLE IF NOT EXISTS "KnowledgePages" (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url               text NOT NULL UNIQUE,
    title             text NOT NULL,
    content           text NOT NULL,
    "contentHash"     text NOT NULL,
    category          text NOT NULL,
    subcategory       text NULL,
    language          text NOT NULL DEFAULT 'en',
    "wordCount"       integer NOT NULL DEFAULT 0,
    "sourceDomain"    text NULL,
    "lastScrapedAt"   timestamptz NOT NULL DEFAULT NOW(),
    "isActive"        boolean NOT NULL DEFAULT true,
    "createdAt"       timestamptz NOT NULL DEFAULT NOW(),
    "updatedAt"       timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. KnowledgeChunks
-- ============================================
CREATE TABLE IF NOT EXISTS "KnowledgeChunks" (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pageId"            uuid NOT NULL REFERENCES "KnowledgePages"(id) ON DELETE CASCADE,
    "chunkIndex"        integer NOT NULL,
    content             text NOT NULL,
    keywords            text NULL,
    category            text NOT NULL,
    title               text NULL,
    "entityType"        text NULL,
    "chromaSyncedAt"    timestamptz NULL,
    "embeddingModel"    text NULL,
    "createdAt"         timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. ScraperRuns
-- ============================================
CREATE TABLE IF NOT EXISTS "ScraperRuns" (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "runType"           text NOT NULL,
    status              text NOT NULL,
    "baseUrl"           text NULL,
    "pagesScraped"      integer NOT NULL DEFAULT 0,
    "pagesUpdated"      integer NOT NULL DEFAULT 0,
    "pagesNew"          integer NOT NULL DEFAULT 0,
    "pagesUnchanged"    integer NOT NULL DEFAULT 0,
    "errorCount"        integer NOT NULL DEFAULT 0,
    "errorDetails"      text NULL,
    "startedAt"         timestamptz NOT NULL DEFAULT NOW(),
    "completedAt"       timestamptz NULL
);

-- ============================================
-- 16. ScrapeQueue
-- ============================================
CREATE TABLE IF NOT EXISTS "ScrapeQueue" (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url         text NOT NULL,
    priority    integer NOT NULL DEFAULT 0,
    status      text NOT NULL DEFAULT 'pending',
    "runId"     uuid NULL,
    depth       integer NOT NULL DEFAULT 0,
    "createdAt" timestamptz NOT NULL DEFAULT NOW(),
    "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 17. CapstonePartners
-- ============================================
CREATE TABLE IF NOT EXISTS "CapstonePartners" (
    id            serial PRIMARY KEY,
    "userId"      text NOT NULL,
    "userName"    text NOT NULL,
    email         text NOT NULL,
    phone         text NOT NULL DEFAULT '',
    major         text NOT NULL DEFAULT '',
    skills        text NOT NULL DEFAULT '',
    description   text NOT NULL DEFAULT '',
    "lookingFor"  text NOT NULL DEFAULT '',
    "createdAt"   timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_CapstonePartners_userId"
    ON "CapstonePartners" ("userId");

-- ============================================
-- 18. CapstoneIdeas
-- ============================================
CREATE TABLE IF NOT EXISTS "CapstoneIdeas" (
    id            serial PRIMARY KEY,
    title         text NOT NULL,
    description   text NOT NULL,
    faculty       text NOT NULL DEFAULT '',
    year          integer NOT NULL DEFAULT 0,
    tags          text NOT NULL DEFAULT '',
    "isActive"    boolean NOT NULL DEFAULT true,
    "createdAt"   timestamptz DEFAULT NOW()
);

-- ============================================
-- 19. Companies
-- ============================================
CREATE TABLE IF NOT EXISTS "Companies" (
    id                serial PRIMARY KEY,
    name              text NOT NULL,
    description       text NULL,
    colors            text NULL,
    scale             double precision NOT NULL DEFAULT 0.02,
    "svgString"       text NULL,
    email             text NULL,
    phone             text NULL,
    website           text NULL,
    "forceWhiteBack"  boolean NOT NULL DEFAULT false,
    "forceBlackBack"  boolean NOT NULL DEFAULT false,
    "isMetallic"      boolean NOT NULL DEFAULT false
);

-- ============================================
-- 20. InternshipReviews
-- ============================================
CREATE TABLE IF NOT EXISTS "InternshipReviews" (
    id            serial PRIMARY KEY,
    "companyId"   integer NOT NULL REFERENCES "Companies"(id),
    "userId"      text NOT NULL,
    "userName"    text NOT NULL,
    rating        integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback      text NOT NULL,
    "createdAt"   timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_InternshipReviews_User_Company"
    ON "InternshipReviews" ("userId", "companyId");

-- ============================================
-- 21. Events
-- ============================================
CREATE TABLE IF NOT EXISTS "Events" (
    id                serial PRIMARY KEY,
    title             text NOT NULL,
    description       text NOT NULL DEFAULT '',
    location          text NOT NULL DEFAULT '',
    "startDate"       timestamptz NOT NULL,
    "endDate"         timestamptz NULL,
    category          text NOT NULL DEFAULT 'other',
    tags              text NOT NULL DEFAULT '',
    "imageUrl"        text NOT NULL DEFAULT '',
    "externalUrl"     text NOT NULL DEFAULT '',
    source            text NOT NULL DEFAULT 'scraped',
    "sourceId"        text NOT NULL DEFAULT '',
    "scraperSource"   text NOT NULL DEFAULT 'other',
    organizer         text NOT NULL DEFAULT '',
    "isFree"          boolean NOT NULL DEFAULT true,
    "isActive"        boolean NOT NULL DEFAULT true,
    "createdBy"       text NOT NULL DEFAULT '',
    "createdAt"       timestamptz DEFAULT NOW(),
    "updatedAt"       timestamptz DEFAULT NOW()
);

-- ============================================
-- 22. UserRoadmap
-- ============================================
CREATE TABLE IF NOT EXISTS "UserRoadmap" (
    id              serial PRIMARY KEY,
    "userId"        text NOT NULL,
    "courseCode"    text NOT NULL,
    "courseName"    text NOT NULL,
    credits         integer NOT NULL,
    category        text NOT NULL,
    year            integer NOT NULL,
    semester        text NOT NULL,
    "createdAt"     timestamptz DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS "IX_AcademicHistory_UserId" ON "AcademicHistory"("userId");
CREATE INDEX IF NOT EXISTS "IX_CourseSections_CourseId" ON "CourseSections"("courseId");
CREATE INDEX IF NOT EXISTS "IX_Schedules_UserId" ON "Schedules"("userId");
CREATE INDEX IF NOT EXISTS "IX_Sessions_UserId" ON "Sessions"("userId");
CREATE INDEX IF NOT EXISTS "IX_ChatSessions_UserId" ON "ChatSessions"("userId");
CREATE INDEX IF NOT EXISTS "IX_ChatMessages_SessionId" ON "ChatMessages"("sessionId");
CREATE INDEX IF NOT EXISTS "IX_KnowledgePages_Category" ON "KnowledgePages"(category);
CREATE INDEX IF NOT EXISTS "IX_KnowledgePages_IsActive" ON "KnowledgePages"("isActive");
CREATE INDEX IF NOT EXISTS "IX_KnowledgeChunks_PageId" ON "KnowledgeChunks"("pageId");
CREATE INDEX IF NOT EXISTS "IX_KnowledgeChunks_Category" ON "KnowledgeChunks"(category);
CREATE INDEX IF NOT EXISTS "IX_KnowledgeChunks_ChromaSynced" ON "KnowledgeChunks"("chromaSyncedAt");
CREATE INDEX IF NOT EXISTS "IX_ScraperRuns_Status" ON "ScraperRuns"(status);
CREATE INDEX IF NOT EXISTS "IX_ScrapeQueue_Status" ON "ScrapeQueue"(status, priority DESC);
CREATE INDEX IF NOT EXISTS "IX_Events_StartDate" ON "Events"("startDate") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "IX_Events_SourceId" ON "Events"("scraperSource", "sourceId") WHERE "sourceId" <> '';
