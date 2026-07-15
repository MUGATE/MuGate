-- ============================================
-- MuGate Database - Initial Schema
-- Run this script in SSMS or sqlcmd to create all tables
-- ============================================

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'MuGate')
BEGIN
    CREATE DATABASE MuGate;
END
GO

USE MuGate;
GO

-- ============================================
-- 1. Users - App login accounts
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email           NVARCHAR(255)    NOT NULL UNIQUE,
    passwordHash    NVARCHAR(255)    NOT NULL,
    name            NVARCHAR(255)    NOT NULL,
    universityId    NVARCHAR(50)     NULL,
    gpa             DECIMAL(3,2)     NULL,
    gpaUpdatedAt    DATETIME2        NULL,
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
    updatedAt       DATETIME2        NOT NULL DEFAULT GETDATE()
);
GO

-- Ensure GPA columns exist on older databases
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'gpa')
    ALTER TABLE Users ADD gpa DECIMAL(3,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'gpaUpdatedAt')
    ALTER TABLE Users ADD gpaUpdatedAt DATETIME2 NULL;
GO

-- ============================================
-- 2. PortalCredentials - Encrypted university portal creds
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PortalCredentials' AND xtype='U')
CREATE TABLE PortalCredentials (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId              UNIQUEIDENTIFIER NOT NULL UNIQUE,
    encryptedUsername    NVARCHAR(500)    NOT NULL,
    encryptedPassword   NVARCHAR(500)    NOT NULL,
    createdAt           DATETIME2        NOT NULL DEFAULT GETDATE(),
    updatedAt           DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_PortalCredentials_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

-- ============================================
-- 3. Courses - Scraped course offerings
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Courses' AND xtype='U')
CREATE TABLE Courses (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    courseCode       NVARCHAR(20)     NOT NULL,
    courseName       NVARCHAR(255)    NOT NULL,
    credits          INT              NOT NULL,
    department       NVARCHAR(100)    NULL,
    semester         NVARCHAR(20)     NOT NULL,
    createdAt        DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_Courses_Code_Semester UNIQUE (courseCode, semester)
);
GO

-- ============================================
-- 4. CourseSections - Lecture/lab sections per course
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CourseSections' AND xtype='U')
CREATE TABLE CourseSections (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    courseId         UNIQUEIDENTIFIER NOT NULL,
    sectionNumber   NVARCHAR(10)     NOT NULL,
    instructor      NVARCHAR(255)    NULL,
    day             NVARCHAR(20)     NOT NULL,       -- e.g. 'Sunday', 'Monday'
    startTime       TIME             NOT NULL,
    endTime         TIME             NOT NULL,
    type            NVARCHAR(50)     NOT NULL,       -- 'Lecture' or 'Laboratory'
    capacity        INT              NOT NULL DEFAULT 0,
    enrolled        INT              NOT NULL DEFAULT 0,
    room            NVARCHAR(50)     NULL,

    CONSTRAINT FK_CourseSections_Courses FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE
);
GO

-- ============================================
-- 5. AcademicHistory - Student's completed courses
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AcademicHistory' AND xtype='U')
CREATE TABLE AcademicHistory (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId          UNIQUEIDENTIFIER NOT NULL,
    courseCode       NVARCHAR(20)     NOT NULL,
    courseName       NVARCHAR(255)    NOT NULL,
    grade           NVARCHAR(5)      NULL,           -- e.g. 'A', 'B+', 'F'
    credits          INT              NOT NULL,
    semester         NVARCHAR(20)     NULL,
    status           NVARCHAR(20)     NOT NULL DEFAULT 'Passed', -- 'Passed', 'Registered', 'New'
    category         NVARCHAR(50)     NULL,           -- e.g. 'GER', 'Major'
    isElective       BIT              NOT NULL DEFAULT 0,
    updatedAt        DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_AcademicHistory_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

-- ============================================
-- 6. Schedules - Saved generated schedules
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Schedules' AND xtype='U')
CREATE TABLE Schedules (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId          UNIQUEIDENTIFIER NOT NULL,
    name            NVARCHAR(100)    NULL,
    score           FLOAT            NOT NULL DEFAULT 0,
    totalCredits    INT              NOT NULL DEFAULT 0,
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Schedules_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

-- ============================================
-- 7. ScheduleSections - Sections in a saved schedule
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ScheduleSections' AND xtype='U')
CREATE TABLE ScheduleSections (
    scheduleId      UNIQUEIDENTIFIER NOT NULL,
    sectionId       UNIQUEIDENTIFIER NOT NULL,

    CONSTRAINT PK_ScheduleSections PRIMARY KEY (scheduleId, sectionId),
    CONSTRAINT FK_ScheduleSections_Schedules FOREIGN KEY (scheduleId) REFERENCES Schedules(id) ON DELETE CASCADE,
    CONSTRAINT FK_ScheduleSections_Sections FOREIGN KEY (sectionId) REFERENCES CourseSections(id)
);
GO

-- ============================================
-- 8. Sessions - Portal session cookies
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Sessions' AND xtype='U')
CREATE TABLE Sessions (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId          UNIQUEIDENTIFIER NOT NULL,
    cookies         NVARCHAR(MAX)    NOT NULL,
    expiresAt       DATETIME2        NOT NULL,
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Sessions_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

-- ============================================
-- 9. ChatSessions - AI chatbot sessions
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatSessions' AND xtype='U')
CREATE TABLE ChatSessions (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId          UNIQUEIDENTIFIER NULL,           -- NULL if anonymous/public mode
    title           NVARCHAR(255)    NULL,
    source          NVARCHAR(20)     NOT NULL DEFAULT 'chat', -- 'chat' (MuChat) | 'resume' (Resume Enhancer) — keeps feature histories separate
    isPinned        BIT              NOT NULL DEFAULT 0,
    isActive        BIT              NOT NULL DEFAULT 1,
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
    updatedAt       DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_ChatSessions_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

-- ============================================
-- 10. ChatMessages - Messages within a session
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatMessages' AND xtype='U')
CREATE TABLE ChatMessages (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sessionId       UNIQUEIDENTIFIER NOT NULL,
    role            NVARCHAR(50)     NOT NULL,       -- 'user' or 'assistant' or 'system'
    content         NVARCHAR(MAX)    NOT NULL,
    tokensUsed      INT              NOT NULL DEFAULT 0,
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_ChatMessages_ChatSessions FOREIGN KEY (sessionId) REFERENCES ChatSessions(id) ON DELETE CASCADE
);
GO

-- ============================================
-- 11. ChatAnalytics - Anonymized stats
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatAnalytics' AND xtype='U')
CREATE TABLE ChatAnalytics (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    questionCategory NVARCHAR(255)    NULL,
    isFailed        BIT              NOT NULL DEFAULT 0,
    responseTimeMs  INT              NOT NULL DEFAULT 0,
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IX_AcademicHistory_UserId ON AcademicHistory(userId);
CREATE INDEX IX_CourseSections_CourseId ON CourseSections(courseId);
CREATE INDEX IX_Schedules_UserId ON Schedules(userId);
CREATE INDEX IX_Sessions_UserId ON Sessions(userId);
CREATE INDEX IX_ChatSessions_UserId ON ChatSessions(userId);
CREATE INDEX IX_ChatMessages_SessionId ON ChatMessages(sessionId);
GO

PRINT '✅ MuGate database schema created successfully!';
GO
