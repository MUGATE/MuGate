import { apiFetch } from "../utils/api";

/**
 * Admin Management API Service
 */

export const getAdmins = async () => {
    const data = await apiFetch("/auth/admins");
    return data.admins || [];
};

export const getRegisteredUsers = async () => {
    const data = await apiFetch("/auth/users");
    return data.users || [];
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
