import { Request, Response } from "express";
import { CoursesService } from "./courses.service";
import { AuthRequest } from "../../core/middleware/auth.middleware";

export class CoursesController {
    static async getAll(req: Request, res: Response) {
        try {
            const courses = await CoursesService.getAllCourses();
            res.json({ success: true, data: courses });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const course = await CoursesService.getCourseById(String(req.params.id));
            res.json({ success: true, data: course });
        } catch (err: any) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    static async syncCourses(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const semesterId = req.body.semesterId;

            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            if (!semesterId) {
                res.status(400).json({ success: false, message: "semesterId is required in the body" });
                return;
            }

            await CoursesService.syncCoursesFromPortal(userId, semesterId);

            res.json({ success: true, message: `Courses for semester ${semesterId} synced successfully` });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to sync courses" });
        }
    }
}
