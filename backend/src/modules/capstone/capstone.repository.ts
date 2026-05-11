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
                    createdAt DATETIME2 DEFAULT GETDATE()
                )
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
    static async getAllIdeas(limit: number = 200): Promise<CapstoneIdea[]> {
        await poolConnect;
        const result = await pool.request()
            .input("limit", limit)
            .query(`
                SELECT TOP (@limit) id, title, description, faculty, year, tags, createdAt
                FROM CapstoneIdeas
                ORDER BY year DESC, createdAt DESC
            `);
        return result.recordset;
    }

    /**
     * Search ideas by keyword (matches title, description, tags, faculty).
     */
    static async searchIdeas(keyword: string, limit: number = 50): Promise<CapstoneIdea[]> {
        await poolConnect;
        const result = await pool.request()
            .input("keyword", `%${keyword}%`)
            .input("limit", limit)
            .query(`
                SELECT TOP (@limit) id, title, description, faculty, year, tags, createdAt
                FROM CapstoneIdeas
                WHERE title LIKE @keyword
                   OR description LIKE @keyword
                   OR tags LIKE @keyword
                   OR faculty LIKE @keyword
                ORDER BY year DESC, createdAt DESC
            `);
        return result.recordset;
    }

    /**
     * Get ideas by faculty.
     */
    static async getIdeasByFaculty(faculty: string, limit: number = 50): Promise<CapstoneIdea[]> {
        await poolConnect;
        const result = await pool.request()
            .input("faculty", `%${faculty}%`)
            .input("limit", limit)
            .query(`
                SELECT TOP (@limit) id, title, description, faculty, year, tags, createdAt
                FROM CapstoneIdeas
                WHERE faculty LIKE @faculty
                ORDER BY year DESC, createdAt DESC
            `);
        return result.recordset;
    }

    /**
     * Add a new idea to the database (admin/seeder use).
     */
    static async addIdea(idea: Omit<CapstoneIdea, "id" | "createdAt">): Promise<CapstoneIdea> {
        await poolConnect;
        const result = await pool.request()
            .input("title", idea.title)
            .input("description", idea.description)
            .input("faculty", idea.faculty)
            .input("year", idea.year)
            .input("tags", idea.tags)
            .query(`
                INSERT INTO CapstoneIdeas (title, description, faculty, year, tags)
                OUTPUT INSERTED.*
                VALUES (@title, @description, @faculty, @year, @tags)
            `);
        return result.recordset[0];
    }

    /**
     * Bulk insert ideas (for seeding).
     */
    static async bulkInsertIdeas(ideas: Omit<CapstoneIdea, "id" | "createdAt">[]): Promise<number> {
        await poolConnect;
        let inserted = 0;
        for (const idea of ideas) {
            try {
                await pool.request()
                    .input("title", idea.title)
                    .input("description", idea.description)
                    .input("faculty", idea.faculty)
                    .input("year", idea.year)
                    .input("tags", idea.tags)
                    .query(`
                        INSERT INTO CapstoneIdeas (title, description, faculty, year, tags)
                        VALUES (@title, @description, @faculty, @year, @tags)
                    `);
                inserted++;
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
            SELECT DISTINCT faculty FROM CapstoneIdeas WHERE faculty != '' ORDER BY faculty
        `);
        return result.recordset.map((r: any) => r.faculty);
    }
}