const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { dbConfig } = require('./dist/config/database.config');

async function main() {
    try {
        const filePath = path.join(__dirname, '../frontend/src/pages/Capstone/CSC_499_Projects_All_Semesters.txt');
        const rawText = fs.readFileSync(filePath, 'utf-8');
        const lines = rawText.split('\n');
        let currentSemester = '';
        let currentTitle = '';
        let currentDesc = '';
        const parsedIdeas = [];

        for (const line of lines) {
            const semesterMatch = line.match(/──\s*(FALL|SPRING)\s*(\d{4})\s*──/i);
            if (semesterMatch) {
                currentSemester = `${semesterMatch[2]} ${semesterMatch[1]}`;
                continue;
            }

            const titleMatch = line.match(/^\s*\d+\.\s+(.+?)\s*$/);
            if (titleMatch) {
                if (currentTitle && currentDesc) {
                    parsedIdeas.push({ semester: currentSemester, title: currentTitle, description: currentDesc });
                }
                currentTitle = titleMatch[1].trim();
                currentDesc = '';
                continue;
            }

            const descMatch = line.match(/^\s{4}(.+)$/);
            if (descMatch && currentTitle) {
                currentDesc = descMatch[1].trim();
                continue;
            }
        }
        if (currentTitle && currentDesc) {
            parsedIdeas.push({ semester: currentSemester, title: currentTitle, description: currentDesc });
        }

        console.log("Parsed ideas from file:", parsedIdeas.length);

        await sql.connect(dbConfig);
        const dbRes = await sql.query('SELECT title, description FROM CapstoneIdeas');
        const dbRows = dbRes.recordset;
        console.log("Database rows:", dbRows.length);

        const parsedKeys = new Set(parsedIdeas.map(p => `${p.title.toLowerCase().trim()}::${p.description.toLowerCase().trim()}`));
        const extraRows = [];
        for (const row of dbRows) {
            const key = `${row.title.toLowerCase().trim()}::${row.description.toLowerCase().trim()}`;
            if (!parsedKeys.has(key)) {
                extraRows.push(row);
            }
        }
        console.log("Extra rows in database:", extraRows.length);
        if (extraRows.length > 0) {
            console.log("Sample extra rows (first 10):", extraRows.slice(0, 10));
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}
main();
