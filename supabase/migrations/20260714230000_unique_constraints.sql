-- Harden uniqueness constraints (TOCTOU / duplicate row protection)
-- Safe to re-run: uses IF NOT EXISTS patterns via DO blocks

-- Users.universityId must be unique (login auto-register race)
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_Users_universityId"
    ON "Users" ("universityId")
    WHERE "universityId" IS NOT NULL;

-- One academic history row per user+course
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_AcademicHistory_User_Course"
    ON "AcademicHistory" ("userId", "courseCode");

-- One partner listing per user
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_CapstonePartners_userId"
    ON "CapstonePartners" ("userId");

-- One internship review per user per company
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_InternshipReviews_User_Company"
    ON "InternshipReviews" ("userId", "companyId");
