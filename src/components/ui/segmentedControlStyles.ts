type SegmentedControlSize = "md" | "lg";
type SegmentedControlVariant = "surface" | "underline";

type SegmentedControlClassOptions = {
    fullWidth?: boolean;
    variant?: SegmentedControlVariant;
};

type SegmentedControlItemClassOptions = {
    active?: boolean;
    size?: SegmentedControlSize;
    fullWidth?: boolean;
    variant?: SegmentedControlVariant;
};

const SEGMENTED_CONTROL_BASE_CLASS_NAME = "flex";

const SEGMENTED_CONTROL_ITEM_SIZE_CLASS_NAMES: Record<SegmentedControlSize, string> = {
    md: "px-3 py-2 text-sm",
    lg: "px-3 py-3 text-sm",
};

export function getSegmentedControlClassName({
    fullWidth = false,
    variant = "surface",
}: SegmentedControlClassOptions = {}) {
    return [
        SEGMENTED_CONTROL_BASE_CLASS_NAME,
        variant === "surface" && "gap-1 rounded-xl border border-[#E6D5C3] bg-white p-1",
        variant === "underline" && "border-b border-gray-200 text-sm font-medium text-gray-500",
        fullWidth && "w-full",
    ]
        .filter(Boolean)
        .join(" ");
}

export function getSegmentedControlItemClassName({
    active = false,
    size = "md",
    fullWidth = true,
    variant = "surface",
}: SegmentedControlItemClassOptions = {}) {
    return [
        "font-semibold transition focus:outline-none",
        variant === "surface" && "rounded-lg focus:ring-2 focus:ring-[#D9734E]/20",
        variant === "underline" && "focus:ring-2 focus:ring-[#121E4D]/20",
        SEGMENTED_CONTROL_ITEM_SIZE_CLASS_NAMES[size],
        fullWidth && "flex-1",
        variant === "surface" &&
            (active
                ? "bg-[#D9734E] text-white shadow-sm"
                : "text-[#A89F91] hover:bg-[#F9F6F0] hover:text-[#4A3B32]"),
        variant === "underline" &&
            (active
                ? "border-b-2 border-[#121E4D] text-[#121E4D] font-bold"
                : "hover:bg-gray-50"),
    ]
        .filter(Boolean)
        .join(" ");
}
