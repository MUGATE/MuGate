import { pool } from "./src/core/database/connection";
import { CS_CURRICULUM } from "./src/modules/generator/curriculum";

async function diagnose() {
    const userId = "101230041";
    console.log(`--- Diagnosis for User: ${userId} ---`);

    // 1. Check Academic History
    const history = await pool.request()
        .input("userId", userId)
        .query("SELECT courseCode, status, category FROM AcademicHistory WHERE userId = @userId");

    console.log("\nAcademic History:");
    console.table(history.recordset);

    const passed = new Set(history.recordset.filter(r => r.status === 'Passed').map(r => r.courseCode.replace(/\s+/g, '').toUpperCase()));
    console.log("\nPassed Courses (Normalized):", Array.from(passed));

    // 2. Check Prerequisites for COE 380 and CSC 450
    const coe380 = CS_CURRICULUM.find(c => c.courseCode === "COE 380");
    const csc450 = CS_CURRICULUM.find(c => c.courseCode === "CSC 450");

    if (coe380) {
        const met = coe380.prerequisites.every(p => passed.has(p.replace(/\s+/g, '').toUpperCase()));
        console.log(`\nCOE 380 Prereqs Met: ${met} (Prereqs: ${coe380.prerequisites.join(", ")})`);
    }

    if (csc450) {
        const met = csc450.prerequisites.every(p => passed.has(p.replace(/\s+/g, '').toUpperCase()));
        console.log(`CSC 450 Prereqs Met: ${met} (Prereqs: ${csc450.prerequisites.join(", ")})`);
    }

    // 3. Check Course Offerings
    const offerings = await pool.request()
        .query("SELECT c.courseCode, c.courseName, s.sectionNumber, s.capacity, s.enrolled, s.room FROM Courses c JOIN CourseSections s ON c.id = s.courseId WHERE c.courseCode IN ('COE 380', 'CSC 450', 'COE380', 'CSC450')");

    console.log("\nCourse Offerings:");
    console.table(offerings.recordset);

    process.exit(0);
}

diagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
