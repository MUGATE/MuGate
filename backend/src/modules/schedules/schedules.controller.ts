import { Request, Response } from "express";
import { SchedulesService } from "./schedules.service";
import { logger } from "../../core/logger/logger";

export class SchedulesController {

    static async save(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { name, score, totalCredits, sectionIds } = req.body;

            if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
                res.status(400).json({ success: false, message: "Missing or invalid sectionIds array" });
                return;
            }

            const schedule = await SchedulesService.saveSchedule(userId, name, score, totalCredits, sectionIds);

            res.status(201).json({
                success: true,
                message: "Schedule saved successfully",
                data: schedule
            });
        } catch (error: any) {
            logger.error(`SchedulesController save error: ${error.message}`);
            res.status(500).json({ success: false, message: "Failed to save schedule" });
        }
    }

    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const schedules = await SchedulesService.getSavedSchedules(userId);

            res.status(200).json({
                success: true,
                data: schedules
            });
        } catch (error: any) {
            logger.error(`SchedulesController getAll error: ${error.message}`);
            res.status(500).json({ success: false, message: "Failed to fetch saved schedules" });
        }
    }

    static async remove(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ success: false, message: "Schedule ID is required" });
                return;
            }

            await SchedulesService.deleteSchedule(userId, id as string);

            res.status(200).json({
                success: true,
                message: "Schedule deleted successfully"
            });
        } catch (error: any) {
            logger.error(`SchedulesController remove error: ${error.message}`);
            res.status(500).json({ success: false, message: error.message || "Failed to delete schedule" });
        }
    }
}
