const sql = require("mssql");
const dbConfig = {
    user: "JOUMAA", password: "***REMOVED***",
    server: "localhost", database: "MuGate",
    options: { encrypt: false, trustServerCertificate: true },
};
async function check() {
    const pool = await sql.connect(dbConfig);

    // 1. Is CSC 470 in Courses table now?
    const c470 = await pool.request().query("SELECT courseCode, courseName FROM Courses WHERE courseCode LIKE '%470%' OR courseCode LIKE '%CSC470%'");
    console.log("CSC470 in Courses table:", c470.recordset.length > 0 ? "YES" : "NO");
    c470.recordset.forEach(r => console.log("  " + r.courseCode + " | " + r.courseName));

    // 2. Total courses now
    const total = await pool.request().query("SELECT COUNT(*) as cnt FROM Courses");
    console.log("Total courses:", total.recordset[0].cnt);

    // 3. User 101240510's history - check for Transferred and CSC 320
    const user = await pool.request().input("uid", "101240510")
        .query("SELECT id FROM Users WHERE universityId = @uid");
    const userId = user.recordset[0].id;

    const history = await pool.request().input("userId", userId)
        .query("SELECT courseCode, status, category FROM AcademicHistory WHERE userId = @userId ORDER BY courseCode");
    console.log("\n=== FULL HISTORY (all statuses) ===");
    history.recordset.forEach(r => console.log("  " + r.courseCode + " | " + r.status + " | " + r.category));

    // 4. Specifically check CSC 320 and Transferred courses
    const transferred = history.recordset.filter(r => r.status === 'Transferred');
    console.log("\n=== TRANSFERRED COURSES ===");
    transferred.forEach(r => console.log("  " + r.courseCode + " | " + r.category));

    const csc320 = history.recordset.find(r => r.courseCode.replace(/\s+/g, '') === 'CSC320');
    console.log("\nCSC 320 status:", csc320 ? csc320.status : "NOT FOUND");

    await pool.close();
    process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
