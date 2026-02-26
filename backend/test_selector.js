// Test script to verify both tables are captured with the 'tbody tr' selector
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('portal_dump.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

// OLD selector (only DataTable rows)
const oldRows = doc.querySelectorAll('tbody tr[role="row"]');
console.log(`OLD selector (tbody tr[role="row"]): ${oldRows.length} rows`);

// NEW selector (all table rows)
const newRows = doc.querySelectorAll('tbody tr');
console.log(`NEW selector (tbody tr): ${newRows.length} rows`);

// Extract from new selector
let extracted = 0;
let skipped = 0;
newRows.forEach(row => {
    const columns = row.querySelectorAll('td');
    if (columns.length >= 12) {
        const courseCode = columns[1]?.textContent?.trim();
        const courseName = columns[2]?.textContent?.trim();
        const room = columns[11]?.textContent?.trim();
        if (courseCode && courseName) {
            extracted++;
            console.log(`  ${courseCode} | ${courseName} | room=${room}`);
        }
    } else {
        skipped++;
    }
});
console.log(`\nExtracted: ${extracted}, Skipped (< 12 cols): ${skipped}`);
