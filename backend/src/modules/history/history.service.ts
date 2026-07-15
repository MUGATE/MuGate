import { HistoryRepository } from "./history.repository";
import { PortalScraper } from "../system/scraper/portal.scraper";
import { pool, DbSql } from "../../core/database/connection";
import { decrypt } from "../../core/security/encryption.util";
import { logger } from "../../core/logger/logger";
import { normalizeAcademicStatus } from "../../core/utils/academic-status.util";
import { CS_CURRICULUM } from "../scheduling/generator/curriculum";
import { isCompletedStatus } from "../../core/utils/academic-status.util";

export class HistoryService {
    static async getStudentHistory(userId: string) {
        return HistoryRepository.findByUserId(userId);
    }

    static async getCompletedElectives(userId: string) {
        // TODO: Filter completed courses that are electives
        const history = await HistoryRepository.findByUserId(userId);
        return history.filter((course: any) => course.isElective);
    }

    static async checkEligibility(userId: string, courseId: string) {
        const courseCode = String(courseId || "").trim().toUpperCase();
        if (!courseCode) {
            return { eligible: false, missingPrereqs: [] as string[] };
        }

        const curriculum = CS_CURRICULUM.find(
            (c) => c.courseCode.toUpperCase() === courseCode
        );

        const history = await HistoryRepository.findByUserId(userId);
        const completed = new Set(
            history
                .filter((row: any) => isCompletedStatus(row.status))
                .map((row: any) => String(row.courseCode || "").toUpperCase())
        );

        if (!curriculum) {
            // Unknown course — allow only if not already completed
            return {
                eligible: !completed.has(courseCode),
                missingPrereqs: [] as string[],
            };
        }

        const missingPrereqs = curriculum.prerequisites.filter(
            (code) => !completed.has(code.toUpperCase())
        );

        return {
            eligible: missingPrereqs.length === 0 && !completed.has(courseCode),
            missingPrereqs,
        };
    }

    static async getAcademicSummary(userId: string) {
        const result = await pool.request()
            .input("userId", userId)
            .query("SELECT gpa, gpaUpdatedAt FROM Users WHERE id = @userId");

        const row = result.recordset[0];
        return {
            gpa: row?.gpa != null ? Number(row.gpa) : null,
            gpaUpdatedAt: row?.gpaUpdatedAt ?? null,
        };
    }

    static async syncStudentHistoryFromPortal(userId: string) {
        logger.info(`Starting history sync for user ${userId}`);

        // 1. Get decrypted credentials from DB
        const credsResult = await pool.request()
            .input("userId", userId)
            .query("SELECT * FROM PortalCredentials WHERE userId = @userId");

        if (credsResult.recordset.length === 0) {
            throw new Error("Portal credentials not found. Please log in again.");
        }

        const creds = credsResult.recordset[0];
        const universityIdString = decrypt(creds.encryptedUsername);
        const passwordString = decrypt(creds.encryptedPassword);

        // 2. Run the Playwright Scraper
        const scrapeResult = await PortalScraper.extractHistory(universityIdString, passwordString);
        const historyData = scrapeResult?.courses ?? [];
        const scrapedGpa = scrapeResult?.gpa ?? null;

        if (!historyData || historyData.length === 0) {
            logger.warn(`No history found for user ${userId}`);
            // Still persist GPA if we scraped it without course rows
            if (scrapedGpa != null) {
                await this.persistGpa(userId, scrapedGpa);
            }
            return;
        }

        // 3. UPSERT the scraped data into AcademicHistory table
        // Start a transaction for bulk upsert
        const transaction = new DbSql.Transaction(pool as any);
        await transaction.begin();

        try {
            for (const course of historyData) {
                const status = normalizeAcademicStatus(course.status);
                // Check if history record already exists
                const existing = await transaction.request()
                    .input("userId", userId)
                    .input("courseCode", course.courseCode)
                    .query("SELECT id FROM AcademicHistory WHERE userId = @userId AND courseCode = @courseCode");

                if (existing.recordset.length > 0) {
                    // Update
                    await transaction.request()
                        .input("id", existing.recordset[0].id)
                        .input("status", status)
                        .input("credits", course.credits)
                        .input("category", course.category)
                        .query(`
                            UPDATE AcademicHistory 
                            SET status = @status, credits = @credits, category = @category, updatedAt = GETDATE()
                            WHERE id = @id
                        `);
                } else {
                    // Insert
                    await transaction.request()
                        .input("userId", userId)
                        .input("courseCode", course.courseCode)
                        .input("courseName", course.courseName)
                        .input("credits", course.credits)
                        .input("status", status)
                        .input("category", course.category)
                        .query(`
                            INSERT INTO AcademicHistory (userId, courseCode, courseName, credits, status, category)
                            VALUES (@userId, @courseCode, @courseName, @credits, @status, @category)
                        `);
                }
            }

            await transaction.commit();
            logger.info(`Successfully synced ${historyData.length} history records for user ${userId}`);

        } catch (error: any) {
            await transaction.rollback();
            logger.error(`Failed to sync history for user ${userId}:`, error);
            throw error;
        }

        // 4. Persist GPA when scraped (overwrite previous value, including wrong ones)
        if (scrapedGpa != null) {
            await this.persistGpa(userId, scrapedGpa);
        } else {
            logger.warn(`GPA not found on Student/index.php for user ${userId}; leaving existing value unchanged`);
        }
    }

    private static async persistGpa(userId: string, gpa: number) {
        await pool.request()
            .input("userId", userId)
            .input("gpa", gpa)
            .query(`
                UPDATE Users
                SET gpa = @gpa, gpaUpdatedAt = GETDATE(), updatedAt = GETDATE()
                WHERE id = @userId
            `);
        logger.info(`Updated GPA to ${gpa} for user ${userId}`);
    }
}
