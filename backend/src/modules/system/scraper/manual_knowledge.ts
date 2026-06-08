import { ScrapedPage } from "./scraper.types";

export const samplePages: Omit<ScrapedPage, "contentHash" | "wordCount">[] = [
    {
        url: "https://mu.edu.lb/about",
        title: "About Al Maaref University",
        rawHtml: "",
        cleanContent: `Al Maaref University (MU) is a private, non-profit higher education institution in Lebanon, officially recognized and licensed by the Lebanese Ministry of Education and Higher Education in 2015. 
The university is committed to providing high-quality, modern, and affordable education that aligns with international standards while staying relevant to regional and global job markets.

MU has a modern campus located on Airport Avenue in the Ghobeiry area of Beirut. The university operates under the American credit hour system and offers dynamic programs of study across its six recognized faculties:
1. Faculty of Engineering
2. Faculty of Business Administration
3. Faculty of Sciences
4. Faculty of Mass Communication and Fine Arts
5. Faculty of Education
6. Faculty of Religions and Human Sciences

The university promotes academic excellence, innovative research, critical thinking, and social responsibility. Programs are taught primarily in English, with specific majors in Education and Religions taught in Arabic.`,
        category: "general",
        subcategory: "about",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/faculties/engineering",
        title: "Faculty of Engineering",
        rawHtml: "",
        cleanContent: `The Faculty of Engineering at Al Maaref University provides students with robust theoretical foundations, state-of-the-art laboratory training, and critical hands-on experience to solve real-world problems.

The faculty offers 4-year programs leading to a Bachelor of Engineering (BE) degree in the following majors:
1. Civil Engineering - Covers structural, environmental, geotechnical, water resources, and transportation engineering.
2. Computer Engineering and Technology - Focuses on computer hardware, software engineering, systems design, networking, embedded systems, and IoT.
3. Electrical and Electronics Engineering - Includes power systems, control systems, communications, signal processing, and electronics.
4. Mechanical Engineering - Focuses on thermal systems, fluid mechanics, manufacturing, robotics, automotive engineering, and HVAC.

Faculty and Instructors (Doctors):
- Dr. Hasan Ali Nasser (Computer Engineering, Computer Organization)
- Dr. Abbas Mahmoud Khater (Computer Engineering, Computer Networks)

The Engineering curricula are designed in accordance with the standards of the Accreditation Board for Engineering and Technology (ABET). Emphasis is placed on internship placement and capstone graduation projects.`,
        category: "faculty",
        subcategory: "faculties/engineering",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/faculties/business",
        title: "Faculty of Business Administration",
        rawHtml: "",
        cleanContent: `The Faculty of Business Administration at Al Maaref University prepares students for leadership roles in local and international corporate environments. It focuses on ethical decision-making, digital literacy, and modern management practices.

Undergraduate Programs (Bachelor of Science - BS):
1. BS in Accounting - Preparation for professional certification (CPA, CMA, ACCA).
2. BS in Banking and Finance - Covers investment banking, corporate finance, financial analysis, and markets.
3. BS in Marketing - Digital marketing, consumer behavior, brand management, and market research.
4. BS in Management - General business management, leadership, strategy, and operations.
5. BS in Human Resources Management - Talent acquisition, performance management, training, and employee relations.
6. BS in Economics - Applied economics, monetary systems, international trade, and public policy.
7. BS in Information Technology and Management Systems (ITMS) - Bridge between business strategy and IT infrastructure, systems analysis, and enterprise resource planning (ERP).

Faculty and Instructors (Doctors):
- Dr. Hassan Ibrahim Rkein (Accounting, Financial Accounting)
- Dr. Kassem Mohammad Masri (Marketing, Marketing Principles)
- Dr. Marwa Hussein Badran (Marketing, Marketing Principles)

The programs require 3 years of full-time study and include a mandatory corporate internship.`,
        category: "faculty",
        subcategory: "faculties/business",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/faculties/sciences",
        title: "Faculty of Sciences",
        rawHtml: "",
        cleanContent: `The Faculty of Sciences at Al Maaref University aims to build a strong scientific foundation and analytical mindset in students, equipping them for key roles in technology, research, education, and laboratories.

Dean of the Faculty of Sciences: Prof. Fouad El Haj Hassan

Undergraduate Programs (Bachelor of Science - BS):
1. BS in Computer Science - Software engineering, databases, algorithms, web/mobile development, AI, and cybersecurity. (97-100 credits)
2. BS in Mathematics - Theoretical and applied mathematics, operations research, and computational modeling.
3. BS in Applied Statistics - Data analytics, actuarial science, statistical modeling, and quantitative research.
4. BS in Biology - Cellular biology, genetics, microbiology, and biotechnology, preparing students for health careers or medical school.
5. BS in Chemistry - Analytical, organic, inorganic, and physical chemistry, with strong laboratory work.
6. BS in Physics - Classical mechanics, thermodynamics, quantum mechanics, electromagnetism, and astrophysics.

Faculty, Professors, and Doctors (Instructors):
- Prof. Fouad El Haj Hassan (Dean, Physics and Electricity & Magnetism)
- Dr. Fatima Mahmoud Abdallah (Computer Science, Theory of Computation)
- Dr. Ibrahim Adnan Sammour (Computer Science, Theory of Computation, Artificial Intelligence)
- Dr. Rayane Moussa El Sibai (Computer Science, Web Programming, Artificial Intelligence)
- Dr. ElAbed Mohamad ElSafadi (Computer Science, Software Architecture, Software Engineering)
- Dr. Abdullah Hussein Abbas (Computer Science, Algorithms, Operating Systems)
- Dr. Mubarak Sami Mohammad (Computer Science, Generative AI)
- Dr. Mariam Abbas Alakhdar (Mathematics, Linear Algebra)
- Dr. Mouhammad Osman Ghader (Mathematics, Numerical Analysis)
- Dr. Marwa Ali Ala eddine (Mathematics & Statistics, Probability and Statistics)
- Dr. Rola Samir Ali Ahmad (Mathematics & Statistics, Probability and Statistics)
- Dr. Sara Mohammad Ali Noureddine Elmoussawi (Chemistry, General Chemistry)

Language of instruction for all Faculty of Sciences majors is English.`,
        category: "faculty",
        subcategory: "faculties/sciences",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/faculties/mass-communication",
        title: "Faculty of Mass Communication and Fine Arts",
        rawHtml: "",
        cleanContent: `The Faculty of Mass Communication and Fine Arts at Al Maaref University equips students to excel in the fast-paced, digital media landscape through a combination of creative thinking, media ethics, and advanced digital tools.

Undergraduate Programs (Bachelor of Arts - BA):
1. BA in Media Studies - Modern media theory, media literacy, digital communication, and cultural analysis.
2. BA in Journalism and Digital Media - Investigative reporting, writing for print and digital platforms, multimedia journalism, and editing.
3. BA in Advertising and Public Relations - Strategic communication, campaign planning, consumer relations, and media planning.
4. BA in Radio and Television - Video production, directing, scripting, editing, audio engineering, and broadcast journalism.

Faculty and Instructors (Doctors):
- Dr. Chirinne Ahmad Zebib (Public Relations, Essentials Of Public Relations, Intro to Communication Studies)
- Dr. Malak Ali Cheaitani (Advertising & PR, Advertising And Public Relations As Social Marketing)
- Dr. Zeinab Hassan Sleem (Communication Studies)
- Dr. Hasan Said Alghoul (Photography & Cinematography)
- Dr. Hussein Jawad Kawtharani (Photography & Cinematography)
- Dr. Hadi Mohammad Mounir Chatila (Digital Applications Skills)
- Dr. Ajram Hassan Ajram (Mediated Performance Theory And Practice)
- Dr. Sara Ali Kassir (Mediated Performance Theory And Practice)
- Dr. Ayman Helmi Salem Halawi (Speech Communication)

The Faculty provides state-of-the-art facilities including a modern TV studio, radio broadcast booths, editing suites, and graphic design labs.`,
        category: "faculty",
        subcategory: "faculties/mass-communication",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/faculties/education",
        title: "Faculty of Education",
        rawHtml: "",
        cleanContent: `The Faculty of Education at Al Maaref University prepares educators and specialists dedicated to professional and pedagogical excellence, using innovative teaching methods to shape the future of learning.

Programs Offered:
1. Teaching Diploma (TD) - A post-bachelor program designed to provide graduates with the professional, practical, and pedagogical skills needed to teach in schools.
2. BA in Early Childhood Education - Prepares teachers for nursery and early primary school levels (K-3).
3. BA in Teaching Arabic Language - Specialized pedagogical training for teaching Arabic at elementary and intermediate levels.
4. BA in Teaching English Language - Training for teaching English as a second language (ESL) at primary and secondary levels.

Faculty and Instructors (Doctors):
- Dr. Dania Mahmoud Al Assadi (English, Public Speaking)

Programs highlight teaching methodologies, curriculum design, educational psychology, educational technology, and practical classroom teaching experience.`,
        category: "faculty",
        subcategory: "faculties/education",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/faculties/religions",
        title: "Faculty of Religions and Human Sciences",
        rawHtml: "",
        cleanContent: `The Faculty of Religions and Human Sciences at Al Maaref University provides an academic environment to study philosophy, theology, languages, and human civilization, promoting interfaith dialogue, comparative studies, and cultural appreciation.

Undergraduate Programs (Bachelor of Arts - BA):
1. BA in Islamic Studies; Philosophy and Theology - In-depth study of Islamic thought, philosophy, kalam, and theological schools.
2. BA in Comparative Religions - Academic study of major world religions, their histories, scriptures, and comparative theology.
3. BA in Quranic Studies and Prophetic Hadith - Analytical study of Islamic texts, hermeneutics, exegesis (tafsir), and text transmission.
4. BA in History and Comparative Civilizations - Exploration of human history, historical methods, and civilizational developments.
5. BA in Translation and Languages - Professional translation training between English, French, and Arabic.

Faculty and Instructors (Doctors):
- Dr. Ali Abdallah Krayyem (Cultural Studies, Contemporary Issues)
- Dr. Mohammad Mohsen Olleik (Cultural Studies, Contemporary Issues)
- Dr. Mohamad Ahmad Awada (History, Contemporary History of Lebanon)
- Dr. Maha Youssef khansaa (Arabic Language)
- Dr. Adam Houssam Dika (Arabic Language)
- Dr. Khadija Abdallah Shehab (Arabic Language)

Hawza Integration: The faculty maintains special academic agreements with major Lebanese Hawzas (religious seminaries), allowing Hawza students to pursue a Bachelor's degree with credit transfers and tuition reductions.`,
        category: "faculty",
        subcategory: "faculties/religions",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/programs/graduate-business",
        title: "Graduate Programs — Business",
        rawHtml: "",
        cleanContent: `Al Maaref University offers highly-sought graduate business degrees through its Faculty of Business Administration, designed for working professionals and graduates looking to advance their careers.

Master's Degrees Offered:
1. Specialized Master's in Business Administration (MBA) - Advanced tracks in Finance, Marketing, or Management.
2. Executive Master's in Business Administration (EMBA) - Tailored for executives and senior managers focusing on corporate leadership and strategy.
3. Master's in Human Resource Management and Development (HRM) - Explores organizational development, workforce planning, and talent management.
4. Master's in Information Technology Management - Strategic IT alignment, project leadership, and technology innovation.
5. Master's in Project Management - Focuses on agile/traditional PM methodologies, risk analysis, and resource scheduling.
6. Master's in Entrepreneurship, Leadership, and Management of Educational Institutions - Prepares educational leaders, school principals, and academic administrators.

Classes are scheduled in the evenings or weekends to accommodate working professionals. The programs require a Master's thesis or an applied research project.`,
        category: "program",
        subcategory: "programs/graduate-business",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/programs/graduate-media",
        title: "Graduate Programs — Media",
        rawHtml: "",
        cleanContent: `The Faculty of Mass Communication and Fine Arts at Al Maaref University offers graduate programs addressing the integration of communication, digital platforms, corporate strategy, and design.

Master's Degrees Offered:
1. Master's in Media Management and Corporate Communication - Corporate PR, brand crisis management, media leadership, and corporate social responsibility.
2. Master's in Media and Communication - Advanced studies in media theory, communication research, and mass communication systems.
3. Master's in Journalism and Digital Platforms - Digital newsrooms, multimedia storytelling, platform ethics, and data journalism.
4. Master's in Graphic Design and Web Development - Advanced studies in visual design, UX/UI design, interactive media, and front-end development.

All graduate programs combine research seminars with hands-on projects, preparing students for leadership in news outlets, digital agencies, and public relations firms.`,
        category: "program",
        subcategory: "programs/graduate-media",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/programs/computer-science",
        title: "Computer Science Program",
        rawHtml: "",
        cleanContent: `Bachelor of Science (BS) in Computer Science

The Computer Science program at Al Maaref University prepares students to build, maintain, and innovate software and systems. The curriculum matches the ACM/IEEE computing standards.

Program Structure:
- Total Credits Required: 97 - 100 credits
- Duration: 3-4 years (typically 6-8 semesters)
- Language of Instruction: English

Key Courses:
- Programming Fundamentals I & II (C++ & Java)
- Data Structures and Algorithms
- Object-Oriented Software Design
- Database Management Systems
- Software Engineering & Systems Analysis
- Web Development (HTML/CSS, JS, React/Node)
- Mobile Application Development (Android/iOS)
- Artificial Intelligence & Machine Learning
- Operating Systems & Computer Networks
- Cybersecurity Principles
- Calculus, Discrete Mathematics, Linear Algebra, and Statistics

Graduation Requirements:
Students must complete all required credits with a minimum cumulative GPA of 2.0. In their final year, they must complete an internship and a Capstone Graduation Project.`,
        category: "program",
        subcategory: "programs/computer-science",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/programs/civil-engineering",
        title: "Civil Engineering Program",
        rawHtml: "",
        cleanContent: `Bachelor of Engineering (BE) in Civil Engineering

The Civil Engineering program at Al Maaref University offers a comprehensive curriculum to prepare students for the planning, design, and construction of vital infrastructure.

Program Details:
- Degree: Bachelor of Engineering (BE)
- Duration: 4 years (8 semesters + summer internships)
- Language of Instruction: English

Key Areas of Study:
- Structural Engineering: Analysis, reinforced concrete design, steel design, earthquake engineering.
- Geotechnical Engineering: Soil mechanics, foundation design, slope stability.
- Environmental and Water Resources: Fluid mechanics, hydraulics, hydrology, water/wastewater treatment.
- Transportation Engineering: Highway design, traffic analysis, pavement design.
- Construction Management: Project planning, estimating, scheduling, contracts.

Curriculum highlights:
Students utilize modern laboratories for soil testing, fluid dynamics, and material strength, alongside software like AutoCAD, SAP2000, and GIS. Graduation requires a Capstone Design Project and a 2-month summer internship in a construction firm.`,
        category: "program",
        subcategory: "programs/civil-engineering",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/programs/computer-engineering",
        title: "Computer Engineering Program",
        rawHtml: "",
        cleanContent: `Bachelor of Engineering (BE) in Computer Engineering and Technology

This program at Al Maaref University bridges the gap between hardware engineering and software development, preparing students for careers in IoT, embedded systems, networks, and smart technologies.

Program Details:
- Degree: Bachelor of Engineering (BE)
- Duration: 4 years
- Language of Instruction: English

Key Areas of Study:
- Digital System Design: VHDL, microprocessor architecture, digital logic.
- Embedded Systems: Microcontrollers, firmware development, real-time operating systems.
- Computer Networks: Routing, network protocols, network security, wireless systems.
- Software Engineering: Object-oriented programming, software quality, databases.
- Internet of Things (IoT): Sensors, actuators, cloud integration, smart environments.
- Artificial Intelligence: Robotic control, computer vision, data pipelines.

Requirements:
Requires the completion of lab modules in digital design, microprocessors, and networking. Graduation is contingent on a final-year Capstone design project and a field internship.`,
        category: "program",
        subcategory: "programs/computer-engineering",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/programs/electrical-engineering",
        title: "Electrical Engineering Program",
        rawHtml: "",
        cleanContent: `Bachelor of Engineering (BE) in Electrical and Electronics Engineering

The Electrical Engineering program at Al Maaref University provides students with skills in electrical power generation, control systems, telecommunications, and electronics.

Program Details:
- Degree: Bachelor of Engineering (BE)
- Duration: 4 years
- Language of Instruction: English

Key Areas of Study:
- Power Systems: Power generation, transmission, distribution, renewable energy (solar, wind).
- Control Systems: Linear feedback systems, industrial control, PLC, automation.
- Communications: Analog/digital communication, antennas, fiber optics, wireless networks.
- Electronics: Analog circuits, microelectronics, power electronics.
- Signal Processing: DSP, image processing, filter design.

Laboratories:
Students perform hands-on testing in power systems, telecommunications, electronics, control systems, and machinery. A summer field internship and a Capstone project are mandatory.`,
        category: "program",
        subcategory: "programs/electrical-engineering",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/programs/mechanical-engineering",
        title: "Mechanical Engineering Program",
        rawHtml: "",
        cleanContent: `Bachelor of Engineering (BE) in Mechanical Engineering

The Mechanical Engineering program at Al Maaref University prepares students for engineering careers in thermal systems, mechanical design, robotics, energy, and automotive fields.

Program Details:
- Degree: Bachelor of Engineering (BE)
- Duration: 4 years
- Language of Instruction: English

Key Areas of Study:
- Thermal Systems: Thermodynamics, heat transfer, internal combustion engines.
- Fluid Mechanics: Aerodynamics, hydraulics, turbomachinery.
- Mechanical Design: CAD, strength of materials, kinematics, dynamics.
- HVAC Systems: Heating, ventilation, air conditioning, refrigeration design.
- Manufacturing: Machining, materials science, CNC programming.
- Robotics & Control: Mechatronics, automation, robotics.

The program includes extensive lab sessions in material testing, heat engines, mechatronics, and fluids. Students must complete a graduation capstone and a field internship.`,
        category: "program",
        subcategory: "programs/mechanical-engineering",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/admissions",
        title: "Admissions Requirements and Procedures",
        rawHtml: "",
        cleanContent: `Admissions at Al Maaref University (MU)

MU welcomes applications from local and international students. Admission is based on academic merit, placement tests, and prospective student potential.

Application Requirements:
1. Completed application form.
2. Certified copy of the official Lebanese Baccalaureate II (or equivalent foreign degree validated by the Lebanese Ministry of Education).
3. Copy of the student's national ID or passport.
4. Civil status record (for Lebanese students).
5. Two recent passport-size color photographs.
6. Non-refundable application fee.
7. Official transcripts of the last three high school years.

Admission Placement Tests:
All applicants must sit for placement tests to evaluate skill levels:
- English Placement Test (EPT) - Determines the English course level. (Applicants with TOEFL iBT >= 79 or IELTS >= 6.5 may be exempted).
- Mathematics Placement Test - Required for applicants to the Faculties of Engineering, Sciences, and Business.
- Arabic/French Tests - Required for specific language or translation tracks.

Important Admission Deadlines:
- Fall Semester: Application deadlines are in mid-August. EPTs are scheduled throughout June, July, and August.
- Spring Semester: Application deadlines are in early January. EPTs are scheduled in December and January.`,
        category: "admission",
        subcategory: "admissions",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/tuition",
        title: "Tuition Fees Structure",
        rawHtml: "",
        cleanContent: `Tuition and Fees at Al Maaref University (MU)

MU is committed to maintaining affordable tuition fees to allow students from diverse backgrounds to acquire quality education. 

Tuition Structure:
- Tuition is charged per credit hour.
- Tuition fees vary depending on the faculty (Engineering, Sciences, Business, Mass Communication, Education, Religions).
- Tuition is typically paid in a mixed currency structure (a portion in US Dollars [USD] and a portion in Lebanese Pounds [LBP]), reflecting the current economic context of Lebanon.
- Remedial courses and English intensive courses have a modified credit rate.

Payment Plans & Policies:
- Registration Deposit: A non-refundable deposit must be paid upon admission to secure a place, which is later deducted from the first semester's tuition.
- Installment Plan: Students can split their tuition into three interest-free installments per semester, according to dates set by the Comptroller's Office.
- Refund Policy: Dropping courses during the official Add/Drop period (first week of classes) incurs no financial penalty. Withdrawals after Add/Drop are non-refundable and result in a 'W' grade.

For the latest 2025-2026 tuition per-credit rates, students should contact the Bursar Office directly at billing@mu.edu.lb or visit the campus Finance Office.`,
        category: "financial",
        subcategory: "tuition",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/scholarships",
        title: "Scholarships and Financial Aid Programs",
        rawHtml: "",
        cleanContent: `Scholarships and Financial Assistance at Al Maaref University

MU offers robust scholarships and financial aid programs to ensure that financial hardship does not prevent qualified students from completing their studies.

1. Geographic Discount (20% Reduction):
Students residing in South Lebanon, the Bekaa region, or North Lebanon are eligible for a 20% discount on tuition fees (applicable to both the USD and LBP parts of the tuition) upon presenting official proof of residence.

2. Academic Merit Scholarships:
Excellence awards are given based on academic performance:
- Entrance Scholarship: Awarded to students with high scores on the Lebanese Baccalaureate exams (up to 100% tuition coverage).
- Dean's List Scholarship: Awarded to current students with a semester GPA of 3.8 or above (covers up to 30% of the subsequent semester's tuition).

3. Need-Based Financial Aid:
Students facing financial difficulty can apply for financial aid. The Financial Aid Committee reviews family income, expenses, and assets to award grants covering 15% to 50% of tuition.

4. Work/Study Program:
Students can work up to 15 hours a week on campus (in the library, computer labs, or administrative offices) to earn credit toward their tuition fees, while gaining professional skills.

5. Sibling & Family Discounts:
When two or more siblings are enrolled concurrently at MU, a discount is applied:
- 10% discount for the second sibling.
- 15% discount for the third sibling.

6. Hawza Cooperation Program:
Under religious seminary agreements, Hawza students enrolled in Islamic Studies or Religions programs can receive special credit transfers and substantial tuition reductions.`,
        category: "financial",
        subcategory: "scholarships",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/regulations",
        title: "Academic Regulations and Grading Policies",
        rawHtml: "",
        cleanContent: `Academic Regulations at Al Maaref University

The university operates under the American credit-hour semester system. The following guidelines represent the core academic rules:

Semester Course Load:
- Full-time Undergraduate: 12 to 18 credits per semester.
- Maximum Overload: Up to 21 credits, requiring a cumulative GPA >= 3.2 and Dean's approval.
- Part-time Student: Less than 12 credits.

Grading System (4.0 GPA Scale):
- A (4.0): 90-100 (Outstanding)
- B (3.0): 80-84 (Good)
- C (2.0): 70-74 (Satisfactory)
- D (1.0): 60-64 (Poor / Passing)
- F (0.0): Below 60 (Failure)
- W: Official Withdrawal (no GPA penalty)
- I: Incomplete (coursework must be completed within 4 weeks of the next semester)
- FA: Failure due to non-attendance (absence exceeding 25%)

Academic Standing & Good Standing:
- Good Academic Standing: Students must maintain a cumulative GPA (CGPA) of at least 2.0.
- Academic Probation: If a student's CGPA drops below 2.0, they are placed on academic probation. They are restricted to a maximum of 12 credits.
- Academic Dismissal: Students who remain on probation for two consecutive semesters without restoring their CGPA to 2.0 may face academic dismissal.

Attendance Policy:
Students are expected to attend all lectures and laboratory sessions. If a student's unexcused absences exceed 25% of the total class hours, the instructor is authorized to issue an FA (Failure due to Attendance) grade.`,
        category: "regulation",
        subcategory: "regulations",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/calendar",
        title: "Academic Calendar — Semesters & Deadlines",
        rawHtml: "",
        cleanContent: `Academic Calendar Framework at Al Maaref University

The academic year consists of two main semesters (Fall and Spring) and an optional Summer session.

Typical Fall Semester Timeline (October - February):
- Registration & Advising: Late September
- First Day of Classes: Mid-October
- Add/Drop Period: First week of classes
- Midterm Exams: Late November / Early December
- Last Day to Withdraw ('W' grade): Mid-January
- Last Day of Classes: Early February
- Final Exams: Mid-February

Typical Spring Semester Timeline (March - July):
- Registration & Advising: Late February
- First Day of Classes: Early March
- Add/Drop Period: First week of classes
- Midterm Exams: Mid-April
- Last Day to Withdraw ('W' grade): Early June
- Last Day of Classes: Late June
- Final Exams: Early July

Typical Summer Session Timeline (July - September):
- Registration: Mid-July
- Classes Begin: Late July (Intensive 6-7 weeks)
- Final Exams: Early September

Official University Holidays:
The university closes on official Lebanese public holidays, including Independence Day, Christmas, New Year, Easter, Labor Day, Ashura, and Eid holidays. Specific holiday dates are aligned with government announcements.`,
        category: "calendar",
        subcategory: "calendar",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/campus",
        title: "Campus Location and Facilities",
        rawHtml: "",
        cleanContent: `Al Maaref University Campus and Student Facilities

MU operates a modern, well-equipped campus in Beirut, designed to support academic excellence and student well-being.

Location and Address:
- Address: Airport Avenue, Ghobeiry, Beirut, Lebanon.
- The campus is located near the Airport Bridge, making it highly accessible via public transport. It is approximately 15 minutes from downtown Beirut and 5 minutes from Beirut-Rafic Hariri International Airport.

Facilities:
- Main Library: Houses thousands of printed volumes, journals, and provides access to major online scientific databases, research papers, and digital archives. It offers quiet study areas and group-work rooms.
- Computer Laboratories: Equipped with high-speed computers, programming IDEs, simulation tools (MATLAB, LabVIEW), and design software.
- Science & Engineering Labs: Includes chemistry labs, physics labs, biology labs, and specialized civil, electrical, mechanical, and computer engineering prototyping labs.
- Multimedia TV Studio & Radio Booths: A fully equipped media center for students of Mass Communication, allowing hands-on practice in filming, directing, editing, and radio broadcasting.
- Cafeteria: Offers a wide variety of hot meals, snacks, and beverages for students, faculty, and staff throughout the day.
- Campus Clinic: Providing basic healthcare services, first-aid, and health consultations.`,
        category: "campus",
        subcategory: "campus",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/student-life",
        title: "Student Life, Clubs and Campus Activities",
        rawHtml: "",
        cleanContent: `Student Life and Co-Curricular Activities at Al Maaref University

At MU, student life extends beyond classroom walls. Co-curricular activities are key to building leadership skills, collaboration, and fostering a strong sense of community.

Student Lounge:
A dedicated social space for students to relax, study, and socialize. It features comfortable seating, television screens, board games, and gaming consoles (PlayStation).

Student Clubs:
Clubs are student-run and supervised by the Office of Student Affairs. Popular clubs include:
- Computer Science & Tech Club
- Business & Entrepreneurship Club
- Media & Photography Club
- Engineering Society
- Sports Club (Futsal, Basketball, Table Tennis)
- Cultural & Debate Club
- Social Service & Volunteer Club

Annual Events & Festivals:
MU hosts a series of events throughout the year:
- Welcome Day: Welcoming new students in the Fall.
- Global Village / Cultural Day: Showcasing cultural diversity through food, traditional dress, and music.
- Sports Tournaments: Inter-faculty futsal, basketball, and table tennis championships.
- Job Fair: An annual event connecting graduating students with top local and regional employers.
- Scientific Exhibitions: Displaying capstone projects and research work.`,
        category: "campus",
        subcategory: "student-life",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/contact",
        title: "Contact Information and Channels",
        rawHtml: "",
        cleanContent: `Contact Al Maaref University

For inquiries, information, or to visit the campus, students and parents can use the following channels:

Main Address:
Al Maaref University
Airport Avenue, Ghobeiry
Beirut, Lebanon

Telephone Contacts:
- Main Switchboard: +961 1 820 930
- Alternative Line: +961 1 850 062
- Admissions Office Direct: Extension 110 or 112
- Student Affairs Office: Extension 125
- Financial Aid / Registrar: Extension 105

Email Inquiries:
- General Inquiries: info@mu.edu.lb
- Admissions: admissions@mu.edu.lb
- Financial Aid: finance@mu.edu.lb
- IT Support / Portal help: support@mu.edu.lb
- billing Office: billing@mu.edu.lb

Opening Hours:
- Monday to Friday: 8:00 AM - 4:00 PM
- Saturday and Sunday: Closed

Social Media Accounts:
Official updates are posted on the university's official channels on Facebook, Instagram, LinkedIn, and YouTube (Al Maaref University / @AlMaarefUniversity).`,
        category: "general",
        subcategory: "contact",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/student-portal",
        title: "Student Portal and University Management System (UMS)",
        rawHtml: "",
        cleanContent: `Student Portal — UMS (University Management System)

The University Management System (UMS) is the official student portal of Al Maaref University, accessible at ums.mu.edu.lb. It serves as the primary digital platform for students to manage their academic journey.

UMS Features:
1. Online Course Registration: During advising weeks, students can select their courses, select sections, check schedule conflicts, and register.
2. Academic Records: View semester GPA, cumulative GPA (CGPA), grades, passed courses, and remaining degree requirements (degree audits).
3. Schedule Viewer: Access current semester weekly schedules, midterm schedules, and final examination schedules.
4. Financial Balance: Check billing history, outstanding balance, installment schedules, and scholarship application status.
5. Advisor Communication: Contact academic advisors for course selection approvals.

Portal Sync & Troubleshooting:
- Logging in requires the student's University ID (e.g., 202410230) and password.
- If a student forgets their password, they can trigger an automated recovery email or contact IT Support at support@mu.edu.lb.
- The MuGate portal integrates with UMS to fetch academic records and build customized schedules.`,
        category: "campus",
        subcategory: "student-portal",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/transfer-students",
        title: "Transfer Student Admissions Policy",
        rawHtml: "",
        cleanContent: `Transfer Student Admissions at Al Maaref University

MU welcomes applications from students transferring from other accredited universities. The transfer process evaluates previously completed credits to avoid repetition.

Transfer Requirements:
1. All standard admission documents (Baccalaureate, copy of ID, photos).
2. Certified official transcripts from the university of origin.
3. Detailed course descriptions and syllabi of courses completed at the previous university.
4. Minimum Cumulative GPA of 2.0 (out of 4.0) at the previous institution.

Credit Transfer Policy:
- Equivalency: Credits are transferred if the course matches the MU equivalent course in content, credit hours, and level by at least 80%.
- Minimum Grade: Courses are only eligible for transfer if the student earned a grade of 'C' (2.0) or higher.
- Residency Requirement: Transfer students must complete at least 50% of their major's total credits at Al Maaref University to graduate. In addition, the Capstone Project and final-year internships must be completed at MU.
- Transferred credits are recorded as 'P' (Pass) and do not count toward the student's cumulative GPA at MU.`,
        category: "admission",
        subcategory: "transfer-students",
        language: "en"
    },
    {
        url: "https://mu.edu.lb/faq",
        title: "Frequently Asked Questions (FAQ)",
        rawHtml: "",
        cleanContent: `Al Maaref University FAQ — Frequently Asked Questions

Q: Is Al Maaref University accredited?
A: Yes, MU is fully licensed and accredited by the Ministry of Education and Higher Education in Lebanon (Decree issued in 2015). All degrees are recognized locally and internationally.

Q: What is the language of instruction?
A: English is the primary language of instruction for Engineering, Sciences, Business Administration, and Mass Communication. Specific courses or majors in the Faculty of Education and the Faculty of Religions are offered in Arabic.

Q: Does MU offer scholarships?
A: Yes. The university offers a 20% Geographic Discount for students from the South, Bekaa, and North. It also offers Academic Merit scholarships (up to 100%), sibling discounts (10%-15%), and need-based financial aid.

Q: Where is the campus located?
A: The campus is located on Airport Avenue in Ghobeiry, Beirut, near the Airport Bridge. It is about a 5-minute drive from Beirut Airport.

Q: Can I transfer credits from another university?
A: Yes. Transfer students must have a GPA of at least 2.0. Courses with a grade of 'C' (2.0) or above that match MU courses by 80% can be transferred. At least 50% of the program credits must be completed at MU.

Q: What are the contact details?
A: Phone: +961 1 820 930 or +961 1 850 062 | Email: info@mu.edu.lb | Website: www.mu.edu.lb.`,
        category: "faq",
        subcategory: "faq",
        language: "en"
    }
];
