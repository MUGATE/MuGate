import pool from "../../core/database/connection";

export class ScheduleRepository {
    static async findByUserId(userId: string) {
        const result = await pool.request()
            .input("userId", userId)
            .query("SELECT * FROM Schedules WHERE userId = @userId ORDER BY createdAt DESC");
        return result.recordset;
    }

    static async create(userId: string, data: any) {
        // TODO: Insert schedule into database
        return { userId, ...data, createdAt: new Date() };
    }
}
