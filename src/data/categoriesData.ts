import type { CategoryData, PopularCategoryData } from "@/src/lib/api";

export type Category = {
  id?: number;
  name: string;
  emoji: string;
  href: string;
};

export type BaseCategory = {
  id: number;
  key: string;
  name: string;
  emoji: string;
};

export type CreateCategory = Pick<BaseCategory, "id" | "key" | "name" | "emoji">;

// แปลง CategoryData จาก API -> Category สำหรับ homepage/search navigation
export function toCategory(c: CategoryData): Category {
  return {
    id: c.Category_ID,
    name: c.name,
    emoji: c.emoji,
    href: `/search?cat=${c.category_key}`,
  };
}

// แปลง PopularCategoryData -> Category สำหรับ homepage
export function toPopularCategory(c: PopularCategoryData): Category {
  return {
    name: c.name,
    emoji: c.emoji,
    href: `/search?cat=${c.category_key}`,
  };
}

// แปลง CategoryData จาก API -> CreateCategory สำหรับ create product form
export function toCreateCategory(c: CategoryData): CreateCategory {
  return {
    id: c.Category_ID,
    key: c.category_key,
    name: c.name,
    emoji: c.emoji,
  };
}
