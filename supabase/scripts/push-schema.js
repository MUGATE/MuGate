const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const password = process.env.SUPABASE_DB_PASSWORD;
const ref = process.env.SUPABASE_PROJECT_REF || "oztossqudwqvckfuwity";
const region = process.env.SUPABASE_REGION;

if (!password) {
  console.error("SUPABASE_DB_PASSWORD required");
  process.exit(1);
}

const regions = region
  ? [region]
  : [
      "ap-south-1",
      "ap-southeast-1",
      "ap-southeast-2",
      "ap-northeast-1",
      "eu-central-1",
      "eu-west-1",
      "eu-west-2",
      "us-east-1",
      "us-east-2",
      "us-west-1",
      "us-west-2",
    ];

async function tryConnect(hostPrefix, r) {
  const url =
    "postgresql://postgres." +
    ref +
    ":" +
    encodeURIComponent(password) +
    "@" +
    hostPrefix +
    "-" +
    r +
    ".pooler.supabase.com:5432/postgres";
  const c = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  await c.connect();
  return { client: c, region: r, url, host: hostPrefix + "-" + r };
}

async function applySchema(client) {
  const migrationPath = path.join(
    __dirname,
    "..",
    "migrations",
    "20260714120000_mugate_schema.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");
  await client.query(sql);
}

(async () => {
  let connected = null;
  // Prefer known project host first (Mumbai / ap-south-1 on aws-1)
  const hostPrefs = process.env.SUPABASE_POOLER_HOST
    ? [process.env.SUPABASE_POOLER_HOST]
    : ["aws-1", "aws-0"];
  for (const prefix of hostPrefs) {
    for (const r of regions) {
      try {
        connected = await tryConnect(prefix, r);
        console.log("Connected via pooler:", connected.host);
        break;
      } catch (e) {
        console.log("FAIL", prefix + "-" + r, String(e.message).split("\n")[0]);
      }
    }
    if (connected) break;
  }
  if (!connected) {
    console.error("Could not connect to any region pooler.");
    process.exit(1);
  }
  try {
    console.log("Applying schema...");
    await applySchema(connected.client);
    const tables = await connected.client.query(
      "select table_name from information_schema.tables where table_schema='public' order by table_name"
    );
    console.log(
      "OK tables:",
      tables.rows.map((x) => x.table_name).join(", ")
    );
  } finally {
    await connected.client.end();
  }
})().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
