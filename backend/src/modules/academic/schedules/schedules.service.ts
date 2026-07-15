import { pool, DbSql } from "../../../core/database/connection";
import { logger } from "../../../core/logger/logger";
import { v4 as uuidv4 } from "uuid";

export class SchedulesService {

    /**
     * Save a generated schedule for a user.
     * Takes the array of section IDs that make up the schedule.
     */
    static async saveSchedule(userId: string, name: string, score: number, totalCredits: number, sectionIds: string[]) {
        logger.info(`Saving schedule '${name}' for user ${userId}`);
        const transaction = new DbSql.Transaction(pool as any);
        await transaction.begin();

        try {
            const scheduleId = uuidv4();

            // 1. Insert into Schedules table
            await transaction.request()
                .input("id", scheduleId)
                .input("userId", userId)
                .input("name", name || "Draft Schedule")
                .input("score", score || 0)
                .input("totalCredits", totalCredits || 0)
                .query(`
                    INSERT INTO Schedules (id, userId, name, score, totalCredits)
                    VALUES (@id, @userId, @name, @score, @totalCredits)
                `);

            // 2. Insert all sections into ScheduleSections
            for (const sectionId of sectionIds) {
                await transaction.request()
                    .input("scheduleId", scheduleId)
                    .input("sectionId", sectionId)
                    .query(`
                        INSERT INTO ScheduleSections (scheduleId, sectionId)
                        VALUES (@scheduleId, @sectionId)
                    `);
            }

            await transaction.commit();
            logger.info(`Successfully saved schedule ${scheduleId}`);
            return { scheduleId, name, sectionIds };

        } catch (error: any) {
            await transaction.rollback();
            logger.error(`Failed to save schedule: ${error.message}`);
            throw new Error("Transaction failed while saving schedule");
        }
    }

    /**
     * Get all saved schedules for a user.
     * Returns the schedule metadata along with fully populated course/section details.
     */
    static async getSavedSchedules(userId: string) {
        logger.info(`Fetching saved schedules for user ${userId}`);

        // Fetch all schedules for this user, joining courses and sections
        const result = await pool.request()
            .input("userId", userId)
            .query(`
                SELECT 
                    sch.id as scheduleId, sch.name as scheduleName, sch.score, sch.totalCredits, sch.createdAt,
                    c.id as courseId, c.courseCode, c.courseName, c.credits, sec.type as courseType,
                    sec.id as sectionId, sec.sectionNumber, sec.instructor, sec.day, sec.startTime, sec.endTime, sec.room
                FROM Schedules sch
                INNER JOIN ScheduleSections ss ON sch.id = ss.scheduleId
                INNER JOIN CourseSections sec ON ss.sectionId = sec.id
                INNER JOIN Courses c ON sec.courseId = c.id
                WHERE sch.userId = @userId
                ORDER BY sch.createdAt DESC
            `);

        // Group the flat SQL rows back into nested Schedule objects
        const schedulesMap = new Map<string, any>();

        result.recordset.forEach(row => {
            if (!schedulesMap.has(row.scheduleId)) {
                schedulesMap.set(row.scheduleId, {
                    scheduleId: row.scheduleId,
                    name: row.scheduleName,
                    score: row.score,
                    totalCredits: row.totalCredits,
                    createdAt: row.createdAt,
                    courses: []
                });
            }

            schedulesMap.get(row.scheduleId).courses.push({
                courseId: row.courseId,
                courseCode: row.courseCode,
                courseName: row.courseName,
                credits: row.credits,
                type: row.courseType,
                section: {
                    sectionId: row.sectionId,
                    sectionNumber: row.sectionNumber,
                    instructor: row.instructor,
                    day: row.day,
                    startTime: row.startTime,
                    endTime: row.endTime,
                    room: row.room
                }
            });
        });

        return Array.from(schedulesMap.values());
    }

    /**
     * Delete a specific saved schedule.
     */
    static async deleteSchedule(userId: string, scheduleId: string) {
        logger.info(`Deleting schedule ${scheduleId} for user ${userId}`);

        const result = await pool.request()
            .input("userId", userId)
            .input("scheduleId", scheduleId)
            .query(`
                DELETE FROM Schedules 
                WHERE id = @scheduleId AND userId = @userId
            `);

        if (result.rowsAffected[0] === 0) {
            throw new Error("Schedule not found or you do not have permission to delete it.");
        }

        return true;
    }
}
