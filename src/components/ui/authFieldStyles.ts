const AUTH_FIELD_FOCUS_CLASS_NAME =
    "focus:outline-none focus:ring-2 focus:ring-[#D9734E]/30 focus:border-[#D9734E]";
const AUTH_FIELD_BASE_CLASS_NAME =
    `w-full rounded-xl border bg-white text-[#4A3B32] placeholder-[#A89F91] ${AUTH_FIELD_FOCUS_CLASS_NAME}`;
const AUTH_FIELD_ERROR_BORDER_CLASS_NAME = "border-red-300";
const AUTH_FIELD_DEFAULT_BORDER_CLASS_NAME = "border-[#E6D5C3]";

export const AUTH_PAGE_FIELD_CLASS_NAME = `${AUTH_FIELD_BASE_CLASS_NAME} px-4 py-3 text-sm`;
export const AUTH_MODAL_FIELD_CLASS_NAME = `${AUTH_FIELD_BASE_CLASS_NAME} p-3.5 text-base border-[#DCD0C0]`;
export const AUTH_SELECT_DISABLED_CLASS_NAME = "disabled:bg-[#F9F6F0] disabled:text-[#A89F91]";

export function getAuthPageFieldClassName(hasError = false) {
    return `${AUTH_PAGE_FIELD_CLASS_NAME} ${hasError ? AUTH_FIELD_ERROR_BORDER_CLASS_NAME : AUTH_FIELD_DEFAULT_BORDER_CLASS_NAME}`;
}

export function getAuthModalFieldClassName() {
    return AUTH_MODAL_FIELD_CLASS_NAME;
}

export function getAuthPageSelectClassName(hasError = false, isDisabled = false) {
    return `${getAuthPageFieldClassName(hasError)}${isDisabled ? ` ${AUTH_SELECT_DISABLED_CLASS_NAME}` : ""}`;
}
