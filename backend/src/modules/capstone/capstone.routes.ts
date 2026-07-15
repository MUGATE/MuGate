import { Router, Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../../core/middleware/auth.middleware";
import { adminMiddleware, isAdminUser } from "../../core/middleware/admin.middleware";
import { CapstoneRepository } from "./capstone.repository";
import { CapstoneService } from "./capstone.service";
import { logger } from "../../core/logger/logger";
import { aiRateLimiter } from "../../core/middleware/rateLimiter.middleware";

const router = Router();

// ═══════════════════════════════════════════════════════════
// PARTNER ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/capstone/partners
 * Auth required — partner listings include contact PII.
 */
router.get("/partners", authMiddleware, async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;
        let partners;

        if (search && search.trim().length > 0) {
            partners = await CapstoneRepository.searchPartners(search.trim());
        } else {
            partners = await CapstoneRepository.getAllPartners();
        }

        return res.json({ success: true, partners });
    } catch (err: any) {
        logger.error(`Failed to get partners: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to fetch partners." });
    }
});

/**
 * POST /api/capstone/partners
 * Auth required — add yourself to the "Need Partner" list.
 */
router.post("/partners", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = String(req.user?.userId || "");
        const userName = req.user?.name || req.user?.email?.split("@")[0] || "Anonymous";

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        const { email, phone, major, skills, description, lookingFor, userName: bodyUserName } = req.body;
        const isAdmin = await isAdminUser(req.user);

        // Validate required fields
        if (!email || typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({ success: false, message: "Valid email is required." });
        }
        if (!major || typeof major !== "string" || major.trim().length < 2) {
            return res.status(400).json({ success: false, message: "Major is required (at least 2 characters)." });
        }
        if (!description || typeof description !== "string" || description.trim().length < 10) {
            return res.status(400).json({ success: false, message: "Description must be at least 10 characters." });
        }

        if (!isAdmin) {
            const alreadyListed = await CapstoneRepository.hasUserListed(userId);
            if (alreadyListed) {
                return res.status(409).json({ success: false, message: "You already have a partner listing. Delete it first to create a new one." });
            }
        }

        const listingUserName =
            isAdmin && typeof bodyUserName === "string" && bodyUserName.trim().length >= 2
                ? bodyUserName.trim()
                : userName;

        const partner = await CapstoneRepository.addPartner({
            userId,
            userName: listingUserName,
            email: email.trim(),
            phone: (phone || "").trim(),
            major: major.trim(),
            skills: (skills || "").trim(),
            description: description.trim(),
            lookingFor: (lookingFor || "").trim(),
        });

        logger.info(`User ${userId} added capstone partner listing`);
        return res.status(201).json({ success: true, partner });
    } catch (err: any) {
        const msg = String(err?.message || "");
        if (/unique|duplicate|UQ_CapstonePartners/i.test(msg)) {
            return res.status(409).json({
                success: false,
                message: "You already have a partner listing. Delete it first to create a new one.",
            });
        }
        logger.error(`Failed to add partner: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to add partner listing." });
    }
});

/**
 * DELETE /api/capstone/partners/:partnerId
 * Auth required — delete own partner listing.
 */
router.delete("/partners/:partnerId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const partnerId = parseInt(req.params.partnerId as string, 10);
        if (isNaN(partnerId)) {
            return res.status(400).json({ success: false, message: "Invalid partnerId." });
        }

        const userId = String(req.user?.userId || "");
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        const isAdmin = await isAdminUser(req.user);
        const deleted = isAdmin
            ? await CapstoneRepository.deletePartnerAdmin(partnerId)
            : await CapstoneRepository.deletePartner(partnerId, userId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: isAdmin ? "Listing not found." : "Listing not found or not yours.",
            });
        }

        logger.info(`User ${userId} deleted partner listing ${partnerId} (isAdmin: ${isAdmin})`);
        return res.json({ success: true, message: "Partner listing deleted." });
    } catch (err: any) {
        logger.error(`Failed to delete partner: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to delete partner listing." });
    }
});

// ═══════════════════════════════════════════════════════════
// IDEAS ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/capstone/ideas
 * Public — get all capstone ideas. Optional ?search= and ?faculty= query params.
 */
router.get("/ideas", async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;
        const faculty = req.query.faculty as string | undefined;
        let ideas;

        if (search && search.trim().length > 0) {
            ideas = await CapstoneRepository.searchIdeas(search.trim());
        } else if (faculty && faculty.trim().length > 0) {
            ideas = await CapstoneRepository.getIdeasByFaculty(faculty.trim());
        } else {
            ideas = await CapstoneRepository.getAllIdeas();
        }

        return res.json({ success: true, ideas });
    } catch (err: any) {
        logger.error(`Failed to get ideas: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to fetch ideas." });
    }
});

/**
 * GET /api/capstone/ideas/deleted
 * Admin only — get all soft-deleted default ideas.
 */
router.get("/ideas/deleted", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const ideas = await CapstoneRepository.getDeletedIdeas();
        return res.json({ success: true, ideas });
    } catch (err: any) {
        logger.error(`Failed to get deleted ideas: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to fetch deleted ideas." });
    }
});

/**
 * POST /api/capstone/ideas
 * Admin only — add a capstone idea.
 */
router.post("/ideas", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, faculty, year, tags } = req.body;
        if (!title || !description) {
            return res.status(400).json({ success: false, message: "Title and Description are required." });
        }
        const idea = await CapstoneRepository.addIdea({
            title: title.trim(),
            description: description.trim(),
            faculty: (faculty || "").trim(),
            year: Number(year) || new Date().getFullYear(),
            tags: (tags || "").trim()
        });
        return res.status(201).json({ success: true, idea });
    } catch (err: any) {
        logger.error(`Failed to add idea: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to add idea." });
    }
});

/**
 * PUT /api/capstone/ideas/:id
 * Admin only — update a capstone idea.
 */
router.put("/ideas/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid idea ID." });
        }
        const { title, description, faculty, year, tags } = req.body;
        if (!title || !description) {
            return res.status(400).json({ success: false, message: "Title and Description are required." });
        }
        const updated = await CapstoneRepository.updateIdea(id, {
            title: title.trim(),
            description: description.trim(),
            faculty: (faculty || "").trim(),
            year: Number(year) || new Date().getFullYear(),
            tags: (tags || "").trim()
        });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Idea not found." });
        }
        return res.json({ success: true, idea: updated });
    } catch (err: any) {
        logger.error(`Failed to update idea: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to update idea." });
    }
});

/**
 * DELETE /api/capstone/ideas/:id
 * Admin only — delete a capstone idea (soft for default, hard for custom).
 */
router.delete("/ideas/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid idea ID." });
        }
        const success = await CapstoneRepository.deleteIdea(id);
        if (!success) {
            return res.status(404).json({ success: false, message: "Idea not found." });
        }
        return res.json({ success: true, message: "Idea deleted successfully." });
    } catch (err: any) {
        logger.error(`Failed to delete idea: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to delete idea." });
    }
});

/**
 * POST /api/capstone/ideas/:id/restore
 * Admin only — restore a soft-deleted idea.
 */
router.post("/ideas/:id/restore", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid idea ID." });
        }
        const success = await CapstoneRepository.restoreIdea(id);
        if (!success) {
            return res.status(404).json({ success: false, message: "Idea not found." });
        }
        return res.json({ success: true, message: "Idea restored successfully." });
    } catch (err: any) {
        logger.error(`Failed to restore idea: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to restore idea." });
    }
});

/**
 * GET /api/capstone/ideas/faculties
 * Public — get distinct faculties from ideas.
 */
router.get("/ideas/faculties", async (req: Request, res: Response) => {
    try {
        const faculties = await CapstoneRepository.getDistinctFaculties();
        return res.json({ success: true, faculties });
    } catch (err: any) {
        logger.error(`Failed to get faculties: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to fetch faculties." });
    }
});

// ═══════════════════════════════════════════════════════════
// AI CHAT ROUTE
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/capstone/ai/chat
 * Auth required — chat with the Capstone AI advisor.
 * Body: { message: string, history?: Array<{ role: string, content: string }> }
 */
router.post("/ai/chat", authMiddleware, aiRateLimiter, async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Message is required." });
        }

        const result = await CapstoneService.chat(
            message.trim(),
            Array.isArray(history) ? history : []
        );

        if (result.error) {
            return res.status(503).json({
                success: false,
                message: result.text,
                tokensUsed: 0,
                ideasUsed: 0,
            });
        }

        return res.json({
            success: true,
            text: result.text,
            tokensUsed: result.tokensUsed,
            ideasUsed: result.ideasUsed
        });
    } catch (err: any) {
        logger.error(`Capstone AI chat failed: ${err.message}`);
        return res.status(500).json({ success: false, message: "AI chat request failed." });
    }
});

export default router;