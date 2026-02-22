export interface User {
    User_ID?: number;
    Username: string;
    Email: string;
    Password?: string;
    Role: 'customer' | 'admin';
    Phone_number?: string;
    Is_Phone_Verified?: boolean;
    Address?: string;
    Verified_Date?: Date;
    RatingScore?: number;
}