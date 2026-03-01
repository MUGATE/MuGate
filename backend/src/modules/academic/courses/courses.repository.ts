import { pool } from "../../../core/database/connection";

export class CoursesRepository {
    static async findAll() {
        const result = await pool.request().query("SELECT * FROM Courses");
        return result.recordset;
    }

    static async findById(id: string) {
        const result = await pool.request()
            .input("id", id)
            .query("SELECT * FROM Courses WHERE id = @id");
        return result.recordset[0];
    }
}
