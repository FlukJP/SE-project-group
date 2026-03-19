import type { ProductWithSeller } from "./Product";
import { API_BASE } from "@/src/lib/api";

export interface ProductDisplay {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  postedAt: string;
  description: string;
  categoryKey: string;
  categoryName: string;
  condition: string;
  status: "available" | "reserved" | "sold";
  seller: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    email?: string;
  };
}

export function toProductDisplay(p: ProductWithSeller): ProductDisplay {
  let images: string[] = [];
  try {
    const parsed = JSON.parse(p.Image_URL);
    images = Array.isArray(parsed)
      ? parsed.map((url: string) =>
          url.startsWith("http") ? url : `${API_BASE}${url}`
        )
      : [];
  } catch {
    if (p.Image_URL) {
      images = [
        p.Image_URL.startsWith("http")
          ? p.Image_URL
          : `${API_BASE}${p.Image_URL}`,
      ];
    }
  }

  // Use dedicated Location column; fallback to regex for legacy products
  let location = p.Location?.trim() || "";
  if (!location) {
    const locMatch = p.Description?.match(/📍\s*พื้นที่:\s*(.+?)(?:\n|$)/);
    if (locMatch) location = locMatch[1].trim();
  }

  const cleanDescription =
    p.Description?.replace(/\n\n📍 พื้นที่:[\s\S]*$/, "")
      .replace(/📞\s*ติดต่อ:\s*\S+/g, "")
      .trim() || "";

  return {
    id: String(p.Product_ID),
    title: p.Title,
    price: p.Price,
    images,
    location,
    postedAt: formatThaiRelativeTime(p.Created_at),
    description: cleanDescription,
    categoryKey: p.Category_Key || String(p.Category_ID),
    categoryName: p.Category_Name || p.Category_Key || "",
    condition: p.Condition,
    status: p.Status,
    seller: {
      id: String(p.Seller_ID),
      name: p.SellerName || "ผู้ขาย",
      avatarUrl: p.SellerAvatar,
      phone: p.SellerPhone_number,
      email: p.SellerEmail,
    },
  };
}

// Function to calculate relative time in Thai language
function formatThaiRelativeTime(date?: Date | string): string {
  if (!date) return "";
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  if (diffDay === 1) return "เมื่อวานนี้";
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
  return new Date(date).toLocaleDateString("th-TH");
}