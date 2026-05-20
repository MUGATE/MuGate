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

export interface Company {
    id?: number;
    name: string;
    description: string;
    colors: string;
    scale: number;
    svgString: string;
    email?: string;
    phone?: string;
    website?: string;
    forceWhiteBack?: boolean;
    isMetallic?: boolean;
}

export class InternshipRepository {
    /**
     * Ensure the InternshipReviews and Companies tables exist and seed default companies.
     */
    static async ensureTable(): Promise<void> {
        try {
            await poolConnect;
            
            // 1. Ensure Companies table exists
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Companies' AND xtype='U')
                CREATE TABLE Companies (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(255) NOT NULL,
                    description NVARCHAR(MAX) NULL,
                    colors NVARCHAR(255) NULL,
                    scale FLOAT NOT NULL DEFAULT 0.02,
                    svgString NVARCHAR(MAX) NULL,
                    email NVARCHAR(255) NULL,
                    phone NVARCHAR(255) NULL,
                    website NVARCHAR(255) NULL,
                    forceWhiteBack BIT NOT NULL DEFAULT 0,
                    isMetallic BIT NOT NULL DEFAULT 0
                )
            `);
            logger.info("Companies table ensured.");

            // 2. Ensure InternshipReviews table exists
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

            // 3. Seed Companies if empty
            const countResult = await pool.request().query("SELECT COUNT(*) AS cnt FROM Companies");
            if (countResult.recordset[0].cnt === 0) {
                logger.info("Seeding 14 default companies...");
                const defaults: Omit<Company, "id">[] = [
                    {
                        name: "Touch",
                        description: "Leading mobile telecommunications and data services operator in Lebanon.",
                        colors: "#ea0c2c,#c90022,#ffffff",
                        scale: 0.02,
                        svgString: "touch",
                        email: "careers@touch.com.lb",
                        phone: "+961 3 799 799",
                        website: "www.touch.com.lb",
                        forceWhiteBack: false,
                        isMetallic: false
                    },
                    {
                        name: "Youbee AI",
                        description: "Pioneering Artificial Intelligence solutions and robust machine learning models.",
                        colors: "#3b82f6,#1d4ed8,#ffffff",
                        scale: 0.02,
                        svgString: "Youbee ai",
                        email: "hello@youbee.ai",
                        phone: "+1 (415) 555-0198",
                        website: "www.youbee.ai",
                        forceWhiteBack: false,
                        isMetallic: true
                    },
                    {
                        name: "Whish Money",
                        description: "Innovative digital wallet and financial services platform.",
                        colors: "#FF0000,#cc0000,#ffffff,#ff4d4d",
                        scale: 0.02,
                        svgString: "Whish Money",
                        email: "hr@whish.money",
                        phone: "+961 1 202 303",
                        website: "www.whish.money",
                        forceWhiteBack: true,
                        isMetallic: false
                    },
                    {
                        name: "XpertBot",
                        description: "Delivering fully-integrated robotic automation and expert software systems.",
                        colors: "#f59e0b,#d97706,#ffffff",
                        scale: 0.02,
                        svgString: "XpertBot",
                        email: "careers@xpertbotacademy.com",
                        phone: "+961 70 123 456",
                        website: "www.xpertbotacademy.com",
                        forceWhiteBack: false,
                        isMetallic: true
                    },
                    {
                        name: "IDS",
                        description: "Global consulting empowering enterprises through structured data intelligence.",
                        colors: "#10b981,#059669,#ffffff",
                        scale: 0.02,
                        svgString: "IDS",
                        email: "jobs@ids.com.lb",
                        phone: "+961 1 859 101",
                        website: "www.ids.com.lb",
                        forceWhiteBack: false,
                        isMetallic: false
                    },
                    {
                        name: "42 Beirut",
                        description: "Innovative peer-to-peer coding school with a project-based curriculum.",
                        colors: "#00babc,#009a9c,#ffffff",
                        scale: 0.02,
                        svgString: "42 Beirut",
                        email: "contact@42beirut.com",
                        phone: "+961 1 000 000",
                        website: "www.42beirut.com",
                        forceWhiteBack: true,
                        isMetallic: false
                    },
                    {
                        name: "Al Maaref",
                        description: "Leading educational institution providing quality learning and professional development programs.",
                        colors: "#1e3a5f,#152d4a,#ffffff",
                        scale: 0.02,
                        svgString: "Al Maaref",
                        email: "info@almaaref.edu.lb",
                        phone: "+961 1 300 400",
                        website: "www.almaaref.edu.lb",
                        forceWhiteBack: false,
                        isMetallic: false
                    },
                    {
                        name: "Brainkets",
                        description: "Creative digital agency specializing in web development, mobile apps, and digital marketing.",
                        colors: "#e74c3c,#c0392b,#ffffff",
                        scale: 0.02,
                        svgString: "Brainkets",
                        email: "hello@brainkets.com",
                        phone: "+961 1 456 789",
                        website: "www.brainkets.com",
                        forceWhiteBack: false,
                        isMetallic: false
                    },
                    {
                        name: "Dynasoft",
                        description: "Enterprise software solutions provider specializing in ERP and business process automation.",
                        colors: "#2980b9,#1a6fa0,#ffffff",
                        scale: 0.02,
                        svgString: "Dynasoft",
                        email: "careers@dynasoft.com.lb",
                        phone: "+961 1 567 890",
                        website: "www.dynasoft.com.lb",
                        forceWhiteBack: false,
                        isMetallic: false
                    },
                    {
                        name: "Ektidar",
                        description: "Technology consultancy empowering businesses with innovative digital transformation solutions.",
                        colors: "#8e44ad,#71368a,#ffffff",
                        scale: 0.02,
                        svgString: "Ektidar",
                        email: "info@ektidar.com",
                        phone: "+961 1 678 901",
                        website: "www.ektidar.com",
                        forceWhiteBack: false,
                        isMetallic: false
                    },
                    {
                        name: "Neruos",
                        description: "AI-driven healthcare technology company building intelligent diagnostic and analytics platforms.",
                        colors: "#00b894,#009d80,#ffffff",
                        scale: 0.02,
                        svgString: "Neruos",
                        email: "contact@neruos.com",
                        phone: "+961 1 789 012",
                        website: "www.neruos.com",
                        forceWhiteBack: false,
                        isMetallic: true
                    },
                    {
                        name: "Semicolon",
                        description: "Coding academy and tech community offering intensive bootcamps and developer training.",
                        colors: "#f39c12,#d68910,#ffffff",
                        scale: 0.02,
                        svgString: "Semicolon",
                        email: "info@semicolon.academy",
                        phone: "+961 1 890 123",
                        website: "www.semicolon.academy",
                        forceWhiteBack: false,
                        isMetallic: false
                    },
                    {
                        name: "Softavia",
                        description: "Custom software development firm delivering scalable web and mobile solutions.",
                        colors: "#3498db,#2176ae,#ffffff",
                        scale: 0.02,
                        svgString: "Softavia",
                        email: "hr@softavia.com",
                        phone: "+961 1 901 234",
                        website: "www.softavia.com",
                        forceWhiteBack: false,
                        isMetallic: false
                    },
                    {
                        name: "Vanrise",
                        description: "Telecom and enterprise solutions provider specializing in revenue assurance and fraud management.",
                        colors: "#e67e22,#cf6d17,#ffffff",
                        scale: 0.02,
                        svgString: "Vanrise",
                        email: "careers@vanrise.com",
                        phone: "+961 1 012 345",
                        website: "www.vanrise.com",
                        forceWhiteBack: false,
                        isMetallic: true
                    }
                ];

                for (const company of defaults) {
                    await pool.request()
                        .input("name", company.name)
                        .input("description", company.description)
                        .input("colors", company.colors)
                        .input("scale", company.scale)
                        .input("svgString", company.svgString)
                        .input("email", company.email)
                        .input("phone", company.phone)
                        .input("website", company.website)
                        .input("forceWhiteBack", company.forceWhiteBack ? 1 : 0)
                        .input("isMetallic", company.isMetallic ? 1 : 0)
                        .query(`
                            INSERT INTO Companies (name, description, colors, scale, svgString, email, phone, website, forceWhiteBack, isMetallic)
                            VALUES (@name, @description, @colors, @scale, @svgString, @email, @phone, @website, @forceWhiteBack, @isMetallic)
                        `);
                }
                logger.info("Companies table successfully seeded.");
            }
        } catch (err: any) {
            logger.error(`Failed to ensure tables / seed: ${err.message}`);
        }
    }

    /**
     * Get all companies.
     */
    static async getAllCompanies(): Promise<Company[]> {
        await poolConnect;
        const result = await pool.request().query("SELECT * FROM Companies ORDER BY id ASC");
        return result.recordset.map(row => ({
            ...row,
            forceWhiteBack: !!row.forceWhiteBack,
            isMetallic: !!row.isMetallic,
        }));
    }

    /**
     * Add a company (Admin only).
     */
    static async addCompany(company: Omit<Company, "id">): Promise<Company> {
        await poolConnect;
        const result = await pool.request()
            .input("name", company.name)
            .input("description", company.description)
            .input("colors", company.colors)
            .input("scale", company.scale || 0.02)
            .input("svgString", company.svgString)
            .input("email", company.email)
            .input("phone", company.phone)
            .input("website", company.website)
            .input("forceWhiteBack", company.forceWhiteBack ? 1 : 0)
            .input("isMetallic", company.isMetallic ? 1 : 0)
            .query(`
                INSERT INTO Companies (name, description, colors, scale, svgString, email, phone, website, forceWhiteBack, isMetallic)
                OUTPUT INSERTED.*
                VALUES (@name, @description, @colors, @scale, @svgString, @email, @phone, @website, @forceWhiteBack, @isMetallic)
            `);
        const row = result.recordset[0];
        return {
            ...row,
            forceWhiteBack: !!row.forceWhiteBack,
            isMetallic: !!row.isMetallic,
        };
    }

    /**
     * Update a company (Admin only).
     */
    static async updateCompany(id: number, company: Partial<Company>): Promise<Company | null> {
        await poolConnect;
        
        let updateQuery = "UPDATE Companies SET ";
        const request = pool.request().input("id", id);
        const updates: string[] = [];

        if (company.name !== undefined) {
            request.input("name", company.name);
            updates.push("name = @name");
        }
        if (company.description !== undefined) {
            request.input("description", company.description);
            updates.push("description = @description");
        }
        if (company.colors !== undefined) {
            request.input("colors", company.colors);
            updates.push("colors = @colors");
        }
        if (company.scale !== undefined) {
            request.input("scale", company.scale);
            updates.push("scale = @scale");
        }
        if (company.svgString !== undefined) {
            request.input("svgString", company.svgString);
            updates.push("svgString = @svgString");
        }
        if (company.email !== undefined) {
            request.input("email", company.email);
            updates.push("email = @email");
        }
        if (company.phone !== undefined) {
            request.input("phone", company.phone);
            updates.push("phone = @phone");
        }
        if (company.website !== undefined) {
            request.input("website", company.website);
            updates.push("website = @website");
        }
        if (company.forceWhiteBack !== undefined) {
            request.input("forceWhiteBack", company.forceWhiteBack ? 1 : 0);
            updates.push("forceWhiteBack = @forceWhiteBack");
        }
        if (company.isMetallic !== undefined) {
            request.input("isMetallic", company.isMetallic ? 1 : 0);
            updates.push("isMetallic = @isMetallic");
        }

        if (updates.length === 0) return null;

        updateQuery += updates.join(", ") + " OUTPUT INSERTED.* WHERE id = @id";
        const result = await request.query(updateQuery);
        const row = result.recordset[0];
        if (!row) return null;
        return {
            ...row,
            forceWhiteBack: !!row.forceWhiteBack,
            isMetallic: !!row.isMetallic,
        };
    }

    /**
     * Delete a company (Admin only).
     */
    static async deleteCompany(id: number): Promise<boolean> {
        await poolConnect;
        const result = await pool.request()
            .input("id", id)
            .query("DELETE FROM Companies WHERE id = @id");
        return (result.rowsAffected[0] || 0) > 0;
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
     * Delete any review by id (Admin moderation bypass).
     */
    static async deleteReviewAdmin(reviewId: number): Promise<boolean> {
        await poolConnect;
        const result = await pool.request()
            .input("id", reviewId)
            .query(`DELETE FROM InternshipReviews WHERE id = @id`);
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