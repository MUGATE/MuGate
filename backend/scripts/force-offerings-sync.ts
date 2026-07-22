/**
 * One-shot offerings sync using a stored PortalCredentials row.
 * Usage: npx tsx scripts/force-offerings-sync.ts [optionalUniversityId]
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env"), override: false });

async function main() {
    const preferredId = (process.argv[2] || process.env.SCRAPER_UNIVERSITY_ID || "").trim();
    const { pool, poolConnect } = await import("../src/core/database/connection");
    const { CoursesService } = await import("../src/modules/academic/courses/courses.service");
    const { decrypt } = await import("../src/core/security/encryption.util");

    await poolConnect;

    const credsResult = await pool.request().query(`
        SELECT pc.userId, pc.encryptedUsername, pc.encryptedPassword, u.universityId
        FROM PortalCredentials pc
        INNER JOIN Users u ON u.id = pc.userId
        ORDER BY pc.updatedAt DESC NULLS LAST
    `);
    const rows = credsResult.recordset || [];
    if (rows.length === 0) {
        throw new Error("No PortalCredentials in database — log in once via the app first.");
    }

    const ordered = preferredId
        ? [
              ...rows.filter((r: any) => String(r.universityId) === preferredId),
              ...rows.filter((r: any) => String(r.universityId) !== preferredId),
          ]
        : rows;

    let universityId = "";
    let password = "";
    let usedUni = "";
    for (const row of ordered) {
        try {
            universityId = decrypt(row.encryptedUsername);
            password = decrypt(row.encryptedPassword);
            usedUni = String(row.universityId);
            break;
        } catch {
            console.warn(`Skipping undecryptable credentials for universityId=${row.universityId}`);
        }
    }
    if (!universityId || !password) {
        throw new Error(
            "Could not decrypt any PortalCredentials with the current ENCRYPTION_SECRET. " +
                "Use the same secret as production, or log in once so credentials are re-encrypted."
        );
    }
    console.log(`Using credentials for universityId=${usedUni}`);

    const semesterHint = process.env.CURRENT_SEMESTER_ID
        ? parseInt(process.env.CURRENT_SEMESTER_ID, 10)
        : undefined;

    console.log(`Starting force offerings sync (semester hint=${semesterHint ?? "auto"})...`);
    const semesterId = await CoursesService.syncCoursesGlobal(universityId, password, semesterHint);
    console.log(`Sync complete for semester ${semesterId}`);

    const verify = await pool.request()
        .input("semester", String(semesterId))
        .query(`
            SELECT
                COUNT(*)::int AS cnt,
                COUNT(category)::int AS with_category,
                COUNT(meetings)::int AS with_meetings,
                COUNT("syncedAt")::int AS with_synced
            FROM CourseSections s
            INNER JOIN Courses c ON c.id = s.courseId
            WHERE c.semester = @semester
        `);
    console.log("Post-sync section stats:", verify.recordset[0]);

    try {
        const anyPool = pool as any;
        if (typeof anyPool.end === "function") await anyPool.end();
        else if (anyPool.pool?.end) await anyPool.pool.end();
    } catch {
        /* ignore */
    }
    process.exit(0);
}

main().catch((err) => {
    console.error("Force sync failed:", err?.message || err);
    process.exit(1);
});
