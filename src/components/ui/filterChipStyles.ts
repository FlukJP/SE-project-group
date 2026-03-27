type FilterChipTone = "toggle" | "summary";
type FilterChipSize = "sm" | "md";

type FilterChipClassOptions = {
    tone?: FilterChipTone;
    active?: boolean;
    size?: FilterChipSize;
};

const FILTER_CHIP_BASE_CLASS_NAME =
    "inline-flex items-center gap-1.5 border font-medium transition";

const FILTER_CHIP_SIZE_CLASS_NAMES: Record<FilterChipSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-3 py-1.5 text-sm",
};

export function getFilterChipClassName({
    tone = "toggle",
    active = false,
    size = "md",
}: FilterChipClassOptions = {}) {
    const variantClassName =
        tone === "summary"
            ? "rounded-full bg-[#E6D5C3] text-[#4A3B32] border-[#DCD0C0] font-semibold"
            : active
                ? "rounded-lg bg-[#D9734E] text-white border-[#D9734E]"
                : "rounded-lg bg-white text-[#4A3B32] border-[#DCD0C0] hover:border-[#D9734E]";

    return [
        FILTER_CHIP_BASE_CLASS_NAME,
        FILTER_CHIP_SIZE_CLASS_NAMES[size],
        variantClassName,
    ]
        .filter(Boolean)
        .join(" ");
}

export function getFilterChipRemoveButtonClassName(active = false) {
    return [
        "ml-1 transition",
        active ? "text-white/90 hover:text-white" : "hover:text-[#D9734E]",
    ]
        .filter(Boolean)
        .join(" ");
}
