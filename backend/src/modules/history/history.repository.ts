import { pool } from "../../core/database/connection";

export class HistoryRepository {
    static async findByUserId(userId: string) {
        const result = await pool.request()
            .input("userId", userId)
            .query("SELECT * FROM AcademicHistory WHERE userId = @userId");
        return result.recordset;
    }
}
