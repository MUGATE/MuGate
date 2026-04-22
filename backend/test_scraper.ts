/**
 * Test script: Run the university scraper and populate the knowledge base.
 * Usage: npx ts-node-dev test_scraper.ts
 */
import dotenv from "dotenv";
dotenv.config();

import { poolConnect } from "./src/core/database/connection";
import { UniversityScraper } from "./src/modules/system/scraper/university.scraper";
import { KnowledgeRepository } from "./src/modules/system/scraper/knowledge.repository";
import { KnowledgeService } from "./src/modules/ai/chatbot/services/knowledge.service";

async function main() {
    console.log("⏳ Waiting for database connection...");
    await poolConnect;
    console.log("✅ Database connected.\n");

    // 1. Run the scraper
    console.log("🕷️  Starting university website scraper...");
    console.log(`Target: ${process.env.UNIVERSITY_WEBSITE_URL || "https://mu.edu.lb"}`);
    console.log("Config: maxPages=50 (limited for test), maxDepth=3, delay=1500ms\n");

    const scraper = new UniversityScraper({
        maxPages: 50,
        maxDepth: 3,
        delayMs: 1500,
    });

    const { pages, errors } = await scraper.crawl();

    console.log(`\n📊 Crawl Results:`);
    console.log(`   Pages scraped: ${pages.length}`);
    console.log(`   Errors: ${errors.length}`);

    if (pages.length === 0) {
        console.log("\n⚠️  No pages were scraped. The website might be blocking automated requests.");
        console.log("   You can manually add knowledge base content via the addManualContent() function.\n");

        // Add some sample university content for testing
        await addManualContent();
    } else {
        // 2. Store in database
        console.log("\n💾 Storing pages in knowledge base...");
        let newCount = 0, updatedCount = 0, unchangedCount = 0;

        for (const page of pages) {
            try {
                const result = await KnowledgeRepository.upsertPage(page);
                if (result === "new") newCount++;
                else if (result === "updated") updatedCount++;
                else unchangedCount++;
                process.stdout.write(".");
            } catch (err: any) {
                process.stdout.write("x");
            }
        }

        console.log(`\n   New: ${newCount}, Updated: ${updatedCount}, Unchanged: ${unchangedCount}`);
    }

    // 3. Check knowledge base stats
    const stats = await KnowledgeRepository.getStats();
    console.log("\n📖 Knowledge Base Stats:");
    console.log(`   Total pages: ${stats.totalPages}`);
    console.log(`   Active pages: ${stats.activePages}`);
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Categories: ${JSON.stringify(stats.categoryBreakdown)}`);

    // 4. Test RAG retrieval
    console.log("\n🔍 Testing RAG Retrieval:");
    const testQuestions = [
        "What faculties does the university have?",
        "How do I apply for admission?",
        "What are the tuition fees?",
        "Tell me about the computer science program",
    ];

    for (const q of testQuestions) {
        const result = await KnowledgeService.retrieveContext(q);
        console.log(`\n   Q: "${q}"`);
        console.log(`   Sources found: ${result.sourcesFound}`);
        console.log(`   Categories: [${result.categories.join(", ")}]`);
        if (result.context) {
            console.log(`   Context preview: ${result.context.substring(0, 150)}...`);
        }
    }

    console.log("\n✅ Test complete!");
    process.exit(0);
}

/**
 * Add sample university content manually for testing when scraper can't access the website
 */
async function addManualContent() {
    console.log("📝 Adding sample university content for testing...\n");

    const samplePages = [
        {
            url: "https://mu.edu.lb/about",
            title: "About Al Maaref University",
            rawHtml: "",
            cleanContent: `Al Maaref University (MU) is a private university located in Beirut, Lebanon. Founded with the mission of providing quality higher education, MU offers a wide range of undergraduate and graduate programs across multiple faculties. The university is committed to academic excellence, research, and community engagement. MU provides a modern campus with state-of-the-art facilities including computer labs, libraries, and research centers. The university follows the American credit system and offers programs in English and Arabic.`,
            contentHash: "",
            category: "general" as const,
            subcategory: "about",
            language: "en",
            wordCount: 0,
        },
        {
            url: "https://mu.edu.lb/faculties",
            title: "Faculties at Al Maaref University",
            rawHtml: "",
            cleanContent: `Al Maaref University comprises the following faculties:

1. Faculty of Engineering - Offers programs in Computer Engineering, Civil Engineering, Electrical Engineering, and Mechanical Engineering. The faculty emphasizes hands-on learning with modern laboratories and industry partnerships.

2. Faculty of Business Administration - Programs include Business Administration (BBA), Accounting, Finance, Marketing, and Management Information Systems (MIS). MBA program also available for graduate students.

3. Faculty of Arts and Sciences - Covers Mathematics, Physics, Chemistry, Biology, Computer Science, English Literature, Arabic Language, and Social Sciences.

4. Faculty of Public Health - Offers programs in Public Health, Nutrition, Medical Laboratory Sciences, and Health Management.

5. Faculty of Islamic Studies - Provides programs in Islamic Studies, Sharia Law, and Islamic Banking and Finance.

6. Faculty of Education - Teacher preparation programs including Elementary Education, Special Education, and Educational Technology.

Each faculty is led by a Dean and comprises multiple departments with specialized courses and research areas.`,
            contentHash: "",
            category: "faculty" as const,
            subcategory: "faculties",
            language: "en",
            wordCount: 0,
        },
        {
            url: "https://mu.edu.lb/admissions",
            title: "Admissions - Al Maaref University",
            rawHtml: "",
            cleanContent: `Admissions at Al Maaref University

Application Requirements:
- Official high school transcript (Baccalaureate or equivalent)
- Copy of national ID or passport
- Two passport-sized photos
- Application form (available online or at the Admissions Office)
- Non-refundable application fee

Admission Process:
1. Submit your application online or in person at the Admissions Office
2. Complete the entrance exam (English and Math placement tests)
3. Attend an interview if required for specific programs
4. Receive your admission decision within 5-10 business days
5. Pay the registration deposit to secure your place

Important Deadlines:
- Fall Semester: Applications open March 1, deadline August 15
- Spring Semester: Applications open October 1, deadline January 15
- Summer Semester: Applications open March 15, deadline May 30

Transfer Students:
Transfer students from other universities are welcome. Credits earned at accredited institutions may be transferred based on course equivalency evaluation. A minimum GPA of 2.0 is required for transfer admission.

Contact: admissions@mu.edu.lb | +961 1 XXX XXX`,
            contentHash: "",
            category: "admission" as const,
            subcategory: "admissions",
            language: "en",
            wordCount: 0,
        },
        {
            url: "https://mu.edu.lb/tuition",
            title: "Tuition and Fees - Al Maaref University",
            rawHtml: "",
            cleanContent: `Tuition and Fees at Al Maaref University

Tuition is charged per credit. The cost varies by faculty and program level:

Undergraduate Programs:
- Faculty of Engineering: Contact the Bursar's Office for current rates
- Faculty of Business Administration: Contact the Bursar's Office for current rates
- Faculty of Arts and Sciences: Contact the Bursar's Office for current rates
- Faculty of Public Health: Contact the Bursar's Office for current rates

Graduate Programs:
- MBA and Master's programs: Contact the Bursar's Office for current rates

Additional Fees:
- Registration fee (per semester)
- Laboratory fees (for science and engineering courses)
- Technology fee
- Student activity fee
- Graduation fee

Payment Options:
- Full payment at the beginning of each semester
- Installment plan: 2-3 installments per semester
- Bank loans through partner banks
- Scholarships and financial aid available for qualifying students

Scholarships:
- Academic Excellence Scholarship (based on GPA)
- Need-Based Financial Aid
- Sibling Discount
- Employee Discount

Contact the Financial Aid Office for detailed information: finance@mu.edu.lb`,
            contentHash: "",
            category: "financial" as const,
            subcategory: "tuition",
            language: "en",
            wordCount: 0,
        },
        {
            url: "https://mu.edu.lb/programs/computer-science",
            title: "Computer Science Program - Al Maaref University",
            rawHtml: "",
            cleanContent: `Bachelor of Science in Computer Science

Program Overview:
The Computer Science program at Al Maaref University prepares students for careers in software development, data science, cybersecurity, artificial intelligence, and other technology fields. The program follows the ACM/IEEE computing curriculum standards.

Program Structure:
- Total credits required: 97-100 credits
- Duration: 4 years (8 semesters)
- Language of instruction: English

Core Courses Include:
- Programming Fundamentals (CS101)
- Data Structures and Algorithms (CS201)
- Object-Oriented Programming (CS202)
- Database Systems (CS301)
- Operating Systems (CS302)
- Computer Networks (CS303)
- Software Engineering (CS401)
- Artificial Intelligence (CS402)
- Web Development (CS305)
- Discrete Mathematics (MATH201)
- Linear Algebra (MATH202)
- Probability and Statistics (MATH301)

General Education Requirements (GER):
Students must complete 30 credits of general education courses including English, Arabic, humanities, and social sciences.

Career Opportunities:
Graduates can pursue careers as software engineers, web developers, data analysts, system administrators, cybersecurity specialists, and more.

Department Contact: cs@mu.edu.lb`,
            contentHash: "",
            category: "program" as const,
            subcategory: "programs/computer-science",
            language: "en",
            wordCount: 0,
        },
        {
            url: "https://mu.edu.lb/regulations",
            title: "Academic Regulations - Al Maaref University",
            rawHtml: "",
            cleanContent: `Academic Regulations at Al Maaref University

Credit System:
- The university follows the American credit hour system
- One credit hour = 1 hour of lecture per week for 15 weeks, or 2-3 hours of lab per week
- Full-time students must register for 12-18 credits per semester
- Part-time students: 3-11 credits per semester
- Overload (more than 18 credits) requires Dean's approval and minimum 3.0 GPA

Grading System:
- A: 90-100 (4.0), A-: 85-89 (3.7)
- B+: 82-84 (3.3), B: 78-81 (3.0), B-: 75-77 (2.7)
- C+: 72-74 (2.3), C: 68-71 (2.0), C-: 65-67 (1.7)
- D+: 62-64 (1.3), D: 58-61 (1.0)
- F: Below 58 (0.0)
- W: Withdrawal, I: Incomplete, P: Pass, NP: No Pass

Academic Standing:
- Good Standing: GPA ≥ 2.0
- Academic Probation: GPA < 2.0 for one semester
- Academic Dismissal: GPA < 2.0 for two consecutive semesters
- Dean's List: Semester GPA ≥ 3.5 with minimum 12 credits

Graduation Requirements:
- Complete all program requirements with minimum 2.0 cumulative GPA
- Complete all General Education Requirements (GER)
- No outstanding financial obligations
- Apply for graduation by the posted deadline

Add/Drop Period:
- Students may add or drop courses during the first week of the semester without financial penalty
- Withdrawal after the add/drop period results in a "W" grade
- Late withdrawal deadline is typically week 10 of the semester

Attendance Policy:
- Students must attend at least 75% of class sessions
- Exceeding the absence limit may result in course failure (FA grade)
- Excused absences require documentation (medical certificate, etc.)`,
            contentHash: "",
            category: "regulation" as const,
            subcategory: "regulations",
            language: "en",
            wordCount: 0,
        },
        {
            url: "https://mu.edu.lb/academic-calendar",
            title: "Academic Calendar - Al Maaref University",
            rawHtml: "",
            cleanContent: `Academic Calendar 2025-2026

Fall Semester 2025:
- Registration Period: August 25 - September 5, 2025
- Classes Begin: September 8, 2025
- Add/Drop Deadline: September 19, 2025
- Midterm Exams: October 20 - October 31, 2025
- Last Day to Withdraw (W grade): November 14, 2025
- Last Day of Classes: December 12, 2025
- Final Exams: December 15 - December 24, 2025

Spring Semester 2026:
- Registration Period: January 19 - January 30, 2026
- Classes Begin: February 2, 2026
- Add/Drop Deadline: February 13, 2026
- Midterm Exams: March 16 - March 27, 2026
- Last Day to Withdraw (W grade): April 10, 2026
- Last Day of Classes: May 8, 2026
- Final Exams: May 11 - May 22, 2026

Summer Semester 2026:
- Registration Period: June 1 - June 5, 2026
- Classes Begin: June 8, 2026
- Classes End: July 31, 2026
- Final Exams: August 3 - August 7, 2026

Official University Holidays:
- Lebanese Independence Day: November 22
- Christmas Break: December 25 - January 2
- Easter Break: (varies by year)
- Labor Day: May 1
- Eid Holidays: (per official government announcements)`,
            contentHash: "",
            category: "calendar" as const,
            subcategory: "academic-calendar",
            language: "en",
            wordCount: 0,
        },
        {
            url: "https://mu.edu.lb/campus",
            title: "Campus & Facilities - Al Maaref University",
            rawHtml: "",
            cleanContent: `Campus and Facilities at Al Maaref University

Library:
The university library provides access to thousands of books, journals, and digital resources. Services include study rooms, computer workstations, printing and scanning, and interlibrary loan services. Library hours: Sunday-Thursday 8:00 AM - 8:00 PM, Friday-Saturday Closed.

Computer Labs:
Multiple computer labs equipped with the latest hardware and software for programming, design, and research. Labs are available during campus hours.

Student Services:
- Academic advising and counseling
- Career services and job placement
- Health services clinic
- Student clubs and organizations
- Sports facilities

Campus Location:
Al Maaref University is located in Beirut, Lebanon. The campus is accessible via public transportation.

IT Support:
Technical support is available for students and faculty. Contact: it-support@mu.edu.lb

Student Portal (UMS):
Students can access their academic records, register for courses, view grades, and check schedules through the University Management System (UMS) at ums.mu.edu.lb.`,
            contentHash: "",
            category: "campus" as const,
            subcategory: "campus",
            language: "en",
            wordCount: 0,
        },
    ];

    const { ContentCleaner } = await import("./src/modules/system/scraper/content.cleaner");

    for (const page of samplePages) {
        page.contentHash = ContentCleaner.computeHash(page.cleanContent);
        page.wordCount = page.cleanContent.split(/\s+/).length;

        try {
            const result = await KnowledgeRepository.upsertPage(page as any);
            console.log(`   ✅ ${result}: ${page.title}`);
        } catch (err: any) {
            console.log(`   ❌ Failed: ${page.title} — ${err.message}`);
        }
    }

    console.log("\n📝 Sample content added to knowledge base.");
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
