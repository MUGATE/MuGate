export interface CurriculumCourse {
    courseCode: string; // The primary identifier, e.g. "CSC 210" or "ELECTIVE_GER_1"
    courseTitle: string;
    credits: number;
    prerequisites: string[]; // Array of course codes that must be marked "Passed"
    corequisites: string[]; // Array of course codes that must be "Passed" OR taken concurrently
    type: 'Major' | 'GER' | 'Elective' | 'Remedial' | 'Mathematics';
    category?: string; // e.g. "Free Science Elective", "Liberal Arts Elective", "Technical Elective"
    isElectivePlaceholder?: boolean;
    allowedCodes?: string[]; // If placeholder, only these specific course codes are allowed
    year: number;
    semester: number;
}

export const CS_CURRICULUM: CurriculumCourse[] = [
    // --- Year 1 : Semester 1 ---
    { courseCode: "FOE 201", courseTitle: "Intro to Computing", credits: 3, prerequisites: [], corequisites: ["ENG 100"], type: 'GER', year: 1, semester: 1 },
    { courseCode: "ENG 201", courseTitle: "English Communication Skills I", credits: 3, prerequisites: [], corequisites: [], type: 'GER', year: 1, semester: 1 },
    { courseCode: "MAT 213", courseTitle: "Calculus III", credits: 3, prerequisites: [], corequisites: [], type: 'Mathematics', year: 1, semester: 1 },
    { courseCode: "CSC 210", courseTitle: "C++ Programming", credits: 3, prerequisites: [], corequisites: ["ENG 100"], type: 'Major', year: 1, semester: 1 },
    { courseCode: "CSC 210L", courseTitle: "C++ Programming Lab", credits: 1, prerequisites: [], corequisites: ["CSC 210"], type: 'Major', year: 1, semester: 1 },
    { courseCode: "CST 200", courseTitle: "Cultural Studies I", credits: 3, prerequisites: [], corequisites: [], type: 'GER', year: 1, semester: 1 },

    // --- Year 1 : Semester 2 ---
    { courseCode: "ENG 202", courseTitle: "English Communication Skills II", credits: 3, prerequisites: ["ENG 201"], corequisites: [], type: 'GER', year: 1, semester: 2 },
    { courseCode: "MAT 250", courseTitle: "Discrete Mathematics", credits: 3, prerequisites: [], corequisites: [], type: 'Mathematics', year: 1, semester: 2 },
    { courseCode: "EEE 225", courseTitle: "Digital Logic Design", credits: 3, prerequisites: [], corequisites: ["ENG 100", "MAT 213"], type: 'Major', year: 1, semester: 2 },
    { courseCode: "EEE 225L", courseTitle: "Digital Logic Design Lab", credits: 1, prerequisites: [], corequisites: ["EEE 225"], type: 'Major', year: 1, semester: 2 },
    { courseCode: "ARB 201", courseTitle: "Arabic Communication Skills I", credits: 3, prerequisites: [], corequisites: [], type: 'GER', year: 1, semester: 2 },
    { courseCode: "CSC 310", courseTitle: "Object Oriented Programming", credits: 3, prerequisites: ["CSC 210"], corequisites: [], type: 'Major', year: 1, semester: 2 },

    // --- Year 1 : Summer ---
    { courseCode: "MAT 225", courseTitle: "Probability & Statistics for Science", credits: 3, prerequisites: ["MAT 213"], corequisites: [], type: 'Mathematics', year: 1, semester: 3 },

    // --- Year 2 : Semester 1 ---
    { courseCode: "CSC 320", courseTitle: "Data Structures", credits: 3, prerequisites: ["CSC 210"], corequisites: [], type: 'Major', year: 2, semester: 1 },
    { courseCode: "MAT 320", courseTitle: "Linear Algebra", credits: 3, prerequisites: ["MAT 213"], corequisites: [], type: 'Mathematics', year: 2, semester: 1 },
    { courseCode: "ENG 204", courseTitle: "Public Speaking", credits: 3, prerequisites: ["ENG 202"], corequisites: [], type: 'GER', year: 2, semester: 1 },
    { courseCode: "CST 201", courseTitle: "Cultural Studies II: Community Culture", credits: 3, prerequisites: ["CST 200"], corequisites: [], type: 'GER', year: 2, semester: 1 },
    { courseCode: "COE 360", courseTitle: "Computer Networks", credits: 3, prerequisites: ["CSC 210"], corequisites: [], type: 'Major', year: 2, semester: 1 },
    { courseCode: "COE 360L", courseTitle: "Computer Networks Lab", credits: 1, prerequisites: [], corequisites: ["COE 360"], type: 'Major', year: 2, semester: 1 },

    // --- Year 2 : Semester 2 ---
    { courseCode: "CSC 330", courseTitle: "Database Systems", credits: 3, prerequisites: ["CSC 320"], corequisites: [], type: 'Major', year: 2, semester: 2 },
    { courseCode: "CSC 330L", courseTitle: "Database Systems Lab", credits: 1, prerequisites: [], corequisites: ["CSC 330"], type: 'Major', year: 2, semester: 2 },
    { courseCode: "COE 380", courseTitle: "Computer Organization", credits: 3, prerequisites: ["EEE 225"], corequisites: [], type: 'Major', year: 2, semester: 2 },
    { courseCode: "MAT 350", courseTitle: "Numerical Analysis", credits: 3, prerequisites: ["MAT 320"], corequisites: [], type: 'Mathematics', year: 2, semester: 2 },
    { courseCode: "ELECTIVE_LIBERAL_2", courseTitle: "Liberal Arts Elective 2", credits: 3, prerequisites: [], corequisites: [], type: 'Elective', category: "Liberal Arts Elective", isElectivePlaceholder: true, allowedCodes: ["CST 202", "HIS 201"], year: 2, semester: 2 },
    { courseCode: "ELECTIVE_SCIENCE_1", courseTitle: "Free Science Elective", credits: 3, prerequisites: [], corequisites: [], type: 'Elective', category: "Free Science Elective", isElectivePlaceholder: true, year: 2, semester: 2 },

    // --- Year 2 : Summer ---
    { courseCode: "CSC 497", courseTitle: "Practical Training", credits: 3, prerequisites: [], corequisites: [], type: 'Major', year: 2, semester: 3 },

    // --- Year 3 : Semester 1 ---
    { courseCode: "CSC 340", courseTitle: "Theory of Computation", credits: 3, prerequisites: ["MAT 250", "CSC 320"], corequisites: [], type: 'Major', year: 3, semester: 1 },
    { courseCode: "CSC 400", courseTitle: "Web Programming", credits: 3, prerequisites: ["FOE 201", "CSC 210"], corequisites: [], type: 'Major', year: 3, semester: 1 },
    { courseCode: "CSC 420", courseTitle: "Algorithms", credits: 3, prerequisites: ["CSC 320"], corequisites: [], type: 'Major', year: 3, semester: 1 },
    { courseCode: "CSC 498", courseTitle: "Capstone Project Proposal", credits: 0, prerequisites: [], corequisites: [], type: 'Major', year: 3, semester: 1 },
    { courseCode: "ELECTIVE_LIBERAL_3", courseTitle: "Liberal Arts Elective 3", credits: 3, prerequisites: [], corequisites: [], type: 'Elective', category: "Liberal Arts Elective", isElectivePlaceholder: true, year: 3, semester: 1 },
    { courseCode: "ELECTIVE_TECH_1", courseTitle: "Technical Elective 1", credits: 3, prerequisites: [], corequisites: [], type: 'Elective', category: "Technical Elective", isElectivePlaceholder: true, year: 3, semester: 1 },

    // --- Year 3 : Semester 2 ---
    { courseCode: "CSC 450", courseTitle: "Operating Systems", credits: 3, prerequisites: [], corequisites: ["COE 380"], type: 'Major', year: 3, semester: 2 },
    { courseCode: "CSC 470", courseTitle: "Software Engineering", credits: 3, prerequisites: ["CSC 320"], corequisites: [], type: 'Major', year: 3, semester: 2 },
    { courseCode: "CSC 499", courseTitle: "Capstone Project", credits: 3, prerequisites: ["CSC 498"], corequisites: [], type: 'Major', year: 3, semester: 2 },
    { courseCode: "ELECTIVE_TECH_2", courseTitle: "Technical Elective 2", credits: 3, prerequisites: [], corequisites: [], type: 'Elective', category: "Technical Elective", isElectivePlaceholder: true, year: 3, semester: 2 },
];
