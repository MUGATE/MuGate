import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { pool, poolConnect } from "../database/connection";
import { isSuperAdminUniversityId } from "../../config/env";

export async function isAdminUser(user: { universityId?: string } | undefined): Promise<boolean> {
    const universityId = String(user?.universityId || "");
    if (isSuperAdminUniversityId(universityId)) return true;

    try {
        await poolConnect;
        const result = await pool.request()
            .input("universityId", universityId)
            .query("SELECT 1 AS isAdmin FROM Admins WHERE universityId = @universityId");
        return result.recordset.length > 0;
    } catch (err: any) {
        console.error("Admin check error:", err.message);
        return false;
    }
}

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized: Access requires authentication." });
    }

    if (await isAdminUser(user)) {
        return next();
    }

    return res.status(403).json({ success: false, message: "Forbidden: Access restricted to administrator." });
};
