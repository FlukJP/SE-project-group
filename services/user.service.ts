import { UserModel } from "@/models/UserModel";
import { User } from "@/types/User";
import { AppError } from "@/errors/AppError";
import "dotenv/config";
import { validatePhoneNumber } from '@/lib/utils/validators';

// TYPE safe pick
type UpdateUserData = Partial<Pick<User, "Username" | "Phone_number" | "Address">>;

const pickUpdateFields = (data: UpdateUserData): UpdateUserData => {
    const allowedFields: (keyof UpdateUserData)[] = ["Username", "Phone_number", "Address"];
    const pickedData: UpdateUserData = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            pickedData[field] = data[field];
        };
    };
    return pickedData;
};

export const UserService = {
    // 1.Profile 
    getProfile: async (params: { userID: number }): Promise<Omit<User, "Password">> => {
        const user = await UserModel.findByID(params.userID);
        if (!user) throw new AppError("User not found", 404);
        const { Password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    // 2.Update profile
    updateProfile: async (params: { userID: number, updateData: Partial<User> }): Promise<boolean> => {
        const safeData = pickUpdateFields(params.updateData);

        if (Object.keys(safeData).length === 0) throw new AppError("No valid fields to update", 400);
        if (safeData.Phone_number && !validatePhoneNumber(safeData.Phone_number)) throw new AppError("Phone number must be 10 digits", 400);

        const success = await UserModel.updateUser(params.userID, safeData);
        if (!success) throw new AppError("The data update failed. Please try again.", 500);
        return true;
    },

};