import { Router, Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../../core/middleware/auth.middleware";
import { CapstoneRepository } from "./capstone.repository";
import { CapstoneService } from "./capstone.service";
import { logger } from "../../core/logger/logger";

const router = Router();

// ═══════════════════════════════════════════════════════════
// PARTNER ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/capstone/partners
 * Public — get all partner listings. Optional ?search= query param.
 */
router.get("/partners", async (req: Request, res: Response) => {
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

        const { email, phone, major, skills, description, lookingFor } = req.body;

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

        // Check if user already has a listing
        const alreadyListed = await CapstoneRepository.hasUserListed(userId);
        if (alreadyListed) {
            return res.status(409).json({ success: false, message: "You already have a partner listing. Delete it first to create a new one." });
        }

        const partner = await CapstoneRepository.addPartner({
            userId,
            userName,
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
        const partnerId = parseInt(req.params.partnerId, 10);
        if (isNaN(partnerId)) {
            return res.status(400).json({ success: false, message: "Invalid partnerId." });
        }

        const userId = String(req.user?.userId || "");
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        const deleted = await CapstoneRepository.deletePartner(partnerId, userId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Listing not found or not yours." });
        }

        logger.info(`User ${userId} deleted partner listing ${partnerId}`);
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
 * Public — chat with the Capstone AI advisor.
 * Body: { message: string, history?: Array<{ role: string, content: string }> }
 */
router.post("/ai/chat", async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Message is required." });
        }

        const result = await CapstoneService.chat(
            message.trim(),
            Array.isArray(history) ? history : []
        );

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