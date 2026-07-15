import dotenv from "dotenv";

dotenv.config({ override: false });

function resolveDatabaseUrl(): string {
  let databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";
  // Direct db.*.supabase.co is IPv6-only; rewrite to the session pooler for IPv4 networks
  if (/@db\.[a-z0-9]+\.supabase\.co:/i.test(databaseUrl)) {
    const password =
      process.env.SUPABASE_DB_PASSWORD ||
      (databaseUrl.match(/:\/\/[^:]+:([^@]+)@/) || [])[1] ||
      "";
    const ref =
      process.env.SUPABASE_PROJECT_REF ||
      (databaseUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/i) || [])[1] ||
      "";
    if (password && ref) {
      databaseUrl = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`;
      console.log("ℹ️  Rewrote DATABASE_URL to Supabase IPv4 pooler (aws-1-ap-south-1)");
    }
  }
  return databaseUrl;
}

const WEAK_SECRET_VALUES = new Set([
  "",
  "fallback-secret",
  "default-secret-change-me",
  "change-me-jwt-secret",
  "change-me-encryption-secret",
  "supersecretkey123",
  "secret",
  "jwt-secret",
]);

function requireStrongSecret(name: string, value: string | undefined): string {
  const trimmed = (value || "").trim();
  if (!trimmed || WEAK_SECRET_VALUES.has(trimmed) || trimmed.length < 32) {
    throw new Error(
      `${name} is missing or too weak. Set a random secret of at least 32 characters in the environment (see .env.example).`
    );
  }
  return trimmed;
}

const databaseUrl = resolveDatabaseUrl();

const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const env = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: requireStrongSecret("JWT_SECRET", process.env.JWT_SECRET),
  encryptionSecret: requireStrongSecret("ENCRYPTION_SECRET", process.env.ENCRYPTION_SECRET),
  /** When set, backend connects to Supabase/Postgres instead of local SQL Server */
  databaseUrl,
  usePostgres: Boolean(databaseUrl),
  /** Comma-separated allowlist; empty = reflect request origin in development only */
  corsOrigins,
  /** Super-admin university ID (env-driven; empty disables immortal super-admin) */
  superAdminUniversityId: (process.env.SUPER_ADMIN_UNIVERSITY_ID || "").trim(),
  /**
   * Postgres TLS: set DB_SSL_REJECT_UNAUTHORIZED=true to verify CA.
   * Default false for Supabase pooler compatibility; prefer true when you pin a CA.
   */
  dbSslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
  db: {
    user: process.env.DB_USER || "FONIX",
    password: process.env.DB_PASSWORD || "",
    server: process.env.DB_SERVER || "127.0.0.1",
    database: process.env.DB_NAME || "MuGate",
  },
  supabase: {
    projectRef: process.env.SUPABASE_PROJECT_REF || "",
  },
  /** Optional override when portal auto-detection is unavailable */
  currentSemesterId: process.env.CURRENT_SEMESTER_ID
    ? parseInt(process.env.CURRENT_SEMESTER_ID, 10)
    : undefined,
};

export function isSuperAdminUniversityId(universityId: string | undefined | null): boolean {
  const id = String(universityId || "").trim();
  if (!id || !env.superAdminUniversityId) return false;
  return id === env.superAdminUniversityId;
}
