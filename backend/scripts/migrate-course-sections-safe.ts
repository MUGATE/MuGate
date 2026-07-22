/**
 * Safe, idempotent migration for CourseSections category/meetings/syncedAt.
 * - Only ADD COLUMN IF NOT EXISTS (nullable) — no drops, renames, or data rewrites
 * - Prints before/after column presence; never logs connection secrets
 *
 * Usage: npx tsx scripts/migrate-course-sections-safe.ts
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env"), override: false });

async function main() {
    const { pool, poolConnect, usePostgres } = await import("../src/core/database/connection");

    if (!usePostgres) {
        console.error("DATABASE_URL not set — refusing to run against SQL Server from this script.");
        console.error("For SQL Server, columns are added automatically on first course sync via ensureSectionSchema().");
        process.exit(1);
    }

    await poolConnect;
    console.log("Connected (Postgres). Checking CourseSections columns...");

    const before = await pool.request().query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'CourseSections'
          AND column_name IN ('category', 'meetings', 'syncedAt')
        ORDER BY column_name
    `);

    const present = new Set(
        (before.recordset || []).map((r: any) => String(r.column_name || r.column_name))
    );
    // pg returns lowercase keys unless quoted; handle both
    const names = (before.recordset || []).map((r: any) =>
        String(r.column_name ?? r.COLUMN_NAME ?? Object.values(r)[0])
    );
    console.log("Before:", names.length ? names.join(", ") : "(none of the new columns)");

    // Additive only — nullable, IF NOT EXISTS
    await pool.request().query(
        `ALTER TABLE public."CourseSections" ADD COLUMN IF NOT EXISTS category text NULL`
    );
    await pool.request().query(
        `ALTER TABLE public."CourseSections" ADD COLUMN IF NOT EXISTS meetings text NULL`
    );
    await pool.request().query(
        `ALTER TABLE public."CourseSections" ADD COLUMN IF NOT EXISTS "syncedAt" timestamptz NULL`
    );

    // Comments are harmless metadata
    await pool.request().query(`
        COMMENT ON COLUMN public."CourseSections".category IS
        'UMS offerings table heading (e.g. Technical Elective); distinct from type Lecture/Lab'
    `);
    await pool.request().query(`
        COMMENT ON COLUMN public."CourseSections".meetings IS
        'JSON array of {day,startTime,endTime} for multi-window sections'
    `);
    await pool.request().query(`
        COMMENT ON COLUMN public."CourseSections"."syncedAt" IS
        'Timestamp of last successful portal sync for this section'
    `);

    const after = await pool.request().query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'CourseSections'
          AND column_name IN ('category', 'meetings', 'syncedAt')
        ORDER BY column_name
    `);

    const rows = after.recordset || [];
    console.log("After:");
    for (const r of rows) {
        const name = r.column_name ?? r.COLUMN_NAME;
        const type = r.data_type ?? r.DATA_TYPE;
        const nullable = r.is_nullable ?? r.IS_NULLABLE;
        console.log(`  - ${name}: ${type} nullable=${nullable}`);
    }

    const required = ["category", "meetings", "syncedAt"];
    const found = new Set(rows.map((r: any) => String(r.column_name ?? r.COLUMN_NAME)));
    const missing = required.filter((c) => !found.has(c));
    if (missing.length) {
        console.error("FAILED: missing columns:", missing.join(", "));
        process.exit(1);
    }

    // Sanity: row count unchanged conceptually — just report existing rows (read-only)
    const count = await pool.request().query(`SELECT COUNT(*)::int AS cnt FROM public."CourseSections"`);
    const cnt = count.recordset[0]?.cnt ?? count.recordset[0]?.CNT;
    console.log(`OK: migration applied (idempotent). CourseSections rows untouched: ${cnt}`);

    // Avoid hanging open pool in some environments
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
    console.error("Migration failed:", err?.message || err);
    process.exit(1);
});
