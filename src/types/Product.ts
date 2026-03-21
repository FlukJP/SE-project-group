export interface Product {
    Product_ID?: number;
    Seller_ID: number;
    Title: string;
    Description: string;
    Province?: string;
    District?: string;
    Price: number;
    Condition: string;
    Category_ID: number;
    Status: 'available' | 'reserved' | 'sold';
    Quantity?: number;
    Image_URL: string;
    View_Count?: number;
    Created_at?: Date;
    Updated_at?: Date;
    Is_Banned?: boolean;
}

export interface ProductWithSeller extends Product {
    SellerName: string;
    SellerEmail: string;
    SellerPhone_number?: string;
    SellerAvatar?: string;
    Category_Name?: string;
    Category_Key?: string;
}

export interface ProductFilters {
    keyword?: string;
    categoryId?: number;
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    province?: string;
    district?: string;
    page?: number;
    limit?: number;
    sortBy?: 'Price' | 'Created_at' | 'random';
    sortOrder?: 'asc' | 'desc';
    excludeSeller?: number;
}

export type UpdateProductData = Partial<Pick<Product, "Title" | "Description" | "Province" | "District" | "Price" | "Condition" | "Category_ID" | "Quantity" | "Image_URL" | "Status">>;

export const pickProductUpdateFields = (data: Partial<Product>): UpdateProductData => {
    const result: UpdateProductData = {};
    if (data.Title !== undefined) result.Title = data.Title;
    if (data.Description !== undefined) result.Description = data.Description;
    if (data.Province !== undefined) result.Province = data.Province;
    if (data.District !== undefined) result.District = data.District;
    if (data.Price !== undefined) result.Price = data.Price;
    if (data.Condition !== undefined) result.Condition = data.Condition;
    if (data.Category_ID !== undefined) result.Category_ID = data.Category_ID;
    if (data.Quantity !== undefined) result.Quantity = data.Quantity;
    if (data.Image_URL !== undefined) result.Image_URL = data.Image_URL;
    if (data.Status !== undefined) result.Status = data.Status;
    return result;
};