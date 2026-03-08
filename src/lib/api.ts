export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import type { ProductWithSeller, Product } from "@/src/types/Product";
import type { User } from "@/src/types/User";
import type { Report } from "@/src/types/Report";
import type { ChatRoomWithPartner, Chat } from "@/src/types/Chat";
import type { MessageWithSender } from "@/src/types/Messages";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Fix #11: Shared refresh promise to prevent concurrent token refresh race condition
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

  let res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

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

export const productApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return apiFetch<{ success: boolean; data: ProductWithSeller[] }>(
      `/products${qs}`
    );
  },
  getById: (id: string | number) =>
    apiFetch<{ success: boolean; data: ProductWithSeller }>(
      `/products/${id}`
    ),
  getBySeller: (sellerId: number) =>
    apiFetch<{ success: boolean; data: ProductWithSeller[] }>(
      `/products/seller/${sellerId}`
    ),
  create: (formData: FormData) =>
    apiFetch<{ success: boolean; product: Product }>(
      "/products",
      { method: "POST", body: formData }
    ),
  update: (id: string | number, formData: FormData) =>
    apiFetch<{ success: boolean; message: string }>(
      `/products/${id}`,
      { method: "PUT", body: formData }
    ),
  deleteById: (id: string | number) =>
    apiFetch<{ success: boolean; message: string }>(
      `/products/${id}`,
      { method: "DELETE" }
    ),
};

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{
      success: boolean;
      access_token: string;
      refresh_token: string;
      user: User;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { username: string; email: string; password: string; phone: string }) =>
    apiFetch<{ success: boolean; userId: number }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () =>
    apiFetch<{ success: boolean }>("/auth/logout", { method: "POST" }),
  requestOTP: (email: string) =>
    apiFetch<{ success: boolean; message: string }>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyOTP: (email: string, otp: string) =>
    apiFetch<{ success: boolean; access_token: string; refresh_token: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),
  requestPhoneOTP: (phone: string) =>
    apiFetch<{ success: boolean; message: string }>("/auth/request-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  verifyPhoneOTP: (phone: string, otp: string) =>
    apiFetch<{ success: boolean; access_token: string; refresh_token: string }>("/auth/verify-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }),
};

export const userApi = {
  getMe: () =>
    apiFetch<{ success: boolean; data: User }>("/users/me"),
  getById: (id: number | string) =>
    apiFetch<{ success: boolean; data: User }>(`/users/${id}`),
  updateMe: (data: Record<string, unknown>) =>
    apiFetch<{ success: boolean }>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export interface CategoryData {
  Category_ID: number;
  category_key: string;
  name: string;
  emoji: string;
  is_active: boolean;
  sort_order: number;
}

export interface PopularCategoryData {
  category_key: string;
  name: string;
  emoji: string;
  score: number;
}

export const categoryApi = {
  list: () =>
    apiFetch<{ success: boolean; data: CategoryData[] }>("/categories"),
  popular: (limit = 10) =>
    apiFetch<{ success: boolean; data: PopularCategoryData[] }>(`/categories/popular?limit=${limit}`),
  create: (data: { category_key: string; name: string; emoji: string; sort_order?: number }) =>
    apiFetch<{ success: boolean; data: CategoryData }>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<{ category_key: string; name: string; emoji: string; sort_order: number }>) =>
    apiFetch<{ success: boolean; data: CategoryData }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: "DELETE",
    }),
};

export interface ReviewData {
  Review_ID: number;
  Order_ID: number;
  Reviewer_ID: number;
  Seller_ID: number;
  Rating: number;
  Comment: string | null;
  Created_at: string;
  ReviewerName?: string;
  ProductTitle?: string;
}

export interface SellerRatingData {
  averageRating: number;
  totalReviews: number;
}

export const reviewApi = {
  getMyReviews: () =>
    apiFetch<{ success: boolean; data: ReviewData[] }>("/reviews/my"),
  getReviewsForSeller: (sellerId: number) =>
    apiFetch<{ success: boolean; data: ReviewData[] }>(`/reviews/seller/${sellerId}`),
  getSellerRating: (sellerId: number) =>
    apiFetch<{ success: boolean; data: SellerRatingData }>(`/reviews/seller/${sellerId}/rating`),
  checkReviewed: (orderId: number) =>
    apiFetch<{ success: boolean; data: { reviewed: boolean } }>(`/reviews/check/${orderId}`),
  create: (data: { orderId: number; rating: number; comment?: string }) =>
    apiFetch<{ success: boolean; data: ReviewData }>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const adminApi = {
  getUsers: (page = 1, limit = 20) =>
    apiFetch<{ success: boolean; data: User[]; pagination: { page: number; limit: number } }>(
      `/admin/users?page=${page}&limit=${limit}`
    ),
  getBannedUsers: (page = 1, limit = 20) =>
    apiFetch<{ success: boolean; data: User[]; pagination: { page: number; limit: number } }>(
      `/admin/users/banned?page=${page}&limit=${limit}`
    ),
  banUser: (userId: number) =>
    apiFetch<{ success: boolean; message: string }>(
      `/admin/users/${userId}/ban`,
      { method: "PATCH" }
    ),
  unbanUser: (userId: number) =>
    apiFetch<{ success: boolean; message: string }>(
      `/admin/users/${userId}/unban`,
      { method: "PATCH" }
    ),
  getBannedProducts: (page = 1, limit = 20) =>
    apiFetch<{ success: boolean; data: ProductWithSeller[]; pagination: { page: number; limit: number } }>(
      `/admin/products/banned?page=${page}&limit=${limit}`
    ),
  banProduct: (productId: number) =>
    apiFetch<{ success: boolean; message: string }>(
      `/admin/products/${productId}/ban`,
      { method: "PATCH" }
    ),
  unbanProduct: (productId: number) =>
    apiFetch<{ success: boolean; message: string }>(
      `/admin/products/${productId}/unban`,
      { method: "PATCH" }
    ),
  getReports: (page = 1, limit = 20) =>
    apiFetch<{ success: boolean; data: Report[]; pagination: { page: number; limit: number } }>(
      `/admin/reports?page=${page}&limit=${limit}`
    ),
};

export const chatApi = {
  getRooms: () =>
    apiFetch<{ success: boolean; data: ChatRoomWithPartner[] }>("/chats"),

  getUnreadCount: () =>
    apiFetch<{ success: boolean; unreadCount: number }>("/chats/unread"),

  findOrCreateRoom: (sellerId: number, productId: number) =>
    apiFetch<{ success: boolean; data: Chat }>("/chats", {
      method: "POST",
      body: JSON.stringify({ sellerId, productId }),
    }),

  getRoomById: (chatId: number) =>
    apiFetch<{ success: boolean; data: Chat }>(`/chats/${chatId}`),

  deleteRoom: (chatId: number) =>
    apiFetch<{ success: boolean; message: string }>(`/chats/${chatId}`, {
      method: "DELETE",
    }),

  getMessages: (chatId: number, page = 1) =>
    apiFetch<{
      success: boolean;
      data: MessageWithSender[];
      pagination: { page: number; limit: number; hasMore: boolean };
    }>(`/chats/${chatId}/messages?page=${page}`),

  sendMessage: (chatId: number, content: string, type: "text" | "image" = "text") =>
    apiFetch<{ success: boolean; message: string; messageId: number }>(
      `/chats/${chatId}/messages`,
      { method: "POST", body: JSON.stringify({ content, type }) }
    ),

  markAsRead: (chatId: number) =>
    apiFetch<{ success: boolean; message: string }>(`/chats/${chatId}/read`, {
      method: "PATCH",
    }),
};

export interface OrderWithDetails {
  Order_ID: number;
  Product_ID: number;
  Buyer_ID: number;
  Seller_ID: number;
  OrderDate?: string;
  Quantity: number;
  Total_Price: number;
  Status: "pending" | "paid" | "completed" | "cancelled";
  Title?: string;
  BuyerName?: string;
  SellerName?: string;
  Image_URL?: string;
}

export const orderApi = {
  getMyBuyerOrders: () =>
    apiFetch<{ success: boolean; data: OrderWithDetails[] }>("/orders/buyer/my"),
  getMySellerOrders: () =>
    apiFetch<{ success: boolean; data: OrderWithDetails[] }>("/orders/seller/my"),
  updateStatus: (orderId: number, status: "paid" | "completed") =>
    apiFetch<{ success: boolean; message: string }>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  cancel: (orderId: number) =>
    apiFetch<{ success: boolean; message: string }>(`/orders/${orderId}/cancel`, {
      method: "PATCH",
    }),
};
