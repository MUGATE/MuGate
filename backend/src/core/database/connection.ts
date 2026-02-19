import sql from "mssql";
import { env } from "../../config/env";

const config: sql.config = {
    user: env.db.user,
    password: env.db.password,
    server: env.db.server,
    database: env.db.database,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

poolConnect
    .then(() => console.log("✅ Connected to SQL Server"))
    .catch((err) => console.error("❌ DB Connection Failed:", err));

export default pool;
