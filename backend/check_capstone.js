const sql = require('mssql');
const { dbConfig } = require('./dist/config/database.config');

async function main() {
    try {
        console.log("Connecting with config:", dbConfig);
        await sql.connect(dbConfig);
        
        const countRes = await sql.query('SELECT COUNT(*) AS count FROM CapstoneIdeas');
        console.log("Total unique CapstoneIdeas:", countRes.recordset[0].count);
        
        const activeCountRes = await sql.query('SELECT COUNT(*) AS count FROM CapstoneIdeas WHERE isActive = 1');
        console.log("Active unique CapstoneIdeas:", activeCountRes.recordset[0].count);

        const dupRes = await sql.query('SELECT title, COUNT(*) AS count FROM CapstoneIdeas GROUP BY title HAVING COUNT(*) > 1');
        console.log("Duplicate Titles count:", dupRes.recordset.length);
        if (dupRes.recordset.length > 0) {
            console.log("Sample duplicates:", dupRes.recordset.slice(0, 10));
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

main();
