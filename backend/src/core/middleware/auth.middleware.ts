import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../security/jwt.util";
import { pool } from "../database/connection";

export interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        (req as any).user = decoded;

        // Async fire-and-forget update of lastActiveAt for online status
        if (decoded && decoded.userId) {
            pool.request()
                .input("userId", decoded.userId)
                .query("UPDATE Users SET lastActiveAt = GETDATE() WHERE id = @userId")
                .catch((err) => console.warn(`Failed to update lastActiveAt: ${err.message}`));
        }

        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
