import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  encryptionSecret: process.env.ENCRYPTION_SECRET,
  db: {
    user: process.env.DB_USER || "FONIX",
    password: process.env.DB_PASSWORD || "***REMOVED***",
    server: process.env.DB_SERVER || "localhost",
    database: process.env.DB_NAME || "MuGate",
},

};
