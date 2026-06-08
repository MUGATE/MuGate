import { pool } from "../../core/database/connection";
import { generateToken, TokenPayload } from "../../core/security/jwt.util";
import { encrypt } from "../../core/security/encryption.util";
import { PortalScraper } from "../system/scraper/portal.scraper";
import { HistoryService } from "../history/history.service";
import { logger } from "../../core/logger/logger";

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
            // We use a random placeholder for password hash since they login via SSO
            const placeholderHash = "SSO_PORTAL_AUTH";

                        const insertResult = await pool.request()
                .input("email", defaultEmail)
                .input("passwordHash", placeholderHash)
                .input("name", scrapedName || `Student ${universityId}`)
                .input("universityId", universityId)
                .query(`
                    INSERT INTO Users (email, passwordHash, name, universityId)
                    OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.universityId
                    VALUES (@email, @passwordHash, @name, @universityId)
                `);

            user = insertResult.recordset[0];
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
                IF EXISTS (SELECT 1 FROM PortalCredentials WHERE userId = @userId)
                BEGIN
                    UPDATE PortalCredentials 
                    SET encryptedUsername = @eUser, encryptedPassword = @ePass, updatedAt = GETDATE()
                    WHERE userId = @userId
                END
                ELSE
                BEGIN
                    INSERT INTO PortalCredentials (userId, encryptedUsername, encryptedPassword)
                    VALUES (@userId, @eUser, @ePass)
                END
            `);

        // 5. Auto-scrape the student's academic history so the generator knows what they passed
        try {
            await HistoryService.syncStudentHistoryFromPortal(user.id);
            logger.info(`Successfully synced academic history for user ${user.id} on login`);
        } catch (historyErr: any) {
            logger.warn(`Non-fatal: Failed to sync history on login for ${user.id}: ${historyErr.message}`);
        }

        // 6. Generate and return MuGate JWT
        const payload: TokenPayload = { userId: user.id, email: user.email, name: user.name, universityId: user.universityId };
        const token = generateToken(payload);

        // 7. Check if user is an admin (super admin or in Admins table)
        let isAdmin = user.universityId === "101230004";
        if (!isAdmin) {
            try {
                const adminCheck = await pool.request()
                    .input("universityId", user.universityId)
                    .query("SELECT 1 FROM Admins WHERE universityId = @universityId");
                isAdmin = adminCheck.recordset.length > 0;
            } catch {}
        }

        return {
            token,
            user: {
                userId: user.id,
                email: user.email,
                name: user.name,
                universityId: user.universityId,
                isAdmin
            }
        };
    }
}
