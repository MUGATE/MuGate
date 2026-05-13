const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'MuGate',
    user: 'FONIX',
    password: '***REMOVED***',
    options: { encrypt: false, trustServerCertificate: true }
};

(async () => {
    try {
        await sql.connect(config);
        
        // 1. Check for Al Maaref Hackathon in the database
        const search = await sql.query`
            SELECT id, title, sourceId, scraperSource, isActive 
            FROM Events 
            WHERE title LIKE '%Al Maaref Hackathon%'
        `;
        
        if (search.recordset.length > 0) {
            console.log('Found Al Maaref Hackathon events:');
            search.recordset.forEach(r => {
                console.log(`  ID=${r.id} title="${r.title}" source=${r.scraperSource} active=${r.isActive}`);
            });
            
            // Delete them
            const del = await sql.query`
                DELETE FROM Events WHERE title LIKE '%Al Maaref Hackathon%'
            `;
            console.log(`Deleted ${del.rowsAffected[0]} Al Maaref Hackathon row(s).`);
        } else {
            console.log('No "Al Maaref Hackathon" found in database. Already clean.');
        }
        
        // 2. Show all active events with their imageUrl status
        const all = await sql.query`
            SELECT id, title, imageUrl, scraperSource
            FROM Events 
            WHERE isActive = 1
            ORDER BY startDate ASC
        `;
        
        console.log(`\nAll ${all.recordset.length} active events:`);
        all.recordset.forEach(r => {
            const hasImg = r.imageUrl && r.imageUrl.length > 5 ? 'YES' : 'NO';
            console.log(`  [${hasImg}] ID=${r.id} src=${r.scraperSource} "${r.title.substring(0, 60)}"`);
        });
        
        await sql.close();
        console.log('\nDone.');
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();