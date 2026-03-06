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
    Avatar_URL?: string;
    Is_Banned?: boolean;
}

// TYPE safe pick
export type UpdateUserData = Partial<Pick<User, "Username" | "Phone_number" | "Address">>;

export const pickUpdateFields = (data: Partial<User>): UpdateUserData => {
    const result: UpdateUserData = {};

    if (data.Username !== undefined) result.Username = data.Username;
    if (data.Phone_number !== undefined) result.Phone_number = data.Phone_number;
    if (data.Address !== undefined) result.Address = data.Address;

    return result;
}