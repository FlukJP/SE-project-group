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

type MessageMatcher = {
    match: RegExp | string;
    text: string;
};

const THAI_ERROR_MESSAGES: MessageMatcher[] = [
    { match: "Session expired. Please log in again.", text: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง" },
    { match: "Unauthorized", text: "คุณไม่มีสิทธิ์เข้าถึงรายการนี้" },
    { match: "Unauthorized: Please login first", text: "กรุณาเข้าสู่ระบบก่อน" },
    { match: "User not found", text: "ไม่พบผู้ใช้งาน" },
    { match: "Seller not found", text: "ไม่พบข้อมูลผู้ขาย" },
    { match: "Product not found", text: "ไม่พบสินค้า" },
    { match: "Chat room not found", text: "ไม่พบห้องแชท" },
    { match: "All fields are required", text: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" },
    { match: "At least one image is required", text: "กรุณาเพิ่มรูปภาพอย่างน้อย 1 รูป" },
  { match: "Price must be a positive number", text: "ราคาต้องเป็นตัวเลขที่มากกว่า 0" },
  { match: "Price must be a positive number with up to 2 decimal places", text: "ราคาต้องเป็นตัวเลขที่มากกว่า 0 และมีทศนิยมได้ไม่เกิน 2 ตำแหน่ง" },
    { match: "Quantity must be a positive integer", text: "จำนวนสินค้าต้องเป็นเลขจำนวนเต็มที่มากกว่า 0" },
    { match: "Phone number must be 10 digits", text: "เบอร์โทรต้องเป็นตัวเลข 10 หลัก" },
    { match: "No valid fields to update", text: "ไม่พบข้อมูลที่สามารถอัปเดตได้" },
    { match: "The data update failed. Please try again.", text: "อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
    { match: "Invalid image file. File signature does not match allowed types.", text: "ไฟล์รูปภาพไม่ถูกต้อง กรุณาอัปโหลดไฟล์รูปที่รองรับ" },
    { match: "Image file is required", text: "กรุณาเลือกรูปภาพ" },
    { match: "Please add your phone number to your profile before creating a product.", text: "กรุณาเพิ่มเบอร์โทรในโปรไฟล์ก่อนลงขายสินค้า" },
    { match: "Please add your phone number to your profile before updating a product.", text: "กรุณาเพิ่มเบอร์โทรในโปรไฟล์ก่อนแก้ไขสินค้า" },
    { match: "Auto reply is not available yet because the database migration has not been applied.", text: "ฟีเจอร์ข้อความตอบกลับอัตโนมัติยังไม่พร้อมใช้งาน เนื่องจากฐานข้อมูลยังไม่ได้อัปเดต" },
    { match: /Invalid email/i, text: "อีเมลไม่ถูกต้อง" },
    { match: /Invalid OTP/i, text: "รหัส OTP ไม่ถูกต้อง" },
    { match: /Invalid phone/i, text: "เบอร์โทรไม่ถูกต้อง" },
    { match: /Message content is required/i, text: "กรุณากรอกข้อความก่อนส่ง" },
    { match: /Cannot create chat room with yourself/i, text: "ไม่สามารถสร้างห้องแชทกับบัญชีของตัวเองได้" },
    { match: /Unauthorized to access/i, text: "คุณไม่มีสิทธิ์เข้าถึงรายการนี้" },
    { match: /Unauthorized to send message/i, text: "คุณไม่มีสิทธิ์ส่งข้อความในห้องแชทนี้" },
    { match: /Unauthorized to delete/i, text: "คุณไม่มีสิทธิ์ลบรายการนี้" },
];

function translateApiMessage(message: string, status: number): string {
    const normalized = message.trim();
    for (const entry of THAI_ERROR_MESSAGES) {
        if (typeof entry.match === "string" && normalized === entry.match) {
            return entry.text;
        }
        if (entry.match instanceof RegExp && entry.match.test(normalized)) {
            return entry.text;
        }
    }

    if (/Request failed/i.test(normalized)) {
        return `คำขอไม่สำเร็จ (${status})`;
    }

    if (/Invalid response format/i.test(normalized)) {
        return `เซิร์ฟเวอร์ตอบกลับข้อมูลไม่ถูกต้อง (${status})`;
    }

    if (/Server error/i.test(normalized)) {
        return `เซิร์ฟเวอร์เกิดข้อผิดพลาด (${status})`;
    }

    return normalized;
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
            throw new ApiError(translateApiMessage("Session expired. Please log in again.", 401), 401);
        }
    }

    let json: Record<string, unknown>;
    try {
        json = await res.json();
    } catch {
        throw new ApiError(
            translateApiMessage(`Server error (${res.status}): Invalid response format`, res.status),
            res.status
        );
    }

    if (!res.ok || !json.success) {
        const rawMessage = (json?.message as string) || `Request failed (${res.status})`;
        throw new ApiError(
            translateApiMessage(rawMessage, res.status),
            res.status
        );
    }

    return json as T;
}
