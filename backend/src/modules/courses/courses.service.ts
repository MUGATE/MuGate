import { CoursesRepository } from "./courses.repository";
import { PortalScraper } from "../scraper/portal.scraper";
import { pool } from "../../core/database/connection";
import { decrypt } from "../../core/security/encryption.util";
import { logger } from "../../core/logger/logger";

export class CoursesService {
    static async getAllCourses() {
        return CoursesRepository.findAll();
    }

    static async getCourseById(id: string) {
        return CoursesRepository.findById(id);
    }

    static async syncCoursesFromPortal(userId: string, semesterId: number) {
        logger.info(`Starting course offerings sync for semester ${semesterId} by user ${userId}`);

        // 1. Get decrypted credentials from DB to perform the scraping
        const credsResult = await pool.request()
            .input("userId", userId)
            .query("SELECT * FROM PortalCredentials WHERE userId = @userId");

        if (credsResult.recordset.length === 0) {
            throw new Error("Portal credentials not found. Please log in again.");
        }

        const creds = credsResult.recordset[0];
        const universityIdString = decrypt(creds.encryptedUsername);
        const passwordString = decrypt(creds.encryptedPassword);

        return await this.syncCoursesGlobal(universityIdString, passwordString, semesterId);
    }

    /**
     * Core syncing logic separated so the background CRON job can trigger it globally.
     */
    static async syncCoursesGlobal(universityIdString: string, passwordString: string, semesterId: number) {
        // 2. Trigger Playwright to extract the courses
        const coursesData = await PortalScraper.extractCourses(universityIdString, passwordString, semesterId);

        if (!coursesData || coursesData.length === 0) {
            logger.warn(`No courses found for semester ${semesterId}`);
            return;
        }

        // 3. UPSERT the scraped data into Courses and CourseSections tables
        const transaction = new (require("mssql").Transaction)(pool);
        await transaction.begin();

        try {
            for (const course of coursesData) {
                // Completely skip any sections assigned to invalid rooms starting with 'A-' (e.g. A-120)
                if (course.room && course.room.trim().toUpperCase().startsWith('A-')) {
                    continue;
                }

                // Upsert Course entity
                const existingCourse = await transaction.request()
                    .input("courseCode", course.courseCode)
                    .query("SELECT id FROM Courses WHERE courseCode = @courseCode");

                let internalCourseId;

                if (existingCourse.recordset.length > 0) {
                    internalCourseId = existingCourse.recordset[0].id;
                    // Update course in case name/credits changed
                    await transaction.request()
                        .input("id", internalCourseId)
                        .input("courseName", course.courseName)
                        .input("credits", course.credits)
                        .query(`
                            UPDATE Courses 
                            SET courseName = @courseName, credits = @credits
                            WHERE id = @id
                        `);
                } else {
                    const insertCourse = await transaction.request()
                        .input("courseCode", course.courseCode)
                        .input("courseName", course.courseName)
                        .input("credits", course.credits)
                        .input("semester", semesterId.toString())
                        .query(`
                            INSERT INTO Courses (courseCode, courseName, credits, semester)
                            OUTPUT INSERTED.id
                            VALUES (@courseCode, @courseName, @credits, @semester)
                        `);
                    internalCourseId = insertCourse.recordset[0].id;
                }

                // Upsert CourseSection entity

                // Parse schedule: "W 17:30:00->18:45:00" or similar
                let day = "TBA";
                let startTime = "00:00:00";
                let endTime = "00:00:00";

                if (course.schedule && course.schedule.includes("->")) {
                    // Portal outputs newlines for multiple days
                    const scheduleLines = course.schedule.trim().split("\n");
                    const daysArr: string[] = [];

                    for (let i = 0; i < scheduleLines.length; i++) {
                        const parts = scheduleLines[i].trim().split(" ");
                        if (parts.length >= 2) {
                            const parsedDay = parts[0].trim();
                            if (!daysArr.includes(parsedDay)) {
                                daysArr.push(parsedDay);
                            }
                            // Take times from the first valid schedule line
                            if (i === 0) {
                                const times = parts[1].split("->");
                                if (times.length === 2) {
                                    startTime = times[0].trim();
                                    endTime = times[1].trim();
                                }
                            }
                        }
                    }
                    if (daysArr.length > 0) {
                        day = daysArr.join(","); // Stores as "M,W" or "T,Th"
                    }
                }

                const existingSection = await transaction.request()
                    .input("courseId", internalCourseId)
                    .input("sectionNumber", course.sectionNumber)
                    .query(`
                        SELECT id FROM CourseSections 
                        WHERE courseId = @courseId AND sectionNumber = @sectionNumber
                    `);

                if (existingSection.recordset.length > 0) {
                    await transaction.request()
                        .input("id", existingSection.recordset[0].id)
                        .input("instructor", course.instructor)
                        .input("day", day)
                        .input("startTime", startTime)
                        .input("endTime", endTime)
                        .input("capacity", course.capacity)
                        .input("enrolled", course.enrolled)
                        .input("room", course.room)
                        .query(`
                            UPDATE CourseSections 
                            SET instructor = @instructor, day = @day, startTime = @startTime, endTime = @endTime, capacity = @capacity, enrolled = @enrolled, room = @room
                            WHERE id = @id
                        `);
                } else {
                    // Insert new section
                    await transaction.request()
                        .input("courseId", internalCourseId)
                        .input("sectionNumber", course.sectionNumber)
                        .input("instructor", course.instructor)
                        .input("day", day)
                        .input("startTime", startTime)
                        .input("endTime", endTime)
                        .input("type", course.type || 'Lecture')
                        .input("capacity", course.capacity)
                        .input("enrolled", course.enrolled)
                        .input("room", course.room)
                        .query(`
                            INSERT INTO CourseSections (courseId, sectionNumber, instructor, day, startTime, endTime, type, capacity, enrolled, room)
                            VALUES (@courseId, @sectionNumber, @instructor, @day, @startTime, @endTime, @type, @capacity, @enrolled, @room)
                        `);
                }
            }

            await transaction.commit();
            logger.info(`Successfully synced ${coursesData.length} course sections for semester ${semesterId}`);

        } catch (error: any) {
            await transaction.rollback();
            logger.error(`Failed to sync courses:`, error);
            throw error;
        }
    }
}
