import { pool } from "../../../../core/database/connection";
import { logger } from "../../../../core/logger/logger";
import { isCompletedStatus } from "../../../../core/utils/academic-status.util";

export class ChatbotContextService {

    /**
     * Builds a comprehensive academic context for an authenticated student.
     * Extracts info isolated strictly to the provided userId.
     */
    static async buildStudentContext(userId: string): Promise<string> {
        try {
            // 1. Get User Profile Information
            const userResult = await pool.request()
                .input("userId", userId)
                .query("SELECT name, universityId, email FROM Users WHERE id = @userId");

            const user = userResult.recordset[0];
            if (!user) return "Context Error: Student not found.";

            // 2. Get Academic History (Completed credits & GPA logic)
            const historyResult = await pool.request()
                .input("userId", userId)
                .query("SELECT courseCode, courseName, grade, credits, semester, status FROM AcademicHistory WHERE userId = @userId");

            const history = historyResult.recordset.filter((row: any) => isCompletedStatus(row.status));
            const completedCredits = history.reduce((acc: number, row: any) => acc + (row.credits || 0), 0);

            // Generate summary of passed courses
            const passedCoursesStr = history.map(h => `- ${h.courseCode} (${h.courseName}): Grade ${h.grade}, ${h.credits} Credits`).join("\n") || "- None recorded.";

            // 3. Get currently enrolled classes (registered from current term)
            const enrolledResult = await pool.request()
                .input("userId", userId)
                .query("SELECT courseCode, courseName, credits, semester FROM AcademicHistory WHERE userId = @userId AND status = 'Registered'");

            const enrolled = enrolledResult.recordset;
            const enrolledCoursesStr = enrolled.map(e => `- ${e.courseCode}: ${e.courseName}`).join("\n") || "- Not currently registered for classes or data pending.";

            // 4. Get Highest Valued Generated Schedule Data (if any)
            const scheduleResult = await pool.request()
                .input("userId", userId)
                .query("SELECT name, totalCredits FROM Schedules WHERE userId = @userId ORDER BY score DESC, createdAt DESC LIMIT 1");

            const savedSchedule = scheduleResult.recordset[0];
            let scheduleStr = "- No recent schedules generated.";
            if (savedSchedule) {
                scheduleStr = `- Last saved schedule: ${savedSchedule.name || 'Untitled'} (${savedSchedule.totalCredits} credits).`;
            }

            // Assemble the final context string
            return `
Student Name: ${user.name}
University ID: ${user.universityId}
Email: ${user.email}

[ACADEMIC STATUS]
Total Completed Credits: ${completedCredits}

[COMPLETED COURSES]
${passedCoursesStr}

[CURRENTLY ENROLLED/REGISTERED]
${enrolledCoursesStr}

[SAVED SCHEDULES]
${scheduleStr}
            `.trim();

        } catch (error: any) {
            logger.error(`Failed to build context for user ${userId}: ${error.message}`);
            return "Context Error: Failed to retrieve academic context system.";
        }
    }
}
