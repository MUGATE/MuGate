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

        // 1. Delete "Al Maaref Hackathon" from events (fake event)
        const del = await sql.query`
            DELETE FROM Events WHERE title LIKE '%Al Maaref Hackathon%'
        `;
        console.log('Deleted Al Maaref Hackathon rows:', del.rowsAffected[0]);

        // 2. Show all active events and their imageUrl status
        const events = await sql.query`
            SELECT id, title, imageUrl, scraperSource
            FROM Events
            WHERE isActive = 1
            ORDER BY startDate ASC
        `;
        console.log('\nActive events:');
        for (const e of events.recordset) {
            const hasImg = e.imageUrl && e.imageUrl.length > 5 ? 'HAS IMAGE' : '** NO IMAGE **';
            console.log(`  [${e.id}] ${hasImg} | ${e.scraperSource} | ${e.title.substring(0, 60)}`);
        }

        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();