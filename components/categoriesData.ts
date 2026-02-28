// components/categoriesData.ts

import type { Category } from "@/components/CategoriesSection";

/** ใช้ร่วมกันเป็นแหล่งข้อมูลเดียว แล้วค่อยแปลงเป็นชุดต่าง ๆ */
export type BaseCategory = {
  id: number;
  key: string; // cat query เช่น cars, phones
  name: string;
  emoji: string;
};

const BASE: BaseCategory[] = [
  { id: 1, key: "cars", name: "รถยนต์", emoji: "🚗" },
  { id: 2, key: "phones", name: "มือถือ", emoji: "📱" },
  { id: 3, key: "property", name: "บ้าน & ที่ดิน", emoji: "🏡" },
  { id: 4, key: "fashion", name: "แฟชั่น", emoji: "👗" },
  { id: 5, key: "jobs", name: "งาน", emoji: "💼" },
  { id: 6, key: "computers", name: "คอมพิวเตอร์", emoji: "💻" },
  { id: 7, key: "appliances", name: "เครื่องใช้ไฟฟ้า", emoji: "🔌" },
  { id: 8, key: "sports", name: "กีฬา", emoji: "🏀" },
  { id: 9, key: "pets", name: "สัตว์เลี้ยง", emoji: "🐾" },
  { id: 10, key: "others", name: "อื่น ๆ", emoji: "🧩" },
];

/** ✅ สำหรับ Home / CategoriesSection (ตรง type Category ที่มี href) */
export const CATEGORIES: Category[] = BASE.map((c) => ({
  id: c.id,
  name: c.name,
  emoji: c.emoji,
  href: `/search?cat=${c.key}`,
}));

/** ✅ สำหรับ Create page (มี key ให้กดแล้ว push ต่อได้เลย) */
export type CreateCategory = Pick<BaseCategory, "id" | "key" | "name" | "emoji">;

export const CREATE_CATEGORIES: CreateCategory[] = BASE.map((c) => ({
  id: c.id,
  key: c.key,
  name: c.name,
  emoji: c.emoji,
}));