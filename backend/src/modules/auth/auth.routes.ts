import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../core/middleware/auth.middleware";
import { adminMiddleware, isAdminUser } from "../../core/middleware/admin.middleware";
import { authRateLimiter } from "../../core/middleware/rateLimiter.middleware";
import { pool, poolConnect } from "../../core/database/connection";
import { env, isSuperAdminUniversityId } from "../../config/env";

const router = Router();

router.post("/login", authRateLimiter, AuthController.login);

// Lightweight self-check: is the current user an admin? (no adminMiddleware gate)
router.get("/me/is-admin", authMiddleware, async (req, res) => {
    const user = (req as any).user;
    try {
        const isAdmin = await isAdminUser(user);
        return res.json({
            success: true,
            isAdmin,
            isSuperAdmin: isSuperAdminUniversityId(user?.universityId),
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// --- Admin Management Routes ---

router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request()
            .query("SELECT id, name, email, universityId, lastActiveAt FROM Users ORDER BY name ASC");

        return res.json({ success: true, users: result.recordset });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/admins", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await poolConnect;
        const superId = env.superAdminUniversityId;
        const result = await pool.request()
            .input("superId", superId || "__none__")
            .query(`
            SELECT u.id, u.name, u.email,
                   COALESCE(a.universityId, u.universityId) as universityId,
                   u.lastActiveAt,
                   CASE
                     WHEN a.universityId IS NOT NULL THEN 1
                     WHEN @superId <> '__none__' AND u.universityId = @superId THEN 1
                     ELSE 0
                   END as isAdmin,
                   CASE WHEN @superId <> '__none__' AND u.universityId = @superId THEN 1 ELSE 0 END as isSuperAdmin
            FROM Users u
            LEFT JOIN Admins a ON u.universityId = a.universityId
            WHERE a.universityId IS NOT NULL
               OR (@superId <> '__none__' AND u.universityId = @superId)
            ORDER BY u.name ASC
        `);

        const admins = result.recordset.map(adm => {
            const lastActive = adm.lastActiveAt ? new Date(adm.lastActiveAt) : null;
            let isOnline = false;
            let offlineDuration = "Never logged in";

            if (lastActive) {
                const diffMs = Date.now() - lastActive.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                if (diffMins < 5) {
                    isOnline = true;
                    offlineDuration = "Online";
                } else if (diffMins < 60) {
                    offlineDuration = `${diffMins}m ago`;
                } else {
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours < 24) {
                        offlineDuration = `${diffHours}h ago`;
                    } else {
                        const diffDays = Math.floor(diffHours / 24);
                        offlineDuration = `${diffDays}d ago`;
                    }
                }
            }

            return {
                ...adm,
                isSuperAdmin: Boolean(adm.isSuperAdmin),
                isOnline,
                offlineDuration
            };
        });

        return res.json({ success: true, admins });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/admins", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { universityId } = req.body;
        if (!universityId) {
            return res.status(400).json({ success: false, message: "University ID is required." });
        }

        const derivedEmail = `${universityId}@mu.edu.lb`;

        await poolConnect;

        await pool.request()
            .input("universityId", universityId)
            .input("email", derivedEmail)
            .input("passwordHash", "SSO_PORTAL_AUTH")
            .query(`
                INSERT INTO Users (universityId, email, name, passwordHash)
                SELECT @universityId, @email, @universityId, @passwordHash
                WHERE NOT EXISTS (SELECT 1 FROM Users WHERE universityId = @universityId)
            `);

        await pool.request()
            .input("universityId", universityId)
            .query(`
                INSERT INTO Admins (universityId)
                SELECT @universityId
                WHERE NOT EXISTS (SELECT 1 FROM Admins WHERE universityId = @universityId)
            `);

        return res.json({ success: true, message: "Admin added successfully." });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.delete("/admins/:universityId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const universityId = String(req.params.universityId || "");
        if (isSuperAdminUniversityId(universityId)) {
            return res.status(400).json({ success: false, message: "Super admin cannot be removed." });
        }

        await poolConnect;
        await pool.request()
            .input("universityId", universityId)
            .query("DELETE FROM Admins WHERE universityId = @universityId");

        return res.json({ success: true, message: "Admin removed successfully." });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
