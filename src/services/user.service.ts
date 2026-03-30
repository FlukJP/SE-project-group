import { UserModel } from "@/src/models/UserModel";
import { User, pickUpdateFields, UpdateUserData } from "@/src/types/User";
import { AppError } from "@/src/errors/AppError";
import "dotenv/config";
import { validatePhoneNumber } from '@/src/utils/validators';

export const UserService = {
    /** Retrieve the public profile of a user by their ID */
    getProfile: async (params: { userID: number }): Promise<Omit<User, "Password">> => {
        const user = await UserModel.findByIDSafe(params.userID);
        if (!user) throw new AppError("User not found", 404);
        return user;
    },

    /** Update allowed profile fields, reset phone verification if the phone number changes */
    updateProfile: async (params: { userID: number, updateData: Partial<User> }): Promise<boolean> => {
        const safeData = pickUpdateFields(params.updateData);
        if (Object.keys(safeData).length === 0) throw new AppError("No valid fields to update", 400);
        if (safeData.Phone_number && !validatePhoneNumber(safeData.Phone_number)) throw new AppError("Phone number must be 10 digits", 400);
        if (safeData.Auto_Reply_Message !== undefined && !(await UserModel.hasAutoReplyColumn())) {
            throw new AppError("Auto reply is not available yet because the database migration has not been applied.", 503);
        }

        const existingUser = await UserModel.findByIDSafe(params.userID);
        if (!existingUser) throw new AppError("User not found", 404);
        const updatePayload: UpdateUserData & { Is_Phone_Verified?: boolean; Verified_Date?: Date } = safeData;

        if (safeData.Phone_number && safeData.Phone_number !== existingUser.Phone_number) {
            updatePayload.Is_Phone_Verified = false;
            updatePayload.Verified_Date = undefined;
        }

        const success = await UserModel.updateUser(params.userID, updatePayload);
        if (!success) throw new AppError("The data update failed. Please try again.", 500);
        return true;
    },
};
