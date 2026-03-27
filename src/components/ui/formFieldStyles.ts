type FormFieldTone = "default" | "danger";
type FormFieldSize = "md" | "lg" | "xl";
type FormFieldResize = "none" | "y";

type FormFieldClassOptions = {
    tone?: FormFieldTone;
    size?: FormFieldSize;
    readOnly?: boolean;
    disabled?: boolean;
    resize?: FormFieldResize;
};

const FORM_FIELD_BASE_CLASS_NAME =
    "w-full border bg-white text-[#4A3B32] placeholder-[#A89F91]";

const FORM_FIELD_SIZE_CLASS_NAMES: Record<FormFieldSize, string> = {
    md: "rounded-md px-4 py-2",
    lg: "rounded-lg px-3 py-2 text-sm",
    xl: "rounded-xl px-3 py-2 text-sm",
};

const FORM_FIELD_TONE_CLASS_NAMES: Record<FormFieldTone, string> = {
    default: "focus:outline-none focus:ring-2 focus:ring-[#D9734E]/30 focus:border-[#D9734E]",
    danger: "focus:outline-none focus:ring-2 focus:ring-[#C45A5A]/30 focus:border-[#C45A5A]",
};

export function getFormFieldClassName({
    tone = "default",
    size = "md",
    readOnly = false,
    disabled = false,
    resize,
}: FormFieldClassOptions = {}) {
    return [
        FORM_FIELD_BASE_CLASS_NAME,
        "border-[#DCD0C0]",
        FORM_FIELD_SIZE_CLASS_NAMES[size],
        FORM_FIELD_TONE_CLASS_NAMES[tone],
        readOnly && "bg-[#F9F6F0] text-[#A89F91] cursor-not-allowed",
        disabled && "disabled:opacity-50",
        resize === "none" && "resize-none",
        resize === "y" && "resize-y",
    ]
        .filter(Boolean)
        .join(" ");
}
