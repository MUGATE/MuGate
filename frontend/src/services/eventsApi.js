import { apiFetch } from "../utils/api";

/**
 * Events API Service
 * Handles communication between the Events UI and the backend.
 */

/**
 * Get upcoming events with optional filters.
 * @param {Object} filters - { search, category, location, limit, offset }
 * @returns {Promise<Array>} events
 */
export const getUpcomingEvents = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.category) params.append("category", filters.category);
    if (filters.location) params.append("location", filters.location);
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.offset) params.append("offset", String(filters.offset));

    const queryString = params.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ""}`;

    const data = await apiFetch(endpoint);
    return data.data || [];
};

/**
 * Get a single event by ID.
 * @param {number} id
 * @returns {Promise<Object|null>} event
 */
export const getEventById = async (id) => {
    const data = await apiFetch(`/events/${id}`);
    return data.data || null;
};

/**
 * Get distinct categories that have upcoming events.
 * @returns {Promise<Array<string>>} categories
 */
export const getEventCategories = async () => {
    const data = await apiFetch("/events/categories");
    return data.data || [];
};

/**
 * Get event statistics (counts by category and source).
 * @returns {Promise<Object>} { totalUpcoming, byCategory, bySource }
 */
export const getEventStats = async () => {
    const data = await apiFetch("/events/stats");
    return data.data || { totalUpcoming: 0, byCategory: [], bySource: [] };
};

/**
 * Trigger a scrape-and-persist cycle on the backend.
 * Scrapes events from all configured sources and saves to DB.
 * @returns {Promise<Object>} scrape result with stats
 */
export const triggerEventScrape = async () => {
    const data = await apiFetch("/events/scrape", {
        method: "POST",
    });
    return data.data || {};
};

/**
 * Add a manual event (admin only).
 */
export const addManualEvent = async (eventData) => {
    const data = await apiFetch("/events", {
        method: "POST",
        body: JSON.stringify(eventData),
    });
    return data.data;
};

/**
 * Update a manual event (admin only).
 */
export const updateManualEvent = async (id, eventData) => {
    const data = await apiFetch(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(eventData),
    });
    return data.data;
};

/**
 * Delete a manual event (admin only).
 */
export const deleteManualEvent = async (id) => {
    const data = await apiFetch(`/events/${id}`, {
        method: "DELETE",
    });
    return data;
};