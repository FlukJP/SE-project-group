import { CLIENT_ENV as ENV } from "@/src/config/env.client";

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
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const clearAccessToken = () => {
    accessToken = null;
};

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
 * Attempts to obtain a new access token using the HttpOnly refresh-token cookie.
 * Clears the in-memory access token and dispatches session:expired if the refresh fails.
 */
async function refreshAccessToken(): Promise<string | null> {
    if (typeof window === "undefined") {
        dispatchSessionExpired();
        return null;
    }

    try {
        const res = await fetch(`${BASE}/api/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const json = await res.json();

        if (res.ok && json.success) {
            const newToken = json.access_token as string;
            setAccessToken(newToken);
            return newToken;
        }
    } catch (err) {
        console.error("[apiClient] Token refresh network error:", err);
    }

    clearAccessToken();
    dispatchSessionExpired();
    return null;
}

export const restoreSession = async (): Promise<string | null> => refreshAccessToken();

type ApiFetchOptions = RequestInit & {
    skipAuthRefresh?: boolean;
};

// CORE FETCH
/**
 * Sends an authenticated HTTP request to the API and returns the parsed response.
 * Automatically retries once with a refreshed access token on a 401 Unauthorized response.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const token = getAccessToken();
    const { skipAuthRefresh = false, ...requestOptions } = options;

    const headers: Record<string, string> = {
        ...(requestOptions.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData; the browser sets it with boundary automatically.
    if (!(requestOptions.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await fetch(`${BASE}/api${path}`, {
        ...requestOptions,
        headers,
        credentials: "include",
    });

    // 401 -> attempt token refresh once
    if (res.status === 401 && typeof window !== "undefined" && !skipAuthRefresh) {
        if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;

        if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
            res = await fetch(`${BASE}/api${path}`, {
                ...requestOptions,
                headers,
                credentials: "include",
            });
        } else {
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
