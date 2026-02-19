import pool from "../../core/database/connection";

export class UserRepository {
    static async findById(userId: string) {
        // TODO: Query database for user
        const result = await pool.request()
            .input("userId", userId)
            .query("SELECT * FROM Users WHERE id = @userId");
        return result.recordset[0];
    }

    static async update(userId: string, data: any) {
        // TODO: Update user in database
        return { userId, ...data };
    }
}
