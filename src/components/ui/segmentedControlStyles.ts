type SegmentedControlSize = "md" | "lg";

type SegmentedControlClassOptions = {
    fullWidth?: boolean;
};

type SegmentedControlItemClassOptions = {
    active?: boolean;
    size?: SegmentedControlSize;
    fullWidth?: boolean;
};

const SEGMENTED_CONTROL_BASE_CLASS_NAME =
    "flex gap-1 rounded-xl border border-[#E6D5C3] bg-white p-1";

const SEGMENTED_CONTROL_ITEM_BASE_CLASS_NAME =
    "rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#D9734E]/20";

const SEGMENTED_CONTROL_ITEM_SIZE_CLASS_NAMES: Record<SegmentedControlSize, string> = {
    md: "px-3 py-2 text-sm",
    lg: "px-3 py-3 text-sm",
};

export function getSegmentedControlClassName({
    fullWidth = false,
}: SegmentedControlClassOptions = {}) {
    return [
        SEGMENTED_CONTROL_BASE_CLASS_NAME,
        fullWidth && "w-full",
    ]
        .filter(Boolean)
        .join(" ");
}

export function getSegmentedControlItemClassName({
    active = false,
    size = "md",
    fullWidth = true,
}: SegmentedControlItemClassOptions = {}) {
    return [
        SEGMENTED_CONTROL_ITEM_BASE_CLASS_NAME,
        SEGMENTED_CONTROL_ITEM_SIZE_CLASS_NAMES[size],
        fullWidth && "flex-1",
        active
            ? "bg-[#D9734E] text-white shadow-sm"
            : "text-[#A89F91] hover:bg-[#F9F6F0] hover:text-[#4A3B32]",
    ]
        .filter(Boolean)
        .join(" ");
}
