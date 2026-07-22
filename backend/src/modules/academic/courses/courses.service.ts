import { CoursesRepository } from "./courses.repository";
import { PortalScraper } from "../../system/scraper/portal.scraper";
import { pool, DbSql, usePostgres } from "../../../core/database/connection";
import { decrypt } from "../../../core/security/encryption.util";
import { logger } from "../../../core/logger/logger";
import { env } from "../../../config/env";
import { parsePortalSchedule } from "../../../core/utils/schedule-parse.util";

/** Offerings older than this are refreshed on generate / sync. */
export const OFFERINGS_CACHE_TTL_MS = 45 * 60 * 1000;

export class CoursesService {
    private static syncInFlight: Promise<number> | null = null;
    private static schemaEnsured = false;

    static async getAllCourses() {
        return CoursesRepository.findAll();
    }

    static async getCourseById(id: string) {
        return CoursesRepository.findById(id);
    }

    /** Ensure category / meetings / syncedAt columns exist (Postgres + SQL Server). */
    static async ensureSectionSchema(): Promise<void> {
        if (this.schemaEnsured) return;

        try {
            if (usePostgres) {
                await pool.request().query(
                    `ALTER TABLE "CourseSections" ADD COLUMN IF NOT EXISTS category text NULL`
                );
                await pool.request().query(
                    `ALTER TABLE "CourseSections" ADD COLUMN IF NOT EXISTS meetings text NULL`
                );
                await pool.request().query(
                    `ALTER TABLE "CourseSections" ADD COLUMN IF NOT EXISTS "syncedAt" timestamptz NULL`
                );
            } else {
                await pool.request().query(`
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CourseSections') AND name = 'category')
                        ALTER TABLE CourseSections ADD category NVARCHAR(100) NULL
                `);
                await pool.request().query(`
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CourseSections') AND name = 'meetings')
                        ALTER TABLE CourseSections ADD meetings NVARCHAR(MAX) NULL
                `);
                await pool.request().query(`
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CourseSections') AND name = 'syncedAt')
                        ALTER TABLE CourseSections ADD syncedAt DATETIME2 NULL
                `);
            }
            this.schemaEnsured = true;
        } catch (err: any) {
            logger.warn(`CourseSections schema ensure warning: ${err.message}`);
            // Still mark ensured to avoid hammering; queries tolerate null columns via try/catch elsewhere
            this.schemaEnsured = true;
        }
    }

    static async getOfferingsSyncedAt(semesterId: number): Promise<Date | null> {
        await this.ensureSectionSchema();
        try {
            const result = await pool.request()
                .input("semester", semesterId.toString())
                .query(`
                    SELECT MAX(s.syncedAt) as lastSync
                    FROM CourseSections s
                    INNER JOIN Courses c ON c.id = s.courseId
                    WHERE c.semester = @semester
                `);
            const val = result.recordset[0]?.lastSync;
            return val ? new Date(val) : null;
        } catch {
            return null;
        }
    }

    static async areOfferingsFresh(semesterId: number, ttlMs = OFFERINGS_CACHE_TTL_MS): Promise<boolean> {
        const last = await this.getOfferingsSyncedAt(semesterId);
        if (!last) return false;
        return Date.now() - last.getTime() < ttlMs;
    }

    static async syncCoursesFromPortal(userId: string, semesterId?: number): Promise<number> {
        const resolvedHint = semesterId ?? env.currentSemesterId;
        logger.info(
            `Starting course offerings sync for semester ${resolvedHint ?? "(auto-detect)"} by user ${userId}`
        );
        const credsResult = await pool.request()
            .input("userId", userId)
            .query("SELECT * FROM PortalCredentials WHERE userId = @userId");

        if (credsResult.recordset.length === 0) {
            throw new Error("Portal credentials not found. Please log in again.");
        }

        const creds = credsResult.recordset[0];
        const universityIdString = decrypt(creds.encryptedUsername);
        const passwordString = decrypt(creds.encryptedPassword);

        return await this.syncCoursesGlobal(universityIdString, passwordString, resolvedHint);
    }

    /**
     * Core syncing logic separated so the background CRON job can trigger it globally.
     * Serialized via mutex so concurrent generate/sync requests share one Playwright run.
     */
    static async syncCoursesGlobal(
        universityIdString: string,
        passwordString: string,
        semesterId?: number
    ): Promise<number> {
        if (this.syncInFlight) {
            logger.info("Course sync already in progress — waiting for in-flight sync.");
            return this.syncInFlight;
        }

        this.syncInFlight = this.runSyncCoursesGlobal(universityIdString, passwordString, semesterId)
            .finally(() => {
                this.syncInFlight = null;
            });

        return this.syncInFlight;
    }

    private static async runSyncCoursesGlobal(
        universityIdString: string,
        passwordString: string,
        semesterId?: number
    ): Promise<number> {
        await this.ensureSectionSchema();

        const { courses: coursesData, semesterId: activeSemesterId } =
            await PortalScraper.extractCourses(universityIdString, passwordString, semesterId);

        if (!coursesData || coursesData.length === 0) {
            throw new Error(
                `No courses found for semester ${activeSemesterId}. Portal scrape returned an empty offering list.`
            );
        }

        const syncedAt = new Date();
        const seenSectionKeys = new Set<string>();
        const sectionKey = (courseId: string, sectionNumber: string) =>
            `${courseId}::${String(sectionNumber).trim()}`;
        const transaction = new DbSql.Transaction(pool as any);
        await transaction.begin();

        try {
            for (const course of coursesData) {
                const roomVal = course.room ? course.room.trim() : "";
                if (
                    !roomVal ||
                    roomVal.toUpperCase() === "TBA" ||
                    roomVal.toUpperCase() === "T B A" ||
                    roomVal.toUpperCase().startsWith("A-")
                ) {
                    continue;
                }

                const existingCourse = await transaction.request()
                    .input("courseCode", course.courseCode)
                    .input("semester", activeSemesterId.toString())
                    .query("SELECT id FROM Courses WHERE courseCode = @courseCode AND semester = @semester");

                let internalCourseId: string;

                if (existingCourse.recordset.length > 0) {
                    internalCourseId = existingCourse.recordset[0].id;
                    await transaction.request()
                        .input("id", internalCourseId)
                        .input("courseName", course.courseName)
                        .input("credits", course.credits)
                        .query(`
                            UPDATE Courses 
                            SET courseName = @courseName, credits = @credits
                            WHERE id = @id
                        `);
                } else {
                    const insertCourse = await transaction.request()
                        .input("courseCode", course.courseCode)
                        .input("courseName", course.courseName)
                        .input("credits", course.credits)
                        .input("semester", activeSemesterId.toString())
                        .query(`
                            INSERT INTO Courses (courseCode, courseName, credits, semester)
                            VALUES (@courseCode, @courseName, @credits, @semester)
                            RETURNING id
                        `);
                    internalCourseId = insertCourse.recordset[0].id;
                }

                const parsed = parsePortalSchedule(course.schedule);
                const meetingsJson = JSON.stringify(parsed.meetings);
                const sectionType = course.type || "Lecture";
                const category = course.category || null;
                seenSectionKeys.add(sectionKey(String(internalCourseId), course.sectionNumber));

                const existingSection = await transaction.request()
                    .input("courseId", internalCourseId)
                    .input("sectionNumber", course.sectionNumber)
                    .query(`
                        SELECT id FROM CourseSections 
                        WHERE courseId = @courseId AND sectionNumber = @sectionNumber
                    `);

                if (existingSection.recordset.length > 0) {
                    await transaction.request()
                        .input("id", existingSection.recordset[0].id)
                        .input("instructor", course.instructor)
                        .input("day", parsed.day)
                        .input("startTime", parsed.startTime)
                        .input("endTime", parsed.endTime)
                        .input("type", sectionType)
                        .input("category", category)
                        .input("meetings", meetingsJson)
                        .input("capacity", course.capacity)
                        .input("enrolled", course.enrolled)
                        .input("room", course.room)
                        .input("syncedAt", syncedAt)
                        .query(`
                            UPDATE CourseSections 
                            SET instructor = @instructor, day = @day, startTime = @startTime, endTime = @endTime,
                                type = @type, category = @category, meetings = @meetings,
                                capacity = @capacity, enrolled = @enrolled, room = @room, syncedAt = @syncedAt
                            WHERE id = @id
                        `);
                } else {
                    await transaction.request()
                        .input("courseId", internalCourseId)
                        .input("sectionNumber", course.sectionNumber)
                        .input("instructor", course.instructor)
                        .input("day", parsed.day)
                        .input("startTime", parsed.startTime)
                        .input("endTime", parsed.endTime)
                        .input("type", sectionType)
                        .input("category", category)
                        .input("meetings", meetingsJson)
                        .input("capacity", course.capacity)
                        .input("enrolled", course.enrolled)
                        .input("room", course.room)
                        .input("syncedAt", syncedAt)
                        .query(`
                            INSERT INTO CourseSections (
                                courseId, sectionNumber, instructor, day, startTime, endTime,
                                type, category, meetings, capacity, enrolled, room, syncedAt
                            )
                            VALUES (
                                @courseId, @sectionNumber, @instructor, @day, @startTime, @endTime,
                                @type, @category, @meetings, @capacity, @enrolled, @room, @syncedAt
                            )
                        `);
                }
            }

            // Prune sections for this semester not seen in this scrape
            const existingRows = await transaction.request()
                .input("semester", activeSemesterId.toString())
                .query(`
                    SELECT s.id, s.courseId, s.sectionNumber
                    FROM CourseSections s
                    INNER JOIN Courses c ON c.id = s.courseId
                    WHERE c.semester = @semester
                `);

            let pruned = 0;
            for (const row of existingRows.recordset) {
                const key = sectionKey(String(row.courseId), row.sectionNumber);
                if (!seenSectionKeys.has(key)) {
                    await transaction.request()
                        .input("id", row.id)
                        .query("DELETE FROM ScheduleSections WHERE sectionId = @id");
                    await transaction.request()
                        .input("id", row.id)
                        .query("DELETE FROM CourseSections WHERE id = @id");
                    pruned++;
                }
            }

            await transaction.commit();
            logger.info(
                `Successfully synced ${coursesData.length} portal rows ` +
                    `(${seenSectionKeys.size} active sections, pruned ${pruned}) for semester ${activeSemesterId}`
            );
        } catch (error: any) {
            await transaction.rollback();
            logger.error(`Failed to sync courses:`, error);
            throw error;
        }

        return activeSemesterId;
    }
}
