import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env"), override: false });

async function main() {
    const { pool, poolConnect } = await import("../src/core/database/connection");
    await poolConnect;

    const count = await pool.request().query(`
        SELECT
            COUNT(*)::int AS cnt,
            COUNT(type)::int AS with_type,
            COUNT(room)::int AS with_room
        FROM public."CourseSections"
    `);
    console.log("Row integrity:", count.recordset[0]);

    const sample = await pool.request().query(`
        SELECT
            "sectionNumber",
            type,
            room,
            (category IS NULL) AS category_null,
            (meetings IS NULL) AS meetings_null,
            ("syncedAt" IS NULL) AS synced_null
        FROM public."CourseSections"
        LIMIT 5
    `);
    console.log("Sample (new cols null until next sync is expected):");
    console.log(sample.recordset);

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
    console.error(err?.message || err);
    process.exit(1);
});
