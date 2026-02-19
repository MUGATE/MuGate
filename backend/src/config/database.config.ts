import { env } from "./env";
import sql from "mssql";

export const dbConfig: sql.config = {
    user: env.db.user,
    password: env.db.password,
    server: env.db.server,
    database: env.db.database,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};
