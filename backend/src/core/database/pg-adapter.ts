/**
 * Thin mssql-compatible adapter over node-pg for Supabase Postgres.
 * Preserves pool.request().input().query() / recordset / rowsAffected / Transaction.
 */
import { Pool, PoolClient, QueryResult } from "pg";
import { pgConfig } from "../../config/database.config";

/** Tables created with quoted PascalCase names on Supabase */
const QUOTED_TABLES = [
    "Users",
    "PortalCredentials",
    "Courses",
    "CourseSections",
    "AcademicHistory",
    "Schedules",
    "ScheduleSections",
    "Sessions",
    "ChatSessions",
    "ChatMessages",
    "ChatAnalytics",
    "Admins",
    "KnowledgePages",
    "KnowledgeChunks",
    "ScraperRuns",
    "ScrapeQueue",
    "CapstonePartners",
    "CapstoneIdeas",
    "Companies",
    "InternshipReviews",
    "Events",
    "UserRoadmap",
];

/** CamelCase columns that must stay quoted */
const QUOTED_COLUMNS = [
    "passwordHash",
    "universityId",
    "gpaUpdatedAt",
    "lastActiveAt",
    "createdAt",
    "updatedAt",
    "userId",
    "encryptedUsername",
    "encryptedPassword",
    "courseCode",
    "courseName",
    "courseId",
    "sectionNumber",
    "startTime",
    "endTime",
    "syncedAt",
    "meetings",
    "isElective",
    "totalCredits",
    "scheduleId",
    "sectionId",
    "expiresAt",
    "isPinned",
    "isActive",
    "sessionId",
    "tokensUsed",
    "questionCategory",
    "isFailed",
    "responseTimeMs",
    "contentHash",
    "wordCount",
    "sourceDomain",
    "lastScrapedAt",
    "pageId",
    "chunkIndex",
    "entityType",
    "chromaSyncedAt",
    "embeddingModel",
    "runType",
    "baseUrl",
    "pagesScraped",
    "pagesUpdated",
    "pagesNew",
    "pagesUnchanged",
    "errorCount",
    "errorDetails",
    "startedAt",
    "completedAt",
    "runId",
    "userName",
    "lookingFor",
    "companyId",
    "avgRating",
    "reviewCount",
    "latestFeedback",
    "startDate",
    "endDate",
    "imageUrl",
    "externalUrl",
    "sourceId",
    "scraperSource",
    "isFree",
    "createdBy",
    "forceWhiteBack",
    "forceBlackBack",
    "isMetallic",
    "svgString",
];

const IDENTIFIERS = [...new Set([...QUOTED_TABLES, ...QUOTED_COLUMNS])].sort(
    (a, b) => b.length - a.length
);

export type QueryResultShape = {
    recordset: any[];
    rowsAffected: number[];
    recordsets: any[][];
};

const BOOL_COLUMNS =
    "isActive|isPinned|isElective|isFailed|isFree|isMetallic|forceWhiteBack|forceBlackBack";

export function normalizeSql(sqlText: string): string {
    let sql = sqlText;

    sql = sql.replace(
        /DATEADD\s*\(\s*DAY\s*,\s*(-?\d+)\s*,\s*GETDATE\s*\(\s*\)\s*\)/gi,
        (_m, days: string) => `(NOW() + (${days}) * INTERVAL '1 day')`
    );
    sql = sql.replace(/\bGETDATE\s*\(\s*\)/gi, "NOW()");
    sql = sql.replace(
        /CAST\s*\(\s*([^)]+?)\s+AS\s+NVARCHAR\s*\(\s*\d+\s*\)\s*\)/gi,
        "CAST($1 AS TEXT)"
    );
    // boolean = 1/0 → TRUE/FALSE (Postgres rejects boolean = integer)
    sql = sql.replace(
        new RegExp(`\\b(${BOOL_COLUMNS})\\s*=\\s*1\\b`, "gi"),
        "$1 = TRUE"
    );
    sql = sql.replace(
        new RegExp(`\\b(${BOOL_COLUMNS})\\s*=\\s*0\\b`, "gi"),
        "$1 = FALSE"
    );
    sql = sql.replace(
        new RegExp(`\\b(${BOOL_COLUMNS})\\s*!=\\s*1\\b`, "gi"),
        "$1 IS NOT TRUE"
    );
    sql = sql.replace(
        new RegExp(`\\b(${BOOL_COLUMNS})\\s*!=\\s*0\\b`, "gi"),
        "$1 IS TRUE"
    );

    return quoteIdentifiers(sql);
}

function quoteIdentifiers(sql: string): string {
    const parts = sql.split(/('(?:[^']|'')*')/);
    for (let i = 0; i < parts.length; i += 2) {
        let chunk = parts[i];
        for (const id of IDENTIFIERS) {
            // Do not quote @named params (e.g. @svgString) or already-quoted ids
            const re = new RegExp(`(?<![@"])\\b${id}\\b(?!")`, "g");
            chunk = chunk.replace(re, `"${id}"`);
        }
        parts[i] = chunk;
    }
    return parts.join("");
}

function toPositional(
    sqlText: string,
    inputs: Record<string, any>
): { text: string; values: any[] } {
    const nameToIndex = new Map<string, number>();
    const values: any[] = [];

    const text = sqlText.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name: string) => {
        if (!Object.prototype.hasOwnProperty.call(inputs, name)) {
            return `@${name}`;
        }
        let idx = nameToIndex.get(name);
        if (idx === undefined) {
            values.push(inputs[name]);
            idx = values.length;
            nameToIndex.set(name, idx);
        }
        return `$${idx}`;
    });

    return { text, values };
}

function shapeResult(result: QueryResult): QueryResultShape {
    const rows = result.rows || [];
    const rowCount = result.rowCount ?? rows.length;
    return {
        recordset: rows,
        rowsAffected: [rowCount],
        recordsets: [rows],
    };
}

type QueryRunner = {
    query: (text: string, values?: any[]) => Promise<QueryResult>;
};

export class PgRequest {
    private inputs: Record<string, any> = {};

    constructor(private readonly runner: QueryRunner) {}

    input(name: string, valueOrType?: any, maybeValue?: any): this {
        let value = maybeValue !== undefined ? maybeValue : valueOrType;
        // Coerce 0/1 → boolean for known flag columns
        if (
            /^(isActive|isPinned|isElective|isFailed|isFree|isMetallic|forceWhiteBack|forceBlackBack)$/i.test(
                name
            ) &&
            (value === 0 || value === 1)
        ) {
            value = value === 1;
        }
        this.inputs[name] = value;
        return this;
    }

    async query(sqlText: string): Promise<QueryResultShape> {
        const normalized = normalizeSql(sqlText);
        const { text, values } = toPositional(normalized, this.inputs);
        const result = await this.runner.query(text, values);
        return shapeResult(result);
    }
}

export class PgTransaction {
    private client: PoolClient | null = null;

    constructor(private readonly pool: Pool) {}

    async begin(): Promise<void> {
        this.client = await this.pool.connect();
        await this.client.query("BEGIN");
    }

    request(): PgRequest {
        if (!this.client) {
            throw new Error("Transaction has not been started");
        }
        const client = this.client;
        return new PgRequest({
            query: (text, values) => client.query(text, values),
        });
    }

    /** Used by `new Request(transaction)` to share the same client */
    getClient(): PoolClient {
        if (!this.client) {
            throw new Error("Transaction has not been started");
        }
        return this.client;
    }

    async commit(): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.query("COMMIT");
        } finally {
            this.client.release();
            this.client = null;
        }
    }

    async rollback(): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.query("ROLLBACK");
        } finally {
            this.client.release();
            this.client = null;
        }
    }
}

export class PgPoolFacade {
    constructor(private readonly pool: Pool) {}

    request(): PgRequest {
        return new PgRequest({
            query: (text, values) => this.pool.query(text, values),
        });
    }

    get native(): Pool {
        return this.pool;
    }

    async connect(): Promise<this> {
        const client = await this.pool.connect();
        client.release();
        return this;
    }

    async end(): Promise<void> {
        await this.pool.end();
    }
}

export function createPgPool(): PgPoolFacade {
    // node-pg returns int8/numeric as strings by default — coerce for mssql-like number compares
    const types = require("pg").types as typeof import("pg").types;
    types.setTypeParser(20, (val: string) => parseInt(val, 10)); // int8
    types.setTypeParser(1700, (val: string) => parseFloat(val)); // numeric
    return new PgPoolFacade(new Pool(pgConfig));
}

/** Drop-in constructors matching `mssql` Transaction / Request usage */
export const PgSql = {
    Transaction: class extends PgTransaction {
        constructor(poolFacade: PgPoolFacade | Pool) {
            const native =
                poolFacade instanceof PgPoolFacade ? poolFacade.native : poolFacade;
            super(native);
        }
    },
    Request: class extends PgRequest {
        constructor(transaction: PgTransaction) {
            const client = transaction.getClient();
            super({
                query: (text, values) => client.query(text, values),
            });
        }
    },
};
