import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../core/middleware/auth.middleware";
import { adminMiddleware } from "../../core/middleware/admin.middleware";
import { pool, poolConnect } from "../../core/database/connection";

const router = Router();

router.post("/login", AuthController.login);

// --- Admin Management Routes ---

// 1. Get all registered users to select from
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

// 2. Get list of admins with online/offline activity details
router.get("/admins", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await poolConnect;
        // Fetch all admins from table AND include super admin
        const result = await pool.request().query(`
            SELECT u.id, u.name, u.email, 
                   COALESCE(a.universityId, u.universityId) as universityId, 
                   u.lastActiveAt,
                   CASE WHEN a.universityId IS NOT NULL OR u.universityId = '101230004' THEN 1 ELSE 0 END as isAdmin
            FROM Users u
            LEFT JOIN Admins a ON u.universityId = a.universityId
            WHERE a.universityId IS NOT NULL OR u.universityId = '101230004'
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
                isOnline,
                offlineDuration
            };
        });

        return res.json({ success: true, admins });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 3. Add admin
router.post("/admins", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { universityId } = req.body;
        if (!universityId) {
            return res.status(400).json({ success: false, message: "University ID is required." });
        }

        await poolConnect;
        // Verify user exists in Users table first
        const userCheck = await pool.request()
            .input("universityId", universityId)
            .query("SELECT 1 FROM Users WHERE universityId = @universityId");
        
        if (userCheck.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "User not found with this University ID." });
        }

        // Insert into Admins table
        await pool.request()
            .input("universityId", universityId)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Admins WHERE universityId = @universityId)
                BEGIN
                    INSERT INTO Admins (universityId) VALUES (@universityId)
                END
            `);

        return res.json({ success: true, message: "Admin added successfully." });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Remove admin
router.delete("/admins/:universityId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { universityId } = req.params;
        if (universityId === "101230004") {
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
