const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const password = process.env.SUPABASE_DB_PASSWORD;
const ref = process.env.SUPABASE_PROJECT_REF || "oztossqudwqvckfuwity";

if (!password) {
  console.error("SUPABASE_DB_PASSWORD required");
  process.exit(1);
}

const url =
  "postgresql://postgres." +
  ref +
  ":" +
  encodeURIComponent(password) +
  "@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

const sqlPath = path.join(
  __dirname,
  "..",
  "migrations",
  "20260714140000_enable_rls.sql"
);

(async () => {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Connected. Applying RLS migration...");
  const sql = fs.readFileSync(sqlPath, "utf8");
  try {
    await client.query(sql);
    const rls = await client.query(`
      SELECT c.relname AS table, c.relrowsecurity AS rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND c.relname IN (
          'Users','Courses','PortalCredentials','AcademicHistory','Schedules',
          'ChatSessions','Admins','Events','Companies','CapstoneIdeas'
        )
      ORDER BY c.relname
    `);
    console.log("RLS status:");
    for (const row of rls.rows) {
      console.log(" ", row.table, "→", row.rls_enabled);
    }
    const policies = await client.query(`
      SELECT tablename, count(*)::int AS policies
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename
      ORDER BY tablename
    `);
    console.log("Policy counts:");
    for (const row of policies.rows) {
      console.log(" ", row.tablename, row.policies);
    }
    console.log("✅ RLS migration applied.");
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
