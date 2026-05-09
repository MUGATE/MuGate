import { Router, Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../../core/middleware/auth.middleware";
import { optionalAuthMiddleware } from "../../core/middleware/optionalAuth.middleware";
import { InternshipRepository } from "./internship.repository";
import { logger } from "../../core/logger/logger";

const router = Router();

/**
 * GET /api/internships/stats
 * Public — get aggregated rating stats for all companies.
 * IMPORTANT: Must be defined BEFORE /reviews/:companyId to avoid route conflict.
 */
router.get("/stats", async (req: Request, res: Response) => {
    try {
        const stats = await InternshipRepository.getCompanyStats();
        return res.json({ success: true, stats });
    } catch (err: any) {
        logger.error(`Failed to get company stats: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to fetch stats." });
    }
});

/**
 * GET /api/internships/reviews/:companyId
 * Public — get all reviews for a company.
 */
router.get("/reviews/:companyId", async (req: Request, res: Response) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (isNaN(companyId)) {
            return res.status(400).json({ success: false, message: "Invalid companyId." });
        }

        const reviews = await InternshipRepository.getReviewsByCompanyId(companyId);
        return res.json({ success: true, reviews });
    } catch (err: any) {
        logger.error(`Failed to get reviews: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to fetch reviews." });
    }
});

/**
 * POST /api/internships/reviews/:companyId
 * Auth required — submit a review for a company.
 */
router.post("/reviews/:companyId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (isNaN(companyId)) {
            return res.status(400).json({ success: false, message: "Invalid companyId." });
        }

        const { rating, feedback } = req.body;

        // Validate rating (must be integer 1-5)
        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5." });
        }

        // Validate feedback
        if (!feedback || typeof feedback !== "string" || feedback.trim().length < 5) {
            return res.status(400).json({ success: false, message: "Feedback must be at least 5 characters." });
        }

        // JWT payload uses 'userId' (from TokenPayload in jwt.util.ts)
        const userId = String(req.user?.userId || "");
        const userName = req.user?.name || req.user?.email?.split("@")[0] || "Anonymous";

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        // Check if user already reviewed this company
        const alreadyReviewed = await InternshipRepository.hasUserReviewed(companyId, userId);
        if (alreadyReviewed) {
            return res.status(409).json({ success: false, message: "You have already reviewed this company." });
        }

        const review = await InternshipRepository.addReview({
            companyId,
            userId,
            userName,
            rating: numRating,
            feedback: feedback.trim(),
        });

        logger.info(`User ${userId} submitted review for company ${companyId}`);
        return res.status(201).json({ success: true, review });
    } catch (err: any) {
        logger.error(`Failed to submit review: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to submit review." });
    }
});

/**
 * PUT /api/internships/reviews/:reviewId
 * Auth required — update own review.
 */
router.put("/reviews/:reviewId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const reviewId = parseInt(req.params.reviewId, 10);
        if (isNaN(reviewId)) {
            return res.status(400).json({ success: false, message: "Invalid reviewId." });
        }

        const { rating, feedback } = req.body;

        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5." });
        }

        if (!feedback || typeof feedback !== "string" || feedback.trim().length < 5) {
            return res.status(400).json({ success: false, message: "Feedback must be at least 5 characters." });
        }

        const userId = String(req.user?.userId || "");
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        const updated = await InternshipRepository.updateReview(reviewId, userId, numRating, feedback.trim());
        if (!updated) {
            return res.status(404).json({ success: false, message: "Review not found or not yours." });
        }

        logger.info(`User ${userId} updated review ${reviewId}`);
        return res.json({ success: true, review: updated });
    } catch (err: any) {
        logger.error(`Failed to update review: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to update review." });
    }
});

/**
 * DELETE /api/internships/reviews/:reviewId
 * Auth required — delete own review.
 */
router.delete("/reviews/:reviewId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const reviewId = parseInt(req.params.reviewId, 10);
        if (isNaN(reviewId)) {
            return res.status(400).json({ success: false, message: "Invalid reviewId." });
        }

        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        const deleted = await InternshipRepository.deleteReview(reviewId, userId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Review not found or not yours." });
        }

        logger.info(`User ${userId} deleted review ${reviewId}`);
        return res.json({ success: true, message: "Review deleted." });
    } catch (err: any) {
        logger.error(`Failed to delete review: ${err.message}`);
        return res.status(500).json({ success: false, message: "Failed to delete review." });
    }
});

export default router;