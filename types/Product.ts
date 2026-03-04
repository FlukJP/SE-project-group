export interface Product {
    Product_ID?: number;
    Seller_ID: number;
    Title: string;
    Description: string;
    Price: number;
    Condition: string;
    Category: string;
    Status: 'Available' | 'Reserved' | 'Sold';
    Quantity?: number;
    Image_URL: string;
    View_Count?: number;
    Created_at?: Date;
    Updated_at?: Date;
}

export interface ProductWithSeller extends Product {
    SellerName: string;
    SellerEmail: string;
    SellerPhone_number?: string;
}

export interface ProductFilters {
    keyword?: string;
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: 'Price' | 'Created_At';
    sortOrder?: 'asc' | 'desc';
}