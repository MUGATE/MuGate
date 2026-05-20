const sql = require('mssql');
const { dbConfig } = require('./dist/config/database.config');

async function main() {
    try {
        console.log("Connecting with config:", dbConfig);
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT COUNT(*) AS count, MIN(id) AS min_id, MAX(id) AS max_id FROM CapstoneIdeas`;
        console.log("CapstoneIdeas count results:", result.recordset[0]);
        
        // Also check some of the IDs
        const sampleResult = await sql.query`SELECT TOP 5 id, title FROM CapstoneIdeas ORDER BY id ASC`;
        console.log("First 5 projects:");
        console.log(sampleResult.recordset);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

main();
