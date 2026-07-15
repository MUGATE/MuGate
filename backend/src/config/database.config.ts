import { env } from "./env";
import type { PoolConfig } from "pg";
import type { config as SqlConfig } from "mssql";

/** SQL Server config — used only when DATABASE_URL is not set */
export const dbConfig: SqlConfig = {
    user: env.db.user,
    password: env.db.password,
    server: env.db.server,
    database: env.db.database,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

/** Postgres / Supabase pool config — used when DATABASE_URL is set */
export const pgConfig: PoolConfig = {
    connectionString: env.databaseUrl,
    ssl: env.usePostgres
        ? { rejectUnauthorized: env.dbSslRejectUnauthorized }
        : undefined,
    max: 20,
};
