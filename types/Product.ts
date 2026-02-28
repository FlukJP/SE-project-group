// UI-friendly product shape used throughout the frontend.  
// This can easily be mapped from whatever the database returns later.
export interface Product {
    id: string;
    title: string;
    price: number; // integer value in baht
    images: string[]; // at least one
    location: string;
    postedAt: string; // ISO or relative text
    description: string;
    categoryKey: string;
    seller: {
        id: string;
        name: string;
        avatarUrl?: string;
        phone?: string;
    };
}

// legacy database schema – kept for reference or backend use
export interface ProductDB {
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

export interface ProductWithSeller extends ProductDB {
    SellerName: string; 
}