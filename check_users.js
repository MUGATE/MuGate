const sql = require('mssql');
const dbConfig = {
    user: "FONIX",
    password: "***REMOVED***",
    server: "127.0.0.1",
    database: "MuGate",
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

async function main() {
    try {
        console.log("Connecting...");
        await sql.connect(dbConfig);
        console.log("Connected. Querying Users...");
        const users = await sql.query('SELECT id, name, email, universityId FROM Users');
        console.log("Users in DB:", users.recordset);

        console.log("Querying Admins...");
        const admins = await sql.query('SELECT universityId FROM Admins');
        console.log("Admins in DB:", admins.recordset);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

main();
