import { UserModel } from "@/src/models/UserModel";
import { User, pickUpdateFields, UpdateUserData } from "@/src/types/User";
import { AppError } from "@/src/errors/AppError";
import "dotenv/config";
import { validateEmail, validatePhoneNumber, validateUsername } from '@/src/utils/validators';

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
        if (safeData.Email !== undefined) {
            safeData.Email = safeData.Email.trim().toLowerCase();
            if (!safeData.Email) throw new AppError("Email is required", 400);
            if (!validateEmail(safeData.Email)) throw new AppError("Invalid email format", 400);
        }
        if (safeData.Phone_number !== undefined) {
            safeData.Phone_number = safeData.Phone_number.trim();
            if (safeData.Phone_number && !validatePhoneNumber(safeData.Phone_number)) throw new AppError("Phone number must be 10 digits", 400);
        }
        if (safeData.Username !== undefined) {
            safeData.Username = safeData.Username.trim();
            if (!validateUsername(safeData.Username)) throw new AppError("Username must be 2-50 characters and contain only letters, numbers, spaces, underscores, or hyphens", 400);
        }
        if (safeData.Address !== undefined) {
            safeData.Address = safeData.Address.trim();
        }
        if (safeData.Auto_Reply_Message !== undefined && !(await UserModel.hasAutoReplyColumn())) {
            throw new AppError("Auto reply is not available yet because the database migration has not been applied.", 503);
        }

        const existingUser = await UserModel.findByIDSafe(params.userID);
        if (!existingUser) throw new AppError("User not found", 404);
        const updatePayload: UpdateUserData & { Is_Phone_Verified?: boolean; Is_Email_Verified?: boolean; Verified_Date?: Date } = safeData;

        if (safeData.Email && safeData.Email !== existingUser.Email.toLowerCase()) {
            const existingEmailOwner = await UserModel.findByEmailSafe(safeData.Email);
            if (existingEmailOwner && existingEmailOwner.User_ID !== params.userID) {
                throw new AppError("Email already in use", 409);
            }
            updatePayload.Is_Email_Verified = false;
            updatePayload.Verified_Date = undefined;
        }

        if (safeData.Phone_number !== undefined && safeData.Phone_number !== (existingUser.Phone_number ?? "")) {
            if (safeData.Phone_number) {
            const existingPhoneOwner = await UserModel.findByPhone(safeData.Phone_number);
            if (existingPhoneOwner && existingPhoneOwner.User_ID !== params.userID) {
                throw new AppError("Phone number already in use", 409);
            }
            }
        }

        if (safeData.Phone_number !== undefined && safeData.Phone_number !== (existingUser.Phone_number ?? "")) {
            updatePayload.Is_Phone_Verified = false;
            updatePayload.Verified_Date = undefined;
        }

        const success = await UserModel.updateUser(params.userID, updatePayload);
        if (!success) throw new AppError("The data update failed. Please try again.", 500);
        return true;
    },
};
