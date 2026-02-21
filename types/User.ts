export interface User {
    User_ID?: number;
    Username: string;
    Email: string;
    Password?: string;
    Role: 'customer' | 'admin';
    Phone_number?: string;
    Address?: string;
    Verified_Date?: Date;
    RatingScore?: number;
}