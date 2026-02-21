import sql from "mssql";
import { dbConfig } from "../../config/database.config";

const pool = new sql.ConnectionPool(dbConfig);

const poolConnect = pool.connect()
    .then(() => {
        console.log("✅ Connected to SQL Server");
        return pool;
    })
    .catch((err) => {
        console.error("❌ DB Connection Failed:");
        console.error(err);
        throw err;
    });

export { pool, poolConnect };
