export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import type { ProductWithSeller, Product } from "@/src/types/Product";
import type { User } from "@/src/types/User";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
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

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(json.message || `Request failed (${res.status})`, res.status);
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
  create: (formData: FormData) =>
    apiFetch<{ success: boolean; product: Product }>(
      "/products",
      { method: "POST", body: formData }
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
};

export const userApi = {
  getMe: () =>
    apiFetch<{ success: boolean; data: User }>("/users/me"),
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

import type { Report } from "@/src/types/Report";

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
