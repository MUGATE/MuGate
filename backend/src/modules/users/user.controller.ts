import { Request, Response } from "express";
import { UserService } from "./user.service";

export class UserController {
    static async getProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const user = await UserService.getUserById(userId);
            res.json({ success: true, data: user });
        } catch (err: any) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const updated = await UserService.updateUser(userId, req.body);
            res.json({ success: true, data: updated });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}
