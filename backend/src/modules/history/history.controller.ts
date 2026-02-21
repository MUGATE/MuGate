import { Request, Response } from "express";
import { HistoryService } from "./history.service";
import { AuthRequest } from "../../core/middleware/auth.middleware";

export class HistoryController {
    static async getStudentHistory(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const history = await HistoryService.getStudentHistory(userId);
            res.json({ success: true, data: history });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async syncHistory(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            // Syncing history triggers the background Playwright scraper
            await HistoryService.syncStudentHistoryFromPortal(userId);

            // Fetch the newly synced data from the database
            const history = await HistoryService.getStudentHistory(userId);

            res.json({ success: true, message: "History synced successfully", data: history });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message || "Failed to sync history" });
        }
    }
}
