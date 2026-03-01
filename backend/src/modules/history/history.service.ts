import { HistoryRepository } from "./history.repository";
import { PortalScraper } from "../system/scraper/portal.scraper";
import { pool } from "../../core/database/connection";
import { decrypt } from "../../core/security/encryption.util";
import { logger } from "../../core/logger/logger";

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
        // TODO: Check prerequisites against completed courses
        return { eligible: true, missingPrereqs: [] };
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
        const historyData = await PortalScraper.extractHistory(universityIdString, passwordString);

        if (!historyData || historyData.length === 0) {
            logger.warn(`No history found for user ${userId}`);
            return;
        }

        // 3. UPSERT the scraped data into AcademicHistory table
        // Start a transaction for bulk upsert
        const transaction = new (require("mssql").Transaction)(pool);
        await transaction.begin();

        try {
            for (const course of historyData) {
                // Check if history record already exists
                const existing = await transaction.request()
                    .input("userId", userId)
                    .input("courseCode", course.courseCode)
                    .query("SELECT id FROM AcademicHistory WHERE userId = @userId AND courseCode = @courseCode");

                if (existing.recordset.length > 0) {
                    // Update
                    await transaction.request()
                        .input("id", existing.recordset[0].id)
                        .input("status", course.status)
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
                        .input("status", course.status)
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
    }
}
