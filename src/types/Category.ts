export interface CategoryRow {
    Category_ID: number;
    category_key: string;
    name: string;
    emoji: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

// Client-side API response type (no created_at)
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