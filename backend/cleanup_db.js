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

    // Delete garbage AUB scraper fragments
    const del = await sql.query("DELETE FROM Events WHERE id IN (1015, 1016, 1017)");
    console.log('Deleted garbage rows:', del.rowsAffected[0]);

    // Verify remaining active events
    const check = await sql.query("SELECT id, title, imageUrl, scraperSource FROM Events WHERE isActive = 1 ORDER BY startDate ASC");
    console.log('\nRemaining active events (' + check.recordset.length + '):');
    for (const e of check.recordset) {
      const hasImg = e.imageUrl && e.imageUrl.length > 5 ? 'IMG' : 'NO-IMG';
      console.log('  [' + e.id + '] ' + hasImg + ' | ' + e.scraperSource + ' | ' + e.title.substring(0, 60));
    }

    await sql.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();