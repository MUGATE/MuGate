import { pool } from "../../core/database/connection";
import { generateToken, TokenPayload } from "../../core/security/jwt.util";
import { encrypt } from "../../core/security/encryption.util";
import { PortalScraper } from "../scraper/portal.scraper";

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
        // 1. Verify credentials against the actual University Portal
        const isValidOnPortal = await PortalScraper.verifyCredentials(universityId, password);

        if (!isValidOnPortal) {
            throw new Error("Invalid university ID or password. Authentication failed at MU Portal.");
        }

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
                .input("name", `Student ${universityId}`) // We might update this later if we scrape the actual name
                .input("universityId", universityId)
                .query(`
                    INSERT INTO Users (email, passwordHash, name, universityId)
                    OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.universityId
                    VALUES (@email, @passwordHash, @name, @universityId)
                `);

            user = insertResult.recordset[0];
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

        // 5. Generate and return MuGate JWT
        const payload: TokenPayload = { userId: user.id, email: user.email };
        const token = generateToken(payload);

        return {
            token,
            user: {
                userId: user.id,
                email: user.email,
                name: user.name,
                universityId: user.universityId
            }
        };
    }
}
