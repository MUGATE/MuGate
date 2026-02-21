import { Request, Response } from "express";
import { GeneratorService } from "./generator.service";
import { logger } from "../../core/logger/logger";

export class GeneratorController {
    static async generate(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { semesterId, preferences } = req.body;

            if (!semesterId) {
                res.status(400).json({ success: false, message: "Missing required field: semesterId" });
                return;
            }

            const result = await GeneratorService.generateSchedules(userId, semesterId, preferences || {});

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(`Generation error: ${error.message}`);
            res.status(500).json({ success: false, message: "Failed to generate schedules" });
        }
    }
}
