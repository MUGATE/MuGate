import { env } from "../../config/env";
import { runRagMigrations } from "./migrations/run-migrations";
import { createPgPool, PgPoolFacade, PgSql } from "./pg-adapter";

export const usePostgres = env.usePostgres;

type SqlModule = typeof import("mssql");
type AnyPool = import("mssql").ConnectionPool | PgPoolFacade;

type DbSqlLike = {
    Transaction: typeof PgSql.Transaction | SqlModule["Transaction"];
    Request: typeof PgSql.Request | SqlModule["Request"];
};

/**
 * Lazy-load mssql only for local SQL Server. Production (DATABASE_URL / Supabase)
 * never requires the Windows msnodesqlv8 native driver.
 */
function createSqlServerResources(): {
    pool: import("mssql").ConnectionPool;
    DbSql: DbSqlLike;
} {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sql: SqlModule = require("mssql");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { dbConfig } = require("../../config/database.config") as {
        dbConfig: import("mssql").config;
    };
    return {
        pool: new sql.ConnectionPool(dbConfig),
        DbSql: {
            Transaction: sql.Transaction,
            Request: sql.Request,
        },
    };
}

let pool: AnyPool;
let DbSql: DbSqlLike;

if (usePostgres) {
    pool = createPgPool();
    DbSql = PgSql;
} else {
    const sqlServer = createSqlServerResources();
    pool = sqlServer.pool;
    DbSql = sqlServer.DbSql;
}

export { DbSql };

const poolConnect = pool
    .connect()
    .then(async () => {
        if (usePostgres) {
            console.log("✅ Connected to Supabase Postgres");
            return pool;
        }

        console.log("✅ Connected to SQL Server");
        try {
            await (pool as import("mssql").ConnectionPool).request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Admins' AND xtype='U')
                CREATE TABLE Admins (
                    universityId NVARCHAR(50) PRIMARY KEY,
                    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'lastActiveAt')
                ALTER TABLE Users ADD lastActiveAt DATETIME2 NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'gpa')
                ALTER TABLE Users ADD gpa DECIMAL(3,2) NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'gpaUpdatedAt')
                ALTER TABLE Users ADD gpaUpdatedAt DATETIME2 NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ChatSessions') AND name = 'source')
                ALTER TABLE ChatSessions ADD source NVARCHAR(20) NOT NULL DEFAULT 'chat';
            `);
            console.log("✅ Admin migration executed successfully.");
        } catch (migrationErr: any) {
            console.error("❌ Admin migration failed:", migrationErr);
        }

        try {
            await runRagMigrations();
            console.log("✅ RAG migrations executed successfully.");
        } catch (ragErr: any) {
            console.error("❌ RAG migration failed:", ragErr);
        }

        return pool;
    })
    .catch((err) => {
        console.error("❌ DB Connection Failed:");
        console.error(err);
        throw err;
    });

export { pool, poolConnect };
