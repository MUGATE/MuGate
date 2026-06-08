import { pool, poolConnect } from "../../core/database/connection";
import { logger } from "../../core/logger/logger";

// ─── Interfaces ───────────────────────────────────────────

export interface CapstonePartner {
    id?: number;
    userId: string;
    userName: string;
    email: string;
    phone: string;
    major: string;
    skills: string;
    description: string;
    lookingFor: string;
    createdAt?: Date;
}

export interface CapstoneIdea {
    id?: number;
    title: string;
    description: string;
    faculty: string;
    year: number;
    tags: string;
    createdAt?: Date;
}

// ─── Repository ───────────────────────────────────────────

export class CapstoneRepository {

    /**
     * Ensure both tables exist. Called once at startup.
     */
    static async ensureTables(): Promise<void> {
        try {
            await poolConnect;

            // CapstonePartners table
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CapstonePartners' AND xtype='U')
                CREATE TABLE CapstonePartners (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    userId NVARCHAR(255) NOT NULL,
                    userName NVARCHAR(255) NOT NULL,
                    email NVARCHAR(255) NOT NULL,
                    phone NVARCHAR(50) NOT NULL DEFAULT '',
                    major NVARCHAR(255) NOT NULL DEFAULT '',
                    skills NVARCHAR(MAX) NOT NULL DEFAULT '',
                    description NVARCHAR(MAX) NOT NULL DEFAULT '',
                    lookingFor NVARCHAR(MAX) NOT NULL DEFAULT '',
                    createdAt DATETIME2 DEFAULT GETDATE()
                )
            `);

            // CapstoneIdeas table — stores historical capstone project ideas
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CapstoneIdeas' AND xtype='U')
                CREATE TABLE CapstoneIdeas (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    title NVARCHAR(500) NOT NULL,
                    description NVARCHAR(MAX) NOT NULL,
                    faculty NVARCHAR(255) NOT NULL DEFAULT '',
                    year INT NOT NULL DEFAULT 0,
                    tags NVARCHAR(MAX) NOT NULL DEFAULT '',
                    isActive BIT NOT NULL DEFAULT 1,
                    createdAt DATETIME2 DEFAULT GETDATE()
                )
                ELSE
                BEGIN
                    IF NOT EXISTS (
                        SELECT * FROM sys.columns 
                        WHERE object_id = OBJECT_ID('CapstoneIdeas') AND name = 'isActive'
                    )
                    ALTER TABLE CapstoneIdeas ADD isActive BIT NOT NULL DEFAULT 1;
                END
            `);

            logger.info("Capstone tables ensured (CapstonePartners + CapstoneIdeas).");
        } catch (err: any) {
            logger.error(`Failed to ensure Capstone tables: ${err.message}`);
        }
    }

    // ─── Partner Methods ──────────────────────────────────

    /**
     * Get all partners, newest first.
     */
    static async getAllPartners(): Promise<CapstonePartner[]> {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT id, userId, userName, email, phone, major, skills, description, lookingFor, createdAt
            FROM CapstonePartners
            ORDER BY createdAt DESC
        `);
        return result.recordset;
    }

    /**
     * Search partners by keyword (matches name, major, skills, description, lookingFor).
     */
    static async searchPartners(keyword: string): Promise<CapstonePartner[]> {
        await poolConnect;
        const result = await pool.request()
            .input("keyword", `%${keyword}%`)
            .query(`
                SELECT id, userId, userName, email, phone, major, skills, description, lookingFor, createdAt
                FROM CapstonePartners
                WHERE userName LIKE @keyword
                   OR major LIKE @keyword
                   OR skills LIKE @keyword
                   OR description LIKE @keyword
                   OR lookingFor LIKE @keyword
                ORDER BY createdAt DESC
            `);
        return result.recordset;
    }

    /**
     * Add a new partner listing.
     */
    static async addPartner(partner: Omit<CapstonePartner, "id" | "createdAt">): Promise<CapstonePartner> {
        await poolConnect;
        const result = await pool.request()
            .input("userId", partner.userId)
            .input("userName", partner.userName)
            .input("email", partner.email)
            .input("phone", partner.phone)
            .input("major", partner.major)
            .input("skills", partner.skills)
            .input("description", partner.description)
            .input("lookingFor", partner.lookingFor)
            .query(`
                INSERT INTO CapstonePartners (userId, userName, email, phone, major, skills, description, lookingFor)
                OUTPUT INSERTED.*
                VALUES (@userId, @userName, @email, @phone, @major, @skills, @description, @lookingFor)
            `);
        return result.recordset[0];
    }

    /**
     * Delete a partner listing — only if the requesting user owns it.
     */
    static async deletePartner(partnerId: number, userId: string): Promise<boolean> {
        await poolConnect;
        const result = await pool.request()
            .input("id", partnerId)
            .input("userId", userId)
            .query(`DELETE FROM CapstonePartners WHERE id = @id AND userId = @userId`);
        return (result.rowsAffected[0] || 0) > 0;
    }

    /**
     * Check if user already has a partner listing.
     */
    static async hasUserListed(userId: string): Promise<boolean> {
        await poolConnect;
        const result = await pool.request()
            .input("userId", userId)
            .query(`SELECT COUNT(*) AS cnt FROM CapstonePartners WHERE userId = @userId`);
        return result.recordset[0].cnt > 0;
    }

    // ─── Ideas Methods ────────────────────────────────────

    /**
     * Get all ideas, newest first. Optional limit.
     */
    static async getAllIdeas(limit: number = 300, includeDeleted: boolean = false): Promise<CapstoneIdea[]> {
        await poolConnect;
        const condition = includeDeleted ? "" : "WHERE isActive = 1";
        const result = await pool.request()
            .input("limit", limit)
            .query(`
                SELECT TOP (@limit) id, title, description, faculty, year, tags, isActive, createdAt
                FROM CapstoneIdeas
                ${condition}
                ORDER BY year DESC, title ASC, createdAt DESC
            `);
        return result.recordset;
    }

    /**
     * Search ideas by keyword (matches title, description, tags, faculty).
     */
    static async searchIdeas(keyword: string, limit: number = 300): Promise<CapstoneIdea[]> {
        await poolConnect;
        const result = await pool.request()
            .input("keyword", `%${keyword}%`)
            .input("limit", limit)
            .query(`
                SELECT TOP (@limit) id, title, description, faculty, year, tags, isActive, createdAt
                FROM CapstoneIdeas
                WHERE isActive = 1 AND (
                    title LIKE @keyword
                    OR description LIKE @keyword
                    OR tags LIKE @keyword
                    OR faculty LIKE @keyword
                )
                ORDER BY year DESC, title ASC, createdAt DESC
            `);
        return result.recordset;
    }

    /**
     * Get ideas by faculty.
     */
    static async getIdeasByFaculty(faculty: string, limit: number = 300): Promise<CapstoneIdea[]> {
        await poolConnect;
        const result = await pool.request()
            .input("faculty", `%${faculty}%`)
            .input("limit", limit)
            .query(`
                SELECT TOP (@limit) id, title, description, faculty, year, tags, isActive, createdAt
                FROM CapstoneIdeas
                WHERE isActive = 1 AND faculty LIKE @faculty
                ORDER BY year DESC, title ASC, createdAt DESC
            `);
        return result.recordset;
    }

    /**
     * Add a new idea to the database (admin/seeder use).
     */
    static async addIdea(idea: Omit<CapstoneIdea, "id" | "createdAt" | "isActive">): Promise<CapstoneIdea> {
        await poolConnect;
        const result = await pool.request()
            .input("title", idea.title)
            .input("description", idea.description)
            .input("faculty", idea.faculty)
            .input("year", idea.year)
            .input("tags", idea.tags)
            .query(`
                INSERT INTO CapstoneIdeas (title, description, faculty, year, tags, isActive)
                OUTPUT INSERTED.*
                VALUES (@title, @description, @faculty, @year, @tags, 1)
            `);
        return result.recordset[0];
    }

    /**
     * Update an existing idea.
     */
    static async updateIdea(id: number, idea: Omit<CapstoneIdea, "id" | "createdAt" | "isActive">): Promise<CapstoneIdea | null> {
        await poolConnect;
        const result = await pool.request()
            .input("id", id)
            .input("title", idea.title)
            .input("description", idea.description)
            .input("faculty", idea.faculty)
            .input("year", idea.year)
            .input("tags", idea.tags)
            .query(`
                UPDATE CapstoneIdeas
                SET title = @title, description = @description, faculty = @faculty, year = @year, tags = @tags
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        return result.recordset[0] || null;
    }

    /**
     * Delete an idea:
     * - If id <= 187: soft delete (isActive = 0)
     * - If id > 187: hard delete (physical delete)
     */
    static async deleteIdea(id: number): Promise<boolean> {
        await poolConnect;
        let query = "";
        if (id <= 187) {
            query = "UPDATE CapstoneIdeas SET isActive = 0 WHERE id = @id";
        } else {
            query = "DELETE FROM CapstoneIdeas WHERE id = @id";
        }
        const result = await pool.request()
            .input("id", id)
            .query(query);
        return (result.rowsAffected[0] || 0) > 0;
    }

    /**
     * Restore a soft-deleted default idea.
     */
    static async restoreIdea(id: number): Promise<boolean> {
        await poolConnect;
        const result = await pool.request()
            .input("id", id)
            .query("UPDATE CapstoneIdeas SET isActive = 1 WHERE id = @id");
        return (result.rowsAffected[0] || 0) > 0;
    }

    /**
     * Get soft-deleted ideas (for admin undo delete view).
     */
    static async getDeletedIdeas(): Promise<CapstoneIdea[]> {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT id, title, description, faculty, year, tags, isActive, createdAt
            FROM CapstoneIdeas
            WHERE isActive = 0
            ORDER BY year DESC, title ASC
        `);
        return result.recordset;
    }

    /**
     * Bulk insert ideas (for seeding).
     */
    static async bulkInsertIdeas(ideas: Omit<CapstoneIdea, "id" | "createdAt" | "isActive">[]): Promise<number> {
        await poolConnect;
        let inserted = 0;
        for (const idea of ideas) {
            try {
                const result = await pool.request()
                    .input("title", idea.title)
                    .input("description", idea.description)
                    .input("faculty", idea.faculty)
                    .input("year", idea.year)
                    .input("tags", idea.tags)
                    .query(`
                        IF NOT EXISTS (
                            SELECT 1 FROM CapstoneIdeas 
                            WHERE title = @title AND CAST(description AS NVARCHAR(1000)) = CAST(@description AS NVARCHAR(1000))
                        )
                        BEGIN
                            INSERT INTO CapstoneIdeas (title, description, faculty, year, tags, isActive)
                            VALUES (@title, @description, @faculty, @year, @tags, 1)
                        END
                    `);
                if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                    inserted++;
                }
            } catch (err: any) {
                logger.warn(`Failed to insert idea "${idea.title}": ${err.message}`);
            }
        }
        return inserted;
    }

    /**
     * Get total count of ideas.
     */
    static async getIdeasCount(): Promise<number> {
        await poolConnect;
        const result = await pool.request().query(`SELECT COUNT(*) AS cnt FROM CapstoneIdeas`);
        return result.recordset[0].cnt;
    }

    /**
     * Get distinct faculties from ideas.
     */
    static async getDistinctFaculties(): Promise<string[]> {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT DISTINCT faculty FROM CapstoneIdeas WHERE faculty != '' AND isActive = 1 ORDER BY faculty
        `);
        return result.recordset.map((r: any) => r.faculty);
    }
}