import { pool, poolConnect } from "../../core/database/connection";
import { logger } from "../../core/logger/logger";
import { Event, EventCategory, EventFilters, ScrapedEvent, ScraperSource } from "./event.types";

// ─── Repository ───────────────────────────────────────────

export class EventRepository {

    /**
     * Ensure the Events table exists. Called once at startup.
     */
    static async ensureTable(): Promise<void> {
        try {
            await poolConnect;
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Events' AND xtype='U')
                CREATE TABLE Events (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    title NVARCHAR(500) NOT NULL,
                    description NVARCHAR(MAX) NOT NULL DEFAULT '',
                    location NVARCHAR(500) NOT NULL DEFAULT '',
                    startDate DATETIME2 NOT NULL,
                    endDate DATETIME2 NULL,
                    category NVARCHAR(50) NOT NULL DEFAULT 'other',
                    tags NVARCHAR(MAX) NOT NULL DEFAULT '',
                    imageUrl NVARCHAR(1000) NOT NULL DEFAULT '',
                    externalUrl NVARCHAR(1000) NOT NULL DEFAULT '',
                    source NVARCHAR(50) NOT NULL DEFAULT 'scraped',
                    sourceId NVARCHAR(500) NOT NULL DEFAULT '',
                    scraperSource NVARCHAR(50) NOT NULL DEFAULT 'other',
                    organizer NVARCHAR(255) NOT NULL DEFAULT '',
                    isFree BIT NOT NULL DEFAULT 1,
                    isActive BIT NOT NULL DEFAULT 1,
                    createdBy NVARCHAR(255) NOT NULL DEFAULT '',
                    createdAt DATETIME2 DEFAULT GETDATE(),
                    updatedAt DATETIME2 DEFAULT GETDATE()
                )
            `);

            // Create index on startDate for fast upcoming queries
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_Events_StartDate' AND object_id = OBJECT_ID('Events'))
                CREATE INDEX IX_Events_StartDate ON Events (startDate ASC) WHERE isActive = 1
            `);

            // Create index on sourceId for fast dedup lookups
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_Events_SourceId' AND object_id = OBJECT_ID('Events'))
                CREATE INDEX IX_Events_SourceId ON Events (scraperSource, sourceId) WHERE sourceId != ''
            `);

            logger.info("Events table ensured.");
        } catch (err: any) {
            logger.error(`Failed to ensure Events table: ${err.message}`);
        }
    }

    // ─── Read Methods ─────────────────────────────────────

    /**
     * Get upcoming events with optional filters.
     * Only returns active events where startDate >= now.
     */
    static async getUpcoming(filters: EventFilters = {}): Promise<Event[]> {
        await poolConnect;
        const { search, category, location, limit = 50, offset = 0 } = filters;

        let whereClause = "WHERE isActive = 1 AND startDate >= GETDATE()";
        const request = pool.request();

        if (search && search.trim().length > 0) {
            whereClause += ` AND (title LIKE @search OR description LIKE @search OR tags LIKE @search OR organizer LIKE @search)`;
            request.input("search", `%${search.trim()}%`);
        }

        if (category && category.trim().length > 0) {
            whereClause += ` AND category = @category`;
            request.input("category", category.trim());
        }

        if (location && location.trim().length > 0) {
            whereClause += ` AND location LIKE @location`;
            request.input("location", `%${location.trim()}%`);
        }

        request.input("limit", limit);
        request.input("offset", offset);

        const result = await request.query(`
            SELECT id, title, description, location, startDate, endDate, category, tags,
                   imageUrl, externalUrl, source, sourceId, scraperSource, organizer,
                   isFree, isActive, createdBy, createdAt, updatedAt
            FROM Events
            ${whereClause}
            ORDER BY startDate ASC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
        return result.recordset;
    }

    /**
     * Get a single event by ID.
     */
    static async getById(id: number): Promise<Event | null> {
        await poolConnect;
        const result = await pool.request()
            .input("id", id)
            .query(`
                SELECT id, title, description, location, startDate, endDate, category, tags,
                       imageUrl, externalUrl, source, sourceId, scraperSource, organizer,
                       isFree, isActive, createdBy, createdAt, updatedAt
                FROM Events
                WHERE id = @id AND isActive = 1
            `);
        return result.recordset[0] || null;
    }

    /**
     * Get distinct categories currently in the DB (only from upcoming active events).
     */
    static async getDistinctCategories(): Promise<string[]> {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT DISTINCT category
            FROM Events
            WHERE isActive = 1 AND startDate >= GETDATE()
            ORDER BY category
        `);
        return result.recordset.map((r: any) => r.category);
    }

    /**
     * Get event stats: total count, category breakdown, source breakdown.
     */
    static async getStats(): Promise<{
        totalUpcoming: number;
        byCategory: { category: string; count: number }[];
        bySource: { scraperSource: string; count: number }[];
    }> {
        await poolConnect;

        const totalResult = await pool.request().query(`
            SELECT COUNT(*) AS cnt FROM Events WHERE isActive = 1 AND startDate >= GETDATE()
        `);

        const categoryResult = await pool.request().query(`
            SELECT category, COUNT(*) AS count
            FROM Events
            WHERE isActive = 1 AND startDate >= GETDATE()
            GROUP BY category
            ORDER BY count DESC
        `);

        const sourceResult = await pool.request().query(`
            SELECT scraperSource, COUNT(*) AS count
            FROM Events
            WHERE isActive = 1 AND startDate >= GETDATE()
            GROUP BY scraperSource
            ORDER BY count DESC
        `);

        return {
            totalUpcoming: totalResult.recordset[0].cnt,
            byCategory: categoryResult.recordset,
            bySource: sourceResult.recordset,
        };
    }

    // ─── Write Methods ────────────────────────────────────

    /**
     * Upsert a scraped event. If sourceId+scraperSource already exists, update it.
     * Otherwise, insert a new row.
     * Returns "new", "updated", or "unchanged".
     */
    static async upsertScrapedEvent(event: ScrapedEvent): Promise<"new" | "updated" | "unchanged"> {
        await poolConnect;

        // Check if event already exists by sourceId + scraperSource
        if (event.sourceId && event.sourceId.length > 0) {
            const existing = await pool.request()
                .input("sourceId", event.sourceId)
                .input("scraperSource", event.scraperSource)
                .query(`
                    SELECT id, title, startDate FROM Events
                    WHERE sourceId = @sourceId AND scraperSource = @scraperSource
                `);

            if (existing.recordset.length > 0) {
                const existingEvent = existing.recordset[0];
                // Update if title or date changed
                const titleChanged = existingEvent.title !== event.title;
                const dateChanged = new Date(existingEvent.startDate).getTime() !== new Date(event.startDate).getTime();

                if (titleChanged || dateChanged) {
                    await pool.request()
                        .input("id", existingEvent.id)
                        .input("title", event.title)
                        .input("description", event.description)
                        .input("location", event.location)
                        .input("startDate", event.startDate)
                        .input("endDate", event.endDate || null)
                        .input("category", event.category)
                        .input("tags", event.tags)
                        .input("imageUrl", event.imageUrl)
                        .input("externalUrl", event.externalUrl)
                        .input("organizer", event.organizer)
                        .input("isFree", event.isFree)
                        .query(`
                            UPDATE Events SET
                                title = @title,
                                description = @description,
                                location = @location,
                                startDate = @startDate,
                                endDate = @endDate,
                                category = @category,
                                tags = @tags,
                                imageUrl = @imageUrl,
                                externalUrl = @externalUrl,
                                organizer = @organizer,
                                isFree = @isFree,
                                isActive = 1,
                                updatedAt = GETDATE()
                            WHERE id = @id
                        `);
                    return "updated";
                }
                return "unchanged";
            }
        }

        // Insert new event
        await pool.request()
            .input("title", event.title)
            .input("description", event.description)
            .input("location", event.location)
            .input("startDate", event.startDate)
            .input("endDate", event.endDate || null)
            .input("category", event.category)
            .input("tags", event.tags)
            .input("imageUrl", event.imageUrl)
            .input("externalUrl", event.externalUrl)
            .input("source", "scraped")
            .input("sourceId", event.sourceId)
            .input("scraperSource", event.scraperSource)
            .input("organizer", event.organizer)
            .input("isFree", event.isFree)
            .query(`
                INSERT INTO Events (title, description, location, startDate, endDate, category, tags,
                    imageUrl, externalUrl, source, sourceId, scraperSource, organizer, isFree)
                VALUES (@title, @description, @location, @startDate, @endDate, @category, @tags,
                    @imageUrl, @externalUrl, @source, @sourceId, @scraperSource, @organizer, @isFree)
            `);
        return "new";
    }

    /**
     * Deactivate past events (cleanup).
     */
    static async deactivatePastEvents(): Promise<number> {
        await poolConnect;
        const result = await pool.request().query(`
            UPDATE Events SET isActive = 0, updatedAt = GETDATE()
            WHERE isActive = 1 AND startDate < DATEADD(DAY, -1, GETDATE())
        `);
        return result.rowsAffected[0] || 0;
    }

    /**
     * Get total count of upcoming active events.
     */
    static async getUpcomingCount(): Promise<number> {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT COUNT(*) AS cnt FROM Events WHERE isActive = 1 AND startDate >= GETDATE()
        `);
        return result.recordset[0].cnt;
    }
}