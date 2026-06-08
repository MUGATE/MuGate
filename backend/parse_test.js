const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/Capstone/CSC_499_Projects_All_Semesters.txt');
if (!fs.existsSync(filePath)) {
    console.error("File not found at", filePath);
    process.exit(1);
}

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

console.log("Total parsed ideas in text file:", parsedIdeas.length);

// Check case-insensitive duplicates of title + description
const seen = new Set();
const exactDuplicates = [];
const uniqueIdeas = [];

for (const idea of parsedIdeas) {
    const key = `${idea.title.toLowerCase().trim()}::${idea.description.toLowerCase().trim()}`;
    if (seen.has(key)) {
        exactDuplicates.push(idea);
    } else {
        seen.add(key);
        uniqueIdeas.push(idea);
    }
}

console.log("Exact duplicates (title + description case-insensitive):", exactDuplicates.length);
console.log("Unique ideas count (no exact duplicates):", uniqueIdeas.length);

// Let's also print unique ideas by title (case-insensitive)
const seenTitle = new Set();
const uniqueByTitle = [];
const duplicateTitlesOnly = [];
for (const idea of parsedIdeas) {
    const tKey = idea.title.toLowerCase().trim();
    if (seenTitle.has(tKey)) {
        duplicateTitlesOnly.push(idea);
    } else {
        seenTitle.add(tKey);
        uniqueByTitle.push(idea);
    }
}
console.log("Unique by title count:", uniqueByTitle.length);
console.log("Duplicate titles only count:", duplicateTitlesOnly.length);
if (duplicateTitlesOnly.length > 0) {
    console.log("Sample duplicates by title (first 5):", duplicateTitlesOnly.slice(0, 5));
}
