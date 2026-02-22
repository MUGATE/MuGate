import { pool, connectDB } from "./src/core/database/connection";

async function run() {
    await connectDB();
    try {
        const res = await pool.request().query("SELECT DISTINCT semester FROM Courses");
        console.log("Semesters found in DB:");
        console.log(res.recordset);
    } catch (e: any) {
        console.error("Crash: ", e.message);
    }
    process.exit(0);
}

run();
