const DEFAULT_PORT = "5000";

function resolveApiBaseUrl() {
    const explicit = import.meta.env.VITE_API_BASE_URL;
    if (explicit && typeof explicit === "string") return explicit;

    if (typeof window === "undefined") {
        return `http://localhost:${DEFAULT_PORT}/api`;
    }

    const { protocol, hostname } = window.location;
    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
        return `http://localhost:${DEFAULT_PORT}/api`;
    }

    return `${protocol}//${hostname}:${DEFAULT_PORT}/api`;
}

// Single source of truth for the backend base URL — import this instead of
// hardcoding "http://localhost:5000" anywhere else.
export const API_BASE_URL = resolveApiBaseUrl();

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem("mugate_token");

        // Set default headers — skip Content-Type for FormData (browser sets it with boundary)
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Token missing/expired/invalid — force re-login
                localStorage.removeItem("mugate_token");
                localStorage.removeItem("mugate_user");
                window.location.href = "/";
                throw new Error("Authentication failed. Please login again.");
            }
            throw new Error(data.message || `API request failed with status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};
