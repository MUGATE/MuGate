import { Request, Response, NextFunction } from "express";
import { RoadMapRepository, RoadMapCourse } from "./roadmap.repository";

const DEFAULT_COURSES: RoadMapCourse[] = [
    // Year 1 - Fall
    { courseCode: "CST 200", courseName: "Cultural Studies I", credits: 3, category: "General Requirements", year: 1, semester: "Fall" },
    { courseCode: "ENG 201", courseName: "English Communication Skills I", credits: 3, category: "General Requirements", year: 1, semester: "Fall" },
    { courseCode: "MAT 213", courseName: "Calculus III", credits: 3, category: "Mathematics & Sciences", year: 1, semester: "Fall" },
    { courseCode: "CSC 210", courseName: "C++ Programming + CSC 210L", credits: 4, category: "Major Requirements", year: 1, semester: "Fall" },
    { courseCode: "FOE 201", courseName: "Intro to Computing", credits: 3, category: "General Requirements", year: 1, semester: "Fall" },
    // Year 1 - Spring
    { courseCode: "ARB 201", courseName: "Arabic Communication Skills I", credits: 3, category: "General Requirements", year: 1, semester: "Spring" },
    { courseCode: "ENG 202", courseName: "English Communication Skills II", credits: 3, category: "General Requirements", year: 1, semester: "Spring" },
    { courseCode: "MAT 250", courseName: "Discrete Mathematics", credits: 3, category: "Mathematics & Sciences", year: 1, semester: "Spring" },
    { courseCode: "CSC 310", courseName: "Object Oriented Programming", credits: 3, category: "Major Requirements", year: 1, semester: "Spring" },
    { courseCode: "EEE 225", courseName: "Digital Logic Design + EEE 225L", credits: 4, category: "Major Requirements", year: 1, semester: "Spring" },
    // Year 1 - Summer
    { courseCode: "MAT 225", courseName: "Probability & Statistics for Science", credits: 3, category: "Mathematics & Sciences", year: 1, semester: "Summer" },
    // Year 2 - Fall
    { courseCode: "GEE 201", courseName: "General Elective I", credits: 3, category: "Free Liberal Arts", year: 2, semester: "Fall" },
    { courseCode: "ENG 204", courseName: "Public Speaking", credits: 3, category: "General Requirements", year: 2, semester: "Fall" },
    { courseCode: "MAT 320", courseName: "Linear Algebra", credits: 3, category: "Mathematics & Sciences", year: 2, semester: "Fall" },
    { courseCode: "COE 360", courseName: "Computer Networks + COE 360L", credits: 4, category: "Major Requirements", year: 2, semester: "Fall" },
    { courseCode: "CSC 320", courseName: "Data Structures", credits: 3, category: "Major Requirements", year: 2, semester: "Fall" },
    // Year 2 - Spring
    { courseCode: "GEE 202", courseName: "General Elective II", credits: 3, category: "Free Liberal Arts", year: 2, semester: "Spring" },
    { courseCode: "MAT 350", courseName: "Numerical Analysis", credits: 3, category: "Mathematics & Sciences", year: 2, semester: "Spring" },
    { courseCode: "SCI ELECT", courseName: "Science Elective", credits: 3, category: "Mathematics & Sciences", year: 2, semester: "Spring" },
    { courseCode: "COE 380", courseName: "Computer Organization", credits: 3, category: "Major Requirements", year: 2, semester: "Spring" },
    { courseCode: "CSC 330", courseName: "Database Systems + CSC 330L", credits: 4, category: "Major Requirements", year: 2, semester: "Spring" },
    // Year 2 - Summer
    { courseCode: "CSC 497", courseName: "Practical Training", credits: 3, category: "Major Requirements", year: 2, semester: "Summer" },
    // Year 3 - Fall
    { courseCode: "GEE 203", courseName: "General Elective III", credits: 3, category: "Free Liberal Arts", year: 3, semester: "Fall" },
    { courseCode: "CSC 340", courseName: "Theory of Computation", credits: 3, category: "Major Requirements", year: 3, semester: "Fall" },
    { courseCode: "CSC 400", courseName: "Web Programming", credits: 3, category: "Major Requirements", year: 3, semester: "Fall" },
    { courseCode: "CSC 420", courseName: "Algorithms", credits: 3, category: "Major Requirements", year: 3, semester: "Fall" },
    { courseCode: "CSC 498", courseName: "Capstone Project Proposal", credits: 0, category: "Major Requirements", year: 3, semester: "Fall" },
    { courseCode: "TECH ELEC", courseName: "Technical Elective", credits: 3, category: "Technical Electives", year: 3, semester: "Fall" },
    // Year 3 - Spring
    { courseCode: "CSC 450", courseName: "Operating Systems", credits: 3, category: "Major Requirements", year: 3, semester: "Spring" },
    { courseCode: "CSC 470", courseName: "Software Engineering", credits: 3, category: "Major Requirements", year: 3, semester: "Spring" },
    { courseCode: "CSC 499", courseName: "Capstone Project", credits: 3, category: "Major Requirements", year: 3, semester: "Spring" },
    { courseCode: "TECH ELEC", courseName: "Technical Elective", credits: 3, category: "Technical Electives", year: 3, semester: "Spring" }
];

const MULTI_SLOT_CODES = new Set(["TECH ELEC"]);

/** Collapse duplicate course rows; allow multi-slot electives per semester. */
function dedupeCourses(courses: RoadMapCourse[]): RoadMapCourse[] {
    const seen = new Set<string>();
    const out: RoadMapCourse[] = [];
    for (const c of courses) {
        const code = String(c.courseCode || "").trim().toUpperCase();
        if (!code) continue;
        const key = MULTI_SLOT_CODES.has(code)
            ? `${code}|${c.year}|${c.semester}`
            : code;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(c);
    }
    return out;
}

export class RoadMapController {
    static async getRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // @ts-ignore
            const userId = req.user?.userId;
            if (!userId) {
                res.json({ success: true, data: DEFAULT_COURSES, isGuest: true });
                return;
            }

            let courses = await RoadMapRepository.getUserRoadmap(userId);

            if (courses.length === 0) {
                // Re-check inside seed path to reduce double-seed races
                courses = await RoadMapRepository.getUserRoadmap(userId);
                if (courses.length === 0) {
                    await RoadMapRepository.saveUserRoadmap(userId, DEFAULT_COURSES);
                    courses = await RoadMapRepository.getUserRoadmap(userId);
                }
            }

            const cleaned = dedupeCourses(courses);
            if (cleaned.length < courses.length) {
                await RoadMapRepository.saveUserRoadmap(userId, cleaned);
                courses = cleaned;
            } else {
                courses = cleaned;
            }

            res.json({ success: true, data: courses });
        } catch (error) {
            next(error);
        }
    }

    static async saveRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // @ts-ignore
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const { courses } = req.body;
            if (!Array.isArray(courses)) {
                res.status(400).json({ success: false, message: "Courses must be an array" });
                return;
            }

            const cleaned = dedupeCourses(courses);
            await RoadMapRepository.saveUserRoadmap(userId, cleaned);
            res.json({ success: true, message: "Roadmap saved successfully", data: cleaned });
        } catch (error) {
            next(error);
        }
    }

    static async resetRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // @ts-ignore
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            await RoadMapRepository.saveUserRoadmap(userId, DEFAULT_COURSES);
            const courses = await RoadMapRepository.getUserRoadmap(userId);
            res.json({ success: true, data: courses, message: "Roadmap reset successfully" });
        } catch (error) {
            next(error);
        }
    }
}
