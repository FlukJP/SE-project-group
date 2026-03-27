import { describe, expect, it } from "vitest";
import {
    getPasswordValidationError,
    getPasswordStrength,
    isPasswordValidForForm,
    PASSWORD_PLACEHOLDERS,
    PASSWORD_REQUIREMENTS_HINT,
    PASSWORD_TOGGLE_ARIA_LABELS,
} from "@/src/utils/passwordValidation";

describe("getPasswordValidationError", () => {
    it("should return null for a valid password", () => {
        expect(getPasswordValidationError("Password2!")).toBeNull();
    });

    it("should return a Thai error message for each failed rule", () => {
        expect(getPasswordValidationError("")).toBe("กรุณากรอกรหัสผ่าน");
        expect(getPasswordValidationError("Short1!")).toBe("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
        expect(getPasswordValidationError("password2!")).toBe("รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว");
        expect(getPasswordValidationError("PASSWORD2!")).toBe("รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว");
        expect(getPasswordValidationError("Password!!")).toBe("รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว");
        expect(getPasswordValidationError("Password2")).toBe("รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว เช่น ! @ #");
    });
});

describe("isPasswordValidForForm", () => {
    it("should map the validation result to a boolean", () => {
        expect(isPasswordValidForForm("Password2!")).toBe(true);
        expect(isPasswordValidForForm("Password2")).toBe(false);
    });
});

describe("getPasswordStrength", () => {
    it("should return strength metadata based on password complexity", () => {
        expect(getPasswordStrength("")).toEqual({ level: 0, label: "", color: "" });
        expect(getPasswordStrength("short")).toEqual({ level: 1, label: "อ่อนมาก", color: "bg-[#C45A5A]" });
        expect(getPasswordStrength("Password2!").level).toBeGreaterThanOrEqual(4);
    });
});

describe("password validation constants", () => {
    it("should expose reusable password hint and toggle labels", () => {
        expect(PASSWORD_REQUIREMENTS_HINT).toContain("8");
        expect(PASSWORD_PLACEHOLDERS.password).toContain("A-Z");
        expect(PASSWORD_PLACEHOLDERS.confirmPassword).toContain("อีกครั้ง");
        expect(PASSWORD_PLACEHOLDERS.currentPassword).toBe("รหัสผ่าน");
        expect(PASSWORD_TOGGLE_ARIA_LABELS.show).toBe("แสดงรหัสผ่าน");
        expect(PASSWORD_TOGGLE_ARIA_LABELS.hide).toBe("ซ่อนรหัสผ่าน");
        expect(PASSWORD_TOGGLE_ARIA_LABELS.showConfirm).toBe("แสดงยืนยันรหัสผ่าน");
        expect(PASSWORD_TOGGLE_ARIA_LABELS.hideConfirm).toBe("ซ่อนยืนยันรหัสผ่าน");
    });
});
