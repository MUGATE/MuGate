import { pool, poolConnect } from "../../core/database/connection";
import { logger } from "../../core/logger/logger";

export interface InternshipReview {
    id?: number;
    companyId: number;
    userId: string;
    userName: string;
    rating: number;
    feedback: string;
    createdAt?: Date;
}

export class InternshipRepository {
    /**
     * Ensure the InternshipReviews table exists. Called once at startup.
     */
    static async ensureTable(): Promise<void> {
        try {
            await poolConnect;
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InternshipReviews' AND xtype='U')
                CREATE TABLE InternshipReviews (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    companyId INT NOT NULL,
                    userId NVARCHAR(255) NOT NULL,
                    userName NVARCHAR(255) NOT NULL,
                    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    feedback NVARCHAR(MAX) NOT NULL,
                    createdAt DATETIME2 DEFAULT GETDATE()
                )
            `);
            logger.info("InternshipReviews table ensured.");
        } catch (err: any) {
            logger.error(`Failed to ensure InternshipReviews table: ${err.message}`);
        }
    }

    /**
     * Get all reviews for a specific company, sorted by newest first.
     */
    static async getReviewsByCompanyId(companyId: number): Promise<InternshipReview[]> {
        await poolConnect;
        const result = await pool.request()
            .input("companyId", companyId)
            .query(`
                SELECT id, companyId, userId, userName, rating, feedback, createdAt
                FROM InternshipReviews
                WHERE companyId = @companyId
                ORDER BY createdAt DESC
            `);
        return result.recordset;
    }

    /**
     * Get aggregated stats for all companies (average rating + review count).
     */
    static async getCompanyStats(): Promise<{ companyId: number; avgRating: number; reviewCount: number; latestFeedback: string | null }[]> {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT 
                s.companyId,
                s.avgRating,
                s.reviewCount,
                latest.feedback AS latestFeedback
            FROM (
                SELECT 
                    companyId,
                    AVG(CAST(rating AS FLOAT)) AS avgRating,
                    COUNT(*) AS reviewCount
                FROM InternshipReviews
                GROUP BY companyId
            ) s
            OUTER APPLY (
                SELECT TOP 1 feedback
                FROM InternshipReviews r
                WHERE r.companyId = s.companyId
                ORDER BY r.createdAt DESC
            ) latest
        `);
        return result.recordset;
    }

    /**
     * Add a new review. Returns the inserted review.
     */
    static async addReview(review: Omit<InternshipReview, "id" | "createdAt">): Promise<InternshipReview> {
        await poolConnect;
        const result = await pool.request()
            .input("companyId", review.companyId)
            .input("userId", review.userId)
            .input("userName", review.userName)
            .input("rating", review.rating)
            .input("feedback", review.feedback)
            .query(`
                INSERT INTO InternshipReviews (companyId, userId, userName, rating, feedback)
                OUTPUT INSERTED.*
                VALUES (@companyId, @userId, @userName, @rating, @feedback)
            `);
        return result.recordset[0];
    }

    /**
     * Delete a review by id — only if the requesting user owns it.
     */
    static async deleteReview(reviewId: number, userId: string): Promise<boolean> {
        await poolConnect;
        const result = await pool.request()
            .input("id", reviewId)
            .input("userId", userId)
            .query(`DELETE FROM InternshipReviews WHERE id = @id AND userId = @userId`);
        return (result.rowsAffected[0] || 0) > 0;
    }

    /**
     * Update a review by id — only if the requesting user owns it.
     */
    static async updateReview(reviewId: number, userId: string, rating: number, feedback: string): Promise<InternshipReview | null> {
        await poolConnect;
        const result = await pool.request()
            .input("id", reviewId)
            .input("userId", userId)
            .input("rating", rating)
            .input("feedback", feedback)
            .query(`
                UPDATE InternshipReviews
                SET rating = @rating, feedback = @feedback
                OUTPUT INSERTED.*
                WHERE id = @id AND userId = @userId
            `);
        return result.recordset[0] || null;
    }

    /**
     * Check if a user has already reviewed a specific company.
     */
    static async hasUserReviewed(companyId: number, userId: string): Promise<boolean> {
        await poolConnect;
        const result = await pool.request()
            .input("companyId", companyId)
            .input("userId", userId)
            .query(`SELECT COUNT(*) AS cnt FROM InternshipReviews WHERE companyId = @companyId AND userId = @userId`);
        return result.recordset[0].cnt > 0;
    }
}