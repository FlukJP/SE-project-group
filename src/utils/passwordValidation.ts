import { AUTH_TEXT } from "@/src/constants/authText";

export const PASSWORD_REQUIREMENTS_HINT = AUTH_TEXT.password.requirementsHint;
export const PASSWORD_PLACEHOLDERS = AUTH_TEXT.password.placeholders;
export const PASSWORD_TOGGLE_ARIA_LABELS = AUTH_TEXT.password.toggleAriaLabels;

export type PasswordStrength = {
    level: number;
    label: string;
    color: string;
};

export const getPasswordValidationError = (password: string): string | null => {
    if (!password) return AUTH_TEXT.password.validationErrors.required;
    if (password.length < 8) return AUTH_TEXT.password.validationErrors.minLength;
    if (!/[A-Z]/.test(password)) return AUTH_TEXT.password.validationErrors.uppercase;
    if (!/[a-z]/.test(password)) return AUTH_TEXT.password.validationErrors.lowercase;
    if (!/\d/.test(password)) return AUTH_TEXT.password.validationErrors.number;
    if (!/[^a-zA-Z0-9]/.test(password)) return AUTH_TEXT.password.validationErrors.specialCharacter;
    return null;
};

export const isPasswordValidForForm = (password: string): boolean =>
    getPasswordValidationError(password) === null;

export const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { level: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) {
        return { level: 1, label: AUTH_TEXT.password.strengthLabels.veryWeak, color: "bg-[#C45A5A]" };
    }
    if (score === 2) {
        return { level: 2, label: AUTH_TEXT.password.strengthLabels.weak, color: "bg-orange-500" };
    }
    if (score === 3) {
        return { level: 3, label: AUTH_TEXT.password.strengthLabels.medium, color: "bg-yellow-500" };
    }
    if (score === 4) {
        return { level: 4, label: AUTH_TEXT.password.strengthLabels.strong, color: "bg-[#D9734E]" };
    }

    return { level: 5, label: AUTH_TEXT.password.strengthLabels.veryStrong, color: "bg-[#D9734E]" };
};
