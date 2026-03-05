export type Role = 'customer' | 'seller' | 'admin';

export interface User {
    User_ID?: number;
    Username: string;
    Email: string;
    Password?: string;
    Role: Role;
    Phone_number?: string;
    Is_Phone_Verified?: boolean;
    Address?: string;
    Verified_Date?: Date;
    RatingScore?: number;
}