import { apiFetch } from "../utils/api";

/**
 * MuChat API Service
 * Handles all communication between the Chatbot UI and the backend.
 */

const ANON_SESSIONS_KEY = "mugate_anon_sessions";

// ─── Anonymous Session Persistence ────────────────────────
const getStoredAnonSessionIds = () => {
    try {
        const stored = localStorage.getItem(ANON_SESSIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
};

const storeAnonSessionId = (sessionId) => {
    const ids = getStoredAnonSessionIds();
    if (!ids.includes(sessionId)) {
        ids.unshift(sessionId); // newest first
        // Keep max 20 anonymous sessions
        if (ids.length > 20) ids.length = 20;
        localStorage.setItem(ANON_SESSIONS_KEY, JSON.stringify(ids));
    }
};

const removeAnonSessionId = (sessionId) => {
    const ids = getStoredAnonSessionIds().filter(id => id !== sessionId);
    localStorage.setItem(ANON_SESSIONS_KEY, JSON.stringify(ids));
};

// ─── API Methods ──────────────────────────────────────────

export const createSession = async (title, source = "chat") => {
    const data = await apiFetch("/chatbot/sessions", {
        method: "POST",
        body: JSON.stringify({ title, source }),
    });
    const session = data.session;

    // Only MuChat sessions are tracked for anonymous recovery; Resume Enhancer
    // sessions must never appear in the chatbot history.
    if (source === "chat" && !localStorage.getItem("mugate_token")) {
        storeAnonSessionId(session.id);
    }

    return session;
};

export const getSessions = async () => {
    const token = localStorage.getItem("mugate_token");

    if (token) {
        // Authenticated user — backend uses userId
        const data = await apiFetch("/chatbot/sessions");
        return data.sessions || [];
    }

    // Anonymous — send stored session IDs to backend for recovery
    const anonIds = getStoredAnonSessionIds();
    if (anonIds.length === 0) return [];

    const data = await apiFetch(`/chatbot/sessions?ids=${anonIds.join(",")}`);
    return data.sessions || [];
};

export const sendMessage = async (sessionId, content, reasoning = false) => {
    const data = await apiFetch("/chatbot/message", {
        method: "POST",
        body: JSON.stringify({ sessionId, content, reasoning }),
    });
    return data; // { success, text, tokensUsed }
};

export const uploadFile = async (sessionId, file, prompt = "") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    if (prompt) formData.append("prompt", prompt);

    const data = await apiFetch("/chatbot/upload", {
        method: "POST",
        body: formData,
    });
    return data; // { success, text, tokensUsed, attachment }
};

export const enhancePrompt = async (prompt) => {
    const data = await apiFetch("/chatbot/enhance-prompt", {
        method: "POST",
        body: JSON.stringify({ prompt }),
    });
    return data; // { success, enhancedPrompt, tokensUsed }
};

export const getSessionMessages = async (sessionId) => {
    const data = await apiFetch(`/chatbot/sessions/${sessionId}/messages`);
    if (data.success && data.messages) {
        return data.messages;
    }
    return [];
};

export const deleteSession = async (sessionId) => {
    const data = await apiFetch(`/chatbot/sessions/${sessionId}`, {
        method: "DELETE",
    });

    // Also remove from anonymous storage
    removeAnonSessionId(sessionId);

    return data;
};
