export type Role = "customer" | "admin";

export interface User {
    User_ID?: number;
    Username: string;
    Email: string;
    Password?: string;
    Role: Role;
    Phone_number?: string;
    Is_Phone_Verified?: boolean | number;
    Is_Email_Verified?: boolean | number;
    Address?: string;
    Verified_Date?: Date | string;
    RatingScore?: number;
    Avatar_URL?: string;
    Auto_Reply_Message?: string;
    Is_Banned?: boolean | number;
}

export type UpdateUserData = Partial<
    Pick<User, "Username" | "Phone_number" | "Address" | "Avatar_URL" | "Auto_Reply_Message">
>;

export const pickUpdateFields = (data: Partial<User>): UpdateUserData => {
    const result: UpdateUserData = {};
    if (data.Username !== undefined) result.Username = data.Username;
    if (data.Phone_number !== undefined) result.Phone_number = data.Phone_number;
    if (data.Address !== undefined) result.Address = data.Address;
    if (data.Avatar_URL !== undefined) result.Avatar_URL = data.Avatar_URL;
    if (data.Auto_Reply_Message !== undefined) result.Auto_Reply_Message = data.Auto_Reply_Message;

    return result;
};
