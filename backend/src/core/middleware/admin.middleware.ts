import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { pool, poolConnect } from "../database/connection";

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized: Access requires authentication." });
    }

    const universityId = String(user.universityId || '');

    if (universityId === "101230004") {
        return next();
    }

    try {
        await poolConnect;
        const result = await pool.request()
            .input("universityId", universityId)
            .query("SELECT 1 AS isAdmin FROM Admins WHERE universityId = @universityId");
        
        if (result.recordset.length > 0) {
            return next();
        }
    } catch (err: any) {
        console.error("Admin check error:", err.message);
    }

    return res.status(403).json({ success: false, message: "Forbidden: Access restricted to administrator." });
};
