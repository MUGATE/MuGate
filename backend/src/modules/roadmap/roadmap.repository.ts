import { pool, poolConnect, usePostgres, DbSql } from "../../core/database/connection";
import { logger } from "../../core/logger/logger";

export interface RoadMapCourse {
    id?: number;
    userId?: string;
    courseCode: string;
    courseName: string;
    credits: number;
    category: string;
    year: number;
    semester: string;
}

export class RoadMapRepository {
    /**
     * Ensure the UserRoadmap table exists. Called once at startup.
     */
    static async ensureTable(): Promise<void> {
        if (usePostgres) {
            logger.info("UserRoadmap table ensured (Postgres schema).");
            return;
        }
        try {
            await poolConnect;
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserRoadmap' AND xtype='U')
                CREATE TABLE UserRoadmap (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    userId NVARCHAR(255) NOT NULL,
                    courseCode NVARCHAR(50) NOT NULL,
                    courseName NVARCHAR(255) NOT NULL,
                    credits INT NOT NULL,
                    category NVARCHAR(100) NOT NULL,
                    year INT NOT NULL,
                    semester NVARCHAR(50) NOT NULL,
                    createdAt DATETIME2 DEFAULT GETDATE()
                )
            `);
            logger.info("UserRoadmap table ensured.");
        } catch (err: any) {
            logger.error(`Failed to ensure UserRoadmap table: ${err.message}`);
        }
    }

    /**
     * Get roadmap for a specific user.
     */
    static async getUserRoadmap(userId: string): Promise<RoadMapCourse[]> {
        await poolConnect;
        const result = await pool.request()
            .input("userId", userId)
            .query(`
                SELECT id, userId, courseCode, courseName, credits, category, year, semester
                FROM UserRoadmap
                WHERE userId = @userId
            `);
        return result.recordset;
    }

    /**
     * Overwrite entire roadmap for a user.
     */
    static async saveUserRoadmap(userId: string, courses: RoadMapCourse[]): Promise<boolean> {
        await poolConnect;
        const transaction = new DbSql.Transaction(pool as any);

        try {
            await transaction.begin();
            const request = new DbSql.Request(transaction as any);

            // Delete existing
            request.input("userId", userId);
            await request.query(`DELETE FROM UserRoadmap WHERE userId = @userId`);

            // Insert new ones
            for (const course of courses) {
                const insertReq = new DbSql.Request(transaction as any);
                insertReq.input("userId", userId);
                insertReq.input("courseCode", course.courseCode);
                insertReq.input("courseName", course.courseName);
                insertReq.input("credits", course.credits);
                insertReq.input("category", course.category);
                insertReq.input("year", course.year);
                insertReq.input("semester", course.semester);

                await insertReq.query(`
                    INSERT INTO UserRoadmap (userId, courseCode, courseName, credits, category, year, semester)
                    VALUES (@userId, @courseCode, @courseName, @credits, @category, @year, @semester)
                `);
            }

            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}
