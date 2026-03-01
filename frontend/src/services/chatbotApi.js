import { apiFetch } from "../utils/api";

/**
 * MuChat API Service
 * Handles all communication between the Chatbot UI and the backend.
 */

export const createSession = async (title) => {
    const data = await apiFetch("/chatbot/sessions", {
        method: "POST",
        body: JSON.stringify({ title }),
    });
    return data.session;
};

export const getSessions = async () => {
    const data = await apiFetch("/chatbot/sessions");
    return data.sessions || [];
};

export const sendMessage = async (sessionId, content) => {
    const data = await apiFetch("/chatbot/message", {
        method: "POST",
        body: JSON.stringify({ sessionId, content }),
    });
    return data; // { success, text, tokensUsed }
};

export const deleteSession = async (sessionId) => {
    const data = await apiFetch(`/chatbot/sessions/${sessionId}`, {
        method: "DELETE",
    });
    return data;
};
