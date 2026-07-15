import { Request, Response } from "express";
import { AuthService } from "./auth.service";

function isCredentialError(message: string): boolean {
    const m = message.toLowerCase();
    return (
        m.includes("invalid university") ||
        m.includes("authentication failed") ||
        m.includes("invalid credentials") ||
        m.includes("incorrect") ||
        m.includes("wrong password")
    );
}

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { universityId, password } = req.body;

            if (!universityId || !password) {
                res.status(400).json({ success: false, message: "University ID and password are required" });
                return;
            }

            const id = String(universityId).trim();
            if (!/^\d{5,15}$/.test(id)) {
                res.status(400).json({ success: false, message: "University ID must be numeric (5–15 digits)." });
                return;
            }
            if (String(password).length < 4 || String(password).length > 200) {
                res.status(400).json({ success: false, message: "Invalid password length." });
                return;
            }

            const result = await AuthService.login(id, password);
            res.json({ success: true, data: result });
        } catch (err: any) {
            const message = err?.message || "Login failed";
            if (isCredentialError(message)) {
                res.status(401).json({ success: false, message });
                return;
            }
            // Portal/DB/crypto failures must not masquerade as bad passwords
            res.status(503).json({
                success: false,
                message: "Login temporarily unavailable. Please try again shortly.",
            });
        }
    }
}
