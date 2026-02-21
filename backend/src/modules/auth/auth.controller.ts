import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            // The frontend now only needs to send universityId (e.g. "101230004") and password
            const { universityId, password } = req.body;

            if (!universityId || !password) {
                res.status(400).json({ success: false, message: "University ID and password are required" });
                return;
            }

            const result = await AuthService.login(universityId, password);
            res.json({ success: true, data: result });
        } catch (err: any) {
            res.status(401).json({ success: false, message: err.message });
        }
    }
}
