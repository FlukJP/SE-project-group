import type { ProductWithSeller } from "./Product";
import { API_BASE } from "@/src/lib/api";

export interface ProductDisplay {
  id: string;
  title: string;
  price: number;
  images: string[];
  province: string;
  district: string;
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

const LEGACY_LOCATION_PATTERN = /📍\s*พื้นที่:\s*(.+?)(?:\n|$)/;
const LEGACY_PHONE_PATTERN = /📞\s*ติดต่อ:\s*(\S+)/;
const MODERN_PHONE_SUFFIX_PATTERN = /\n\nPHONE:\s*[\s\S]*$/;

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

  const province = p.Province?.trim() || "";
  const district = p.District?.trim() || "";
  let location = province && district ? `${province} (${district})` : province || district;
  if (!location) {
    const locMatch = p.Description?.match(LEGACY_LOCATION_PATTERN);
    if (locMatch) location = locMatch[1].trim();
  }

  const phoneFromDescription =
    p.Description?.match(/(?:^|\n\n)PHONE:\s*(.+?)(?:\n|$)/)?.[1]?.trim() ||
    p.Description?.match(LEGACY_PHONE_PATTERN)?.[1]?.trim() ||
    "";

  const cleanDescription =
    p.Description?.replace(MODERN_PHONE_SUFFIX_PATTERN, "")
      .replace(/\n\n📍 พื้นที่:[\s\S]*$/, "")
      .replace(LEGACY_PHONE_PATTERN, "")
      .trim() || "";

  return {
    id: String(p.Product_ID),
    title: p.Title,
    price: p.Price,
    images,
    province,
    district,
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
      phone: phoneFromDescription || p.SellerPhone_number,
      email: p.SellerEmail,
    },
  };
}

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
