/**
 * Apply MuGate Postgres schema to a remote Supabase database.
 *
 * Usage (from MuGate/backend):
 *   set DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
 *   npx ts-node ../supabase/scripts/apply-schema.ts
 *
 * Or with node + pg:
 *   node --env-file=.env ../supabase/scripts/apply-schema.js
 */
const fs = require("fs");
const path = require("path");

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.error(
      "Missing DATABASE_URL. Get it from Supabase → Project Settings → Database → Connection string (URI)."
    );
    process.exit(1);
  }

  let pg;
  try {
    pg = require("pg");
  } catch {
    console.error("Install pg first: npm install pg (in MuGate/backend)");
    process.exit(1);
  }

  const migrationPath = path.join(
    __dirname,
    "..",
    "migrations",
    "20260714120000_mugate_schema.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected. Applying MuGate schema...");
  try {
    await client.query(sql);
    console.log("✅ Schema applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
