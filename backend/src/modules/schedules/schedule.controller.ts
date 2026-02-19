import { Request, Response } from "express";
import { ScheduleService } from "./schedule.service";

export class ScheduleController {
    static async getUserSchedules(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const schedules = await ScheduleService.getByUserId(userId);
            res.json({ success: true, data: schedules });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async saveSchedule(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const saved = await ScheduleService.save(userId, req.body);
            res.status(201).json({ success: true, data: saved });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}
