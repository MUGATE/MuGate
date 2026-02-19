import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.json({ success: true, data: result });
        } catch (err: any) {
            res.status(401).json({ success: false, message: err.message });
        }
    }

    static async register(req: Request, res: Response) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}
