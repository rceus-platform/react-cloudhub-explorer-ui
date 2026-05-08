/**
 * API Client Module
 *
 * Responsibilities:
 * - Provide a centralized fetch wrapper for backend communication
 * - Handle base URL and common headers
 *
 * Boundaries:
 * - Does not handle specific domain business logic
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Helper to get common headers, including authorization token if available */
const getHeaders = (isFormData: boolean = false): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (!isFormData) headers["Content-Type"] = "application/json";
    
    const token = localStorage.getItem("access_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    return headers;
};

/** Centralized fetch wrapper to ensure consistent API calls */
export const apiClient = {
    /** Perform a GET request */
    get: async <T>(endpoint: string): Promise<T> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: getHeaders(),
        });
        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    /** Perform a POST request */
    post: async <T>(endpoint: string, body: unknown): Promise<T> => {
        const isFormData = body instanceof FormData;
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: "POST",
            headers: getHeaders(isFormData),
            body: isFormData ? (body as FormData) : JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    /** Perform a PATCH request */
    patch: async <T>(endpoint: string, body: unknown): Promise<T> => {
        const isFormData = body instanceof FormData;
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: "PATCH",
            headers: getHeaders(isFormData),
            body: isFormData ? (body as FormData) : JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    /** Perform a DELETE request (with optional JSON body for bulk operations) */
    delete: async <T>(endpoint: string, body?: unknown): Promise<T> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: "DELETE",
            headers: getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    /** Perform a PUT request */
    put: async <T>(endpoint: string, body: unknown): Promise<T> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },
};
