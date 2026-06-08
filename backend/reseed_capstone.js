const sql = require('mssql');
const { dbConfig } = require('./dist/config/database.config');

async function main() {
    try {
        console.log("Connecting with config:", dbConfig);
        await sql.connect(dbConfig);
        
        console.log("Deleting duplicate titles...");
        const result = await sql.query(`
            WITH CTE AS (
                SELECT id, title, ROW_NUMBER() OVER (PARTITION BY title, CAST(description AS NVARCHAR(1000)) ORDER BY id) AS rn
                FROM CapstoneIdeas
            )
            DELETE FROM CapstoneIdeas WHERE id IN (SELECT id FROM CTE WHERE rn > 1)
        `);
        console.log("Duplicates deleted. Rows affected:", result.rowsAffected[0]);

        const countRes = await sql.query('SELECT COUNT(*) AS count FROM CapstoneIdeas');
        console.log("Total unique CapstoneIdeas:", countRes.recordset[0].count);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

main();
