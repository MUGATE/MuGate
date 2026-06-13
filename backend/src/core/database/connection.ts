import sql from "mssql";
import { dbConfig } from "../../config/database.config";

const pool = new sql.ConnectionPool(dbConfig);

const poolConnect = pool.connect()
    .then(async () => {
        console.log("✅ Connected to SQL Server");
        try {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Admins' AND xtype='U')
                CREATE TABLE Admins (
                    universityId NVARCHAR(50) PRIMARY KEY,
                    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'lastActiveAt')
                ALTER TABLE Users ADD lastActiveAt DATETIME2 NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ChatSessions') AND name = 'source')
                ALTER TABLE ChatSessions ADD source NVARCHAR(20) NOT NULL DEFAULT 'chat';
            `);
            console.log("✅ Admin migration executed successfully.");
        } catch (migrationErr: any) {
            console.error("❌ Admin migration failed:", migrationErr);
        }
        return pool;
    })
    .catch((err) => {
        console.error("❌ DB Connection Failed:");
        console.error(err);
        throw err;
    });

export { pool, poolConnect };
