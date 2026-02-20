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
    createdAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
    updatedAt       DATETIME2        NOT NULL DEFAULT GETDATE()
);
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
    type            NVARCHAR(10)     NOT NULL,       -- 'Lecture' or 'Lab'
    capacity        INT              NOT NULL DEFAULT 0,
    enrolled        INT              NOT NULL DEFAULT 0,

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
-- Indexes for performance
-- ============================================
CREATE INDEX IX_AcademicHistory_UserId ON AcademicHistory(userId);
CREATE INDEX IX_CourseSections_CourseId ON CourseSections(courseId);
CREATE INDEX IX_Schedules_UserId ON Schedules(userId);
CREATE INDEX IX_Sessions_UserId ON Sessions(userId);
GO

PRINT '✅ MuGate database schema created successfully!';
GO
