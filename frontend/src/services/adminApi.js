import { apiFetch } from "../utils/api";

/**
 * Admin Management API Service
 */

export const getAdmins = async () => {
    const data = await apiFetch("/auth/admins");
    return data.admins || [];
};

/** Check if the currently logged-in user has admin privileges (DB live check). */
export const checkMyAdminStatus = async () => {
    const data = await apiFetch("/auth/me/is-admin");
    return data.isAdmin === true;
};

export const addAdmin = async (universityId) => {
    const data = await apiFetch("/auth/admins", {
        method: "POST",
        body: JSON.stringify({ universityId }),
    });
    return data;
};

export const removeAdmin = async (universityId) => {
    const data = await apiFetch(`/auth/admins/${universityId}`, {
        method: "DELETE",
    });
    return data;
};
