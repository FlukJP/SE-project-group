import { ENV } from "@/src/config/clientEnv";

// API_BASE
export const API_BASE = ENV.API_BASE;

if (!API_BASE) {
    console.error(
        "[apiClient] NEXT_PUBLIC_API_URL is not set.\n" +
        "Set it in your deployment environment so the frontend can reach the backend.\n" +
        "All API requests will fail until this is set."
    );
}

const BASE = API_BASE;

// ERROR CLASS
/** Represents an HTTP error response from the API, carrying the status code alongside the message. */
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

// TOKEN REFRESH
/** Shared promise to prevent concurrent token refresh race conditions. */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Dispatch a custom event so AuthContext (or any listener) can react to session expiry.
 * This avoids a hard dependency between apiClient and AuthContext.
 */
const dispatchSessionExpired = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("session:expired"));
    }
};

/**
 * Attempts to obtain a new access token using the stored refresh token.
 * Clears both tokens and dispatches session:expired if the refresh fails.
 */
async function refreshAccessToken(): Promise<string | null> {
    const refreshToken =
        typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refreshToken) {
        dispatchSessionExpired();
        return null;
    }

    try {
        const res = await fetch(`${BASE}/api/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const json = await res.json();

        if (res.ok && json.success) {
            localStorage.setItem("access_token", json.access_token);
            return json.access_token as string;
        }
    } catch (err) {
        console.error("[apiClient] Token refresh network error:", err);
    }

    // Refresh failed — clear session
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    dispatchSessionExpired();
    return null;
}

// CORE FETCH
/**
 * Sends an authenticated HTTP request to the API and returns the parsed response.
 * Automatically retries once with a refreshed access token on a 401 Unauthorized response.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData — browser sets it with boundary automatically
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await fetch(`${BASE}/api${path}`, { ...options, headers });

    // 401 → attempt token refresh once
    if (res.status === 401 && typeof window !== "undefined") {
        if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;

        if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
            res = await fetch(`${BASE}/api${path}`, { ...options, headers });
        } else {
            // Refresh failed — throw immediately instead of retrying with no token
            throw new ApiError("Session expired. Please log in again.", 401);
        }
    }

    let json: Record<string, unknown>;
    try {
        json = await res.json();
    } catch {
        throw new ApiError(
            `Server error (${res.status}): Invalid response format`,
            res.status
        );
    }

    if (!res.ok || !json.success) {
        throw new ApiError(
            (json?.message as string) || `Request failed (${res.status})`,
            res.status
        );
    }

    return json as T;
}
