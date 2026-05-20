import { apiFetch } from "../utils/api";

/**
 * Internship Reviews API Service
 * Handles communication between the Internship UI and the backend.
 */

/**
 * Get all reviews for a specific company.
 * @param {number} companyId
 * @returns {Promise<Array>} reviews
 */
export const getCompanyReviews = async (companyId) => {
    const data = await apiFetch(`/internships/reviews/${companyId}`);
    return data.reviews || [];
};

/**
 * Get aggregated stats (avgRating, reviewCount) for all companies.
 * @returns {Promise<Array>} stats array with { companyId, avgRating, reviewCount }
 */
export const getCompanyStats = async () => {
    const data = await apiFetch("/internships/stats");
    return data.stats || [];
};

/**
 * Submit a review for a company. Requires authentication.
 * @param {number} companyId
 * @param {number} rating - 1 to 5
 * @param {string} feedback
 * @returns {Promise<Object>} the created review
 */
export const submitReview = async (companyId, rating, feedback) => {
    const data = await apiFetch(`/internships/reviews/${companyId}`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback }),
    });
    return data;
};

/**
 * Update own review. Requires authentication.
 * @param {number} reviewId
 * @param {number} rating - 1 to 5
 * @param {string} feedback
 * @returns {Promise<Object>} the updated review
 */
export const updateReview = async (reviewId, rating, feedback) => {
    const data = await apiFetch(`/internships/reviews/${reviewId}`, {
        method: "PUT",
        body: JSON.stringify({ rating, feedback }),
    });
    return data;
};

/**
 * Delete own review.
 * @param {number} reviewId
 * @returns {Promise<Object>}
 */
export const deleteReview = async (reviewId) => {
    const data = await apiFetch(`/internships/reviews/${reviewId}`, {
        method: "DELETE",
    });
    return data;
};

/**
 * Get all companies.
 * @returns {Promise<Array>} companies
 */
export const getCompanies = async () => {
    const data = await apiFetch("/internships/companies");
    return data.companies || [];
};

/**
 * Add a new company. Requires Admin privileges.
 * @param {Object} company
 * @returns {Promise<Object>} the created company
 */
export const addCompany = async (company) => {
    const data = await apiFetch("/internships/companies", {
        method: "POST",
        body: JSON.stringify(company),
    });
    return data.company;
};

/**
 * Update an existing company. Requires Admin privileges.
 * @param {number} id
 * @param {Object} company
 * @returns {Promise<Object>} the updated company
 */
export const updateCompany = async (id, company) => {
    const data = await apiFetch(`/internships/companies/${id}`, {
        method: "PUT",
        body: JSON.stringify(company),
    });
    return data.company;
};

/**
 * Delete an existing company. Requires Admin privileges.
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteCompany = async (id) => {
    const data = await apiFetch(`/internships/companies/${id}`, {
        method: "DELETE",
    });
    return data;
};