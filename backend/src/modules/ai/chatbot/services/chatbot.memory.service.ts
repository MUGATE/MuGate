import { pool } from "../../../../core/database/connection";
import { ChatSession } from "../models/chat-session.model";
import { ChatMessage } from "../models/chat-message.model";

const MAX_SESSIONS_PER_USER = 5;

export class ChatbotMemoryService {

    /**
     * Creates a new chat session. Enforces session slot limits.
     * If limit is reached, auto-deletes the oldest unpinned session.
     */
    static async createSession(userId: string | null, title?: string, isPinned: boolean = false): Promise<ChatSession> {

        // If authenticated user, check limits
        if (userId) {
            const sessionsCountResult = await pool.request()
                .input("userId", userId)
                .query("SELECT COUNT(*) as count FROM ChatSessions WHERE userId = @userId AND isActive = 1");

            const count = sessionsCountResult.recordset[0].count;

            if (count >= MAX_SESSIONS_PER_USER) {
                // Find oldest unpinned session to delete (or mark inactive)
                const oldestResult = await pool.request()
                    .input("userId", userId)
                    .query(`
                        SELECT TOP 1 id FROM ChatSessions 
                        WHERE userId = @userId AND isPinned = 0 AND isActive = 1 
                        ORDER BY updatedAt ASC
                    `);

                if (oldestResult.recordset.length === 0) {
                    throw new Error("Maximum session slot limit reached. All current sessions are pinned. Please unpin or delete a session first.");
                }

                const oldestSessionId = oldestResult.recordset[0].id;
                await this.deleteSession(oldestSessionId);
            }
        }

        const insertResult = await pool.request()
            .input("userId", userId)
            .input("title", title || "New Chat")
            .input("isPinned", isPinned ? 1 : 0)
            .query(`
                INSERT INTO ChatSessions (userId, title, isPinned)
                OUTPUT INSERTED.*
                VALUES (@userId, @title, @isPinned)
            `);

        return insertResult.recordset[0];
    }

    /**
     * Gets all active sessions for a user
     */
    static async getSessions(userId: string): Promise<ChatSession[]> {
        const result = await pool.request()
            .input("userId", userId)
            .query("SELECT * FROM ChatSessions WHERE userId = @userId AND isActive = 1 ORDER BY isPinned DESC, updatedAt DESC");
        return result.recordset;
    }

    /**
     * Gets the chat history parameters for a specific session
     */
    static async getSessionHistory(sessionId: string, userId: string | null): Promise<ChatMessage[]> {
        // Validate ownership first
        const sessionResult = await pool.request()
            .input("sessionId", sessionId)
            .query("SELECT userId FROM ChatSessions WHERE id = @sessionId AND isActive = 1");

        if (sessionResult.recordset.length === 0) {
            throw new Error("Chat session not found.");
        }

        const session = sessionResult.recordset[0];
        // Enforce ownership unless it's a public session (userId is null and checking against a null logged-in user)
        // Adjust logic if public sessions are tracked locally via cookies instead in actual DB.
        // Assuming public sessions pass a specific temporary UUID or are blocked from retrieval.
        if (session.userId && session.userId !== userId) {
            throw new Error("Unauthorized to access this session.");
        }

        const historyResult = await pool.request()
            .input("sessionId", sessionId)
            .query("SELECT * FROM ChatMessages WHERE sessionId = @sessionId ORDER BY createdAt ASC");

        return historyResult.recordset;
    }

    /**
     * Saves a new message to the history
     */
    static async saveMessage(sessionId: string, role: string, content: string, tokensUsed: number = 0): Promise<ChatMessage> {
        const result = await pool.request()
            .input("sessionId", sessionId)
            .input("role", role)
            .input("content", content)
            .input("tokensUsed", tokensUsed)
            .query(`
                INSERT INTO ChatMessages (sessionId, role, content, tokensUsed)
                OUTPUT INSERTED.*
                VALUES (@sessionId, @role, @content, @tokensUsed)
            `);

        // Update session updatedAt timestamp
        await pool.request()
            .input("sessionId", sessionId)
            .query("UPDATE ChatSessions SET updatedAt = GETDATE() WHERE id = @sessionId");

        // Auto-title: if this is the first user message, update the session title
        if (role === "user") {
            try {
                const msgCount = await pool.request()
                    .input("sessionId", sessionId)
                    .query("SELECT COUNT(*) as cnt FROM ChatMessages WHERE sessionId = @sessionId AND role = 'user'");
                if (msgCount.recordset[0].cnt === 1) {
                    // First user message — use it as the session title
                    const title = content.length > 60 ? content.substring(0, 57) + "..." : content;
                    await pool.request()
                        .input("sessionId", sessionId)
                        .input("title", title)
                        .query("UPDATE ChatSessions SET title = @title WHERE id = @sessionId");
                }
            } catch { /* non-critical */ }
        }

        return result.recordset[0];
    }

    /**
     * Gets sessions by a list of IDs (for anonymous session recovery)
     */
    static async getSessionsByIds(sessionIds: string[]): Promise<ChatSession[]> {
        if (!sessionIds || sessionIds.length === 0) return [];
        // Build parameterized IN clause
        const params: string[] = [];
        const request = pool.request();
        sessionIds.forEach((id, i) => {
            const paramName = `id${i}`;
            request.input(paramName, id);
            params.push(`@${paramName}`);
        });
        const result = await request.query(
            `SELECT * FROM ChatSessions WHERE id IN (${params.join(",")}) AND isActive = 1 ORDER BY isPinned DESC, updatedAt DESC`
        );
        return result.recordset;
    }

    /**
     * Deletes (soft deletes) a session
     */
    static async deleteSession(sessionId: string): Promise<void> {
        // We actually hard delete here based on strict requirements or soft delete if prefered.
        // We will hard delete cascading over chat messages.
        await pool.request()
            .input("sessionId", sessionId)
            .query("DELETE FROM ChatSessions WHERE id = @sessionId");
    }
}
