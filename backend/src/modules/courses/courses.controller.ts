import { Request, Response } from "express";
import { CoursesService } from "./courses.service";

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
}
