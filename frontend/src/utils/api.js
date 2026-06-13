// Single source of truth for the backend base URL — import this instead of
// hardcoding "http://localhost:5000" anywhere else.
export const API_BASE_URL = "http://localhost:5000/api";

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
            if (response.status === 401 || response.status === 403) {
                // Automatically handle token expiration/invalid token
                localStorage.removeItem("mugate_token");
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
