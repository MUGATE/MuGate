import { pool } from "../../../../core/database/connection";
import { logger } from "../../../../core/logger/logger";

export class ChatbotAnalyticsService {

    /**
     * Fire and forget analytics logger to keep dashboard stats.
     * Does NOT record actual text to maintain data privacy.
     */
    static logQuery(category: string, isFailed: boolean, responseTimeMs: number): void {
        pool.request()
            .input("cat", category)
            .input("failed", isFailed)
            .input("time", responseTimeMs)
            .query(`INSERT INTO ChatAnalytics (questionCategory, isFailed, responseTimeMs) VALUES (@cat, @failed, @time)`)
            .catch(e => logger.error(`Analytics DB Error: ${e.message}`));
    }

    /**
     * Dashboard statistics for admins (aggregration only).
     */
    static async getAggregatedStats() {
        try {
            const stats = await pool.request().query(`
                SELECT 
                    COUNT(*) as totalQueries,
                    SUM(CAST(isFailed AS INTEGER)) as failedQueries,
                    AVG(responseTimeMs) as avgResponseTimeMs,
                    MAX(responseTimeMs) as maxResponseTimeMs
                FROM ChatAnalytics
            `);

            const topCategories = await pool.request().query(`
                SELECT questionCategory, COUNT(*) as count 
                FROM ChatAnalytics 
                GROUP BY questionCategory 
                ORDER BY count DESC
                LIMIT 5
            `);

            return {
                overview: stats.recordset[0],
                topCategories: topCategories.recordset
            };
        } catch (error: any) {
            logger.error(`Failed to get aggregated stats: ${error.message}`);
            throw error;
        }
    }
}
