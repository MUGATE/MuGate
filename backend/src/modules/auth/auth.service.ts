import { pool } from "../../core/database/connection";
import { generateToken, TokenPayload } from "../../core/security/jwt.util";
import { encrypt } from "../../core/security/encryption.util";
import { PortalScraper } from "../system/scraper/portal.scraper";
import { HistoryService } from "../history/history.service";
import { logger } from "../../core/logger/logger";
import { isAdminUser } from "../../core/middleware/admin.middleware";

export class AuthService {
    /**
     * Authenticates a user directly against the MU Portal.
     * If successful, it automatically registers the user in the database (if they don't exist),
     * and securely stores their encrypted portal credentials for future background scraping.
     * 
     * @param universityId The student's MU ID
     * @param password The student's MU portal password
     */
    static async login(universityId: string, password: string) {
                // 1. Verify credentials against the actual University Portal and scrape student name
        const portalResult = await PortalScraper.verifyCredentials(universityId, password);

        if (portalResult.error) {
            throw new Error(portalResult.error);
        }

        if (!portalResult.valid) {
            throw new Error("Invalid university ID or password. Authentication failed at MU Portal.");
        }

        const scrapedName = portalResult.studentName;

        // 2. Portal login successful. Check if user exists in our local database.
        let userResult = await pool.request()
            .input("universityId", universityId)
            .query("SELECT * FROM Users WHERE universityId = @universityId");

        let user = userResult.recordset[0];

        // 3. Auto-Registration: If user doesn't exist, create them.
        if (!user) {
            const defaultEmail = `${universityId}@mu.edu.lb`;
            const placeholderHash = "SSO_PORTAL_AUTH";

            try {
                const insertResult = await pool.request()
                    .input("email", defaultEmail)
                    .input("passwordHash", placeholderHash)
                    .input("name", scrapedName || `Student ${universityId}`)
                    .input("universityId", universityId)
                    .query(`
                        INSERT INTO Users (email, passwordHash, name, universityId)
                        VALUES (@email, @passwordHash, @name, @universityId)
                        RETURNING id, email, name, universityId
                    `);
                user = insertResult.recordset[0];
            } catch (insertErr: any) {
                // Concurrent first-login race: re-select after unique conflict
                const again = await pool.request()
                    .input("universityId", universityId)
                    .query("SELECT * FROM Users WHERE universityId = @universityId");
                user = again.recordset[0];
                if (!user) throw insertErr;
            }
        }

        // 3b. Update the user's name if we scraped a real name from the portal
        if (scrapedName && user.name !== scrapedName) {
            await pool.request()
                .input("userId", user.id)
                .input("name", scrapedName)
                .query("UPDATE Users SET name = @name WHERE id = @userId");
            user.name = scrapedName;
            logger.info(`Updated user name to "${scrapedName}" for user ${user.id}`);
        }

        // 4. Upsert encrypted credentials so the background scraper can use them later
        const encryptedUsername = encrypt(universityId);
        const encryptedPassword = encrypt(password);

        await pool.request()
            .input("userId", user.id)
            .input("eUser", encryptedUsername)
            .input("ePass", encryptedPassword)
            .query(`
                INSERT INTO PortalCredentials (userId, encryptedUsername, encryptedPassword)
                VALUES (@userId, @eUser, @ePass)
                ON CONFLICT (userId) DO UPDATE SET
                    encryptedUsername = EXCLUDED.encryptedUsername,
                    encryptedPassword = EXCLUDED.encryptedPassword,
                    updatedAt = NOW()
            `);

        // 5. Auto-scrape the student's academic history so the generator knows what they passed
        try {
            await HistoryService.syncStudentHistoryFromPortal(user.id);
            logger.info(`Successfully synced academic history for user ${user.id} on login`);
        } catch (historyErr: any) {
            logger.warn(`Non-fatal: Failed to sync history on login for ${user.id}: ${historyErr.message}`);
        }

        // 5b. Re-read GPA after sync so login payload is current
        let gpa: number | null = null;
        try {
            const summary = await HistoryService.getAcademicSummary(user.id);
            gpa = summary.gpa;
        } catch (gpaErr: any) {
            logger.warn(`Non-fatal: Failed to read GPA for ${user.id}: ${gpaErr.message}`);
        }

        // 6. Generate and return MuGate JWT
        const payload: TokenPayload = { userId: user.id, email: user.email, name: user.name, universityId: user.universityId };
        const token = generateToken(payload);

        // 7. Check if user is an admin (super admin via env or Admins table)
        let isAdmin = false;
        try {
            isAdmin = await isAdminUser({ universityId: user.universityId });
        } catch (adminErr: any) {
            logger.warn(`Admin check failed for ${user.id}: ${adminErr.message}`);
            isAdmin = false;
        }

        return {
            token,
            user: {
                userId: user.id,
                email: user.email,
                name: user.name,
                universityId: user.universityId,
                isAdmin,
                gpa,
            }
        };
    }
}
