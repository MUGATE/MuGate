const sql = require('mssql');
const { dbConfig } = require('./dist/config/database.config');

async function main() {
    try {
        console.log("Connecting with config:", dbConfig);
        await sql.connect(dbConfig);
        
        console.log("Truncating CapstoneIdeas table...");
        await sql.query(`DELETE FROM CapstoneIdeas`);
        console.log("Table CapstoneIdeas cleared successfully!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

main();
