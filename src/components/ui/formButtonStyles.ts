type FormButtonVariant =
    | "primary"
    | "secondary"
    | "surfaceAccent"
    | "danger"
    | "info"
    | "dangerOutline"
    | "infoOutline";

type FormButtonSize = "sm" | "md" | "lg";

type FormButtonClassOptions = {
    variant?: FormButtonVariant;
    size?: FormButtonSize;
    fullWidth?: boolean;
};

const FORM_BUTTON_BASE_CLASS_NAME =
    "inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#D9734E]/30 disabled:opacity-50 disabled:cursor-not-allowed";

const FORM_BUTTON_VARIANT_CLASS_NAMES: Record<FormButtonVariant, string> = {
    primary: "bg-[#D9734E] text-white hover:bg-[#C25B38]",
    secondary: "border border-[#DCD0C0] bg-white text-[#4A3B32] hover:bg-[#F9F6F0] hover:border-[#D9734E]",
    surfaceAccent: "bg-white text-[#D9734E] hover:bg-[#F9F6F0]",
    danger: "bg-[#C45A5A] text-white hover:bg-[#A84040]",
    info: "bg-blue-600 text-white hover:bg-blue-700",
    dangerOutline: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
    infoOutline: "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
};

const FORM_BUTTON_SIZE_CLASS_NAMES: Record<FormButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-sm",
};

export function getFormButtonClassName({
    variant = "primary",
    size = "md",
    fullWidth = false,
}: FormButtonClassOptions = {}) {
    return [
        FORM_BUTTON_BASE_CLASS_NAME,
        FORM_BUTTON_VARIANT_CLASS_NAMES[variant],
        FORM_BUTTON_SIZE_CLASS_NAMES[size],
        fullWidth && "w-full",
    ]
        .filter(Boolean)
        .join(" ");
}
