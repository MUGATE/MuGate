import { Response, NextFunction } from "express";
import { verifyToken } from "../security/jwt.util";
import { AuthRequest } from "./auth.middleware";

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // No token, proceed as anonymous/public
        return next();
    }

    const token = authHeader.split(" ")[1];

        try {
        const decoded = verifyToken(token);
        (req as any).user = decoded; // Attach user info if valid
        next();
    } catch (err) {
        // Token was provided but is expired/invalid — reject so frontend can auto-logout
        return res.status(401).json({ message: "Token expired or invalid. Please login again." });
    }
};
