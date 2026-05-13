const sql = require('mssql');
const cfg = {
    server: 'localhost',
    database: 'MuGate',
    user: 'FONIX',
    password: '***REMOVED***',
    options: { encrypt: false, trustServerCertificate: true }
};

async function main() {
    const pool = await sql.connect(cfg);

    // 1. Delete garbage rows
    const r1 = await pool.request().query('DELETE FROM Events WHERE id IN (1021, 1022, 1023)');
    console.log('Deleted garbage rows:', r1.rowsAffected[0]);

    // 2. Fix ID 1005 (LAU Robotics & AI Summer School) — broken image
    //    New: index 3 = photo-1461749280684-dccba630e2f6 (code screen)
    const r2 = await pool.request().query(
        "UPDATE Events SET imageUrl = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop' WHERE id = 1005"
    );
    console.log('Fixed 1005 (LAU Robotics):', r2.rowsAffected[0]);

    // 3. Fix ID 1020 (Project Lebanon) — was same as LCPC (photo-1504384308090)
    //    New: index 19 = photo-1451187580459-43490279c0fa (digital globe)
    const r3 = await pool.request().query(
        "UPDATE Events SET imageUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop' WHERE id = 1020"
    );
    console.log('Fixed 1020 (Project Lebanon):', r3.rowsAffected[0]);

    // 4. Fix ID 1003 (LAU Innovators Boot Camp) — was same as "About the Speaker"
    //    New: index 2 = photo-1517245386807-bb43f82c33c4 (workshop desk)
    const r4 = await pool.request().query(
        "UPDATE Events SET imageUrl = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop' WHERE id = 1003"
    );
    console.log('Fixed 1003 (LAU Innovators):', r4.rowsAffected[0]);

    // Verify final state
    const check = await pool.request().query(
        'SELECT id, title, imageUrl FROM Events WHERE isActive = 1 ORDER BY id'
    );
    console.log('\nFinal active events:');
    for (const e of check.recordset) {
        const img = e.imageUrl ? e.imageUrl.match(/photo-[^?]+/)?.[0] || 'HAS_IMG' : 'EMPTY';
        console.log(`  [${e.id}] ${img} | ${e.title}`);
    }

    await sql.close();
}

main().catch(err => { console.error(err.message); sql.close(); });