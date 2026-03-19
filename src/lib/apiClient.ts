export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Shared refresh promise to prevent concurrent token refresh race condition
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const refreshJson = await refreshRes.json();
    if (refreshRes.ok && refreshJson.success) {
      localStorage.setItem("access_token", refreshJson.access_token);
      return refreshJson.access_token;
    }
  } catch {}

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  return null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });

  // Attempt token refresh on 401 (with shared lock to prevent race condition)
  if (res.status === 401 && typeof window !== "undefined") {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
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
    throw new ApiError((json?.message as string) || `Request failed (${res.status})`, res.status);
  }

  return json as T;
}
