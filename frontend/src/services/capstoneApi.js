import { apiFetch } from "../utils/api";

/**
 * Capstone API Service
 * Handles all communication between the Capstone UI and the backend.
 */

// ─── Partner Methods ──────────────────────────────────────

export const getPartners = async (search = "") => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await apiFetch(`/capstone/partners${query}`);
    return data.partners || [];
};

export const addPartner = async (partnerData) => {
    const data = await apiFetch("/capstone/partners", {
        method: "POST",
        body: JSON.stringify(partnerData),
    });
    return data;
};

export const deletePartner = async (partnerId) => {
    const data = await apiFetch(`/capstone/partners/${partnerId}`, {
        method: "DELETE",
    });
    return data;
};

// ─── Ideas Methods ────────────────────────────────────────

export const getIdeas = async (search = "", faculty = "") => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (faculty) params.set("faculty", faculty);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch(`/capstone/ideas${query}`);
    return data.ideas || [];
};

export const getFaculties = async () => {
    const data = await apiFetch("/capstone/ideas/faculties");
    return data.faculties || [];
};

// ─── AI Chat Method ───────────────────────────────────────

export const chatWithAI = async (message, history = []) => {
    const data = await apiFetch("/capstone/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
    });
    return data; // { success, text, tokensUsed, ideasUsed }
};