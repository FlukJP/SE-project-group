type PanelPadding = "sm" | "md" | "lg";
type PanelRadius = "lg" | "xl" | "2xl";
type PanelShadow = "none" | "sm" | "xl";
type PanelSectionPosition = "standalone" | "top" | "bottom";

type PanelClassOptions = {
    padding?: PanelPadding;
    radius?: PanelRadius;
    shadow?: PanelShadow;
    bordered?: boolean;
};

type PanelSectionClassOptions = {
    padding?: PanelPadding;
    position?: PanelSectionPosition;
};

const PANEL_BASE_CLASS_NAME = "bg-white";

const PANEL_PADDING_CLASS_NAMES: Record<PanelPadding, string> = {
    sm: "p-4",
    md: "p-4",
    lg: "p-6",
};

const PANEL_RADIUS_CLASS_NAMES: Record<PanelRadius, string> = {
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
};

const PANEL_SHADOW_CLASS_NAMES: Record<PanelShadow, string> = {
    none: "",
    sm: "shadow-sm",
    xl: "shadow-xl",
};

export function getPanelClassName({
    padding = "md",
    radius = "xl",
    shadow = "none",
    bordered = true,
}: PanelClassOptions = {}) {
    return [
        PANEL_BASE_CLASS_NAME,
        bordered && "border border-[#E6D5C3]",
        PANEL_PADDING_CLASS_NAMES[padding],
        PANEL_RADIUS_CLASS_NAMES[radius],
        PANEL_SHADOW_CLASS_NAMES[shadow],
    ]
        .filter(Boolean)
        .join(" ");
}

export function getPanelSectionClassName({
    padding = "lg",
    position = "standalone",
}: PanelSectionClassOptions = {}) {
    return [
        PANEL_BASE_CLASS_NAME,
        "border border-[#E6D5C3]",
        PANEL_PADDING_CLASS_NAMES[padding],
        position === "standalone" && "rounded-2xl",
        position === "top" && "rounded-t-2xl border-b-0",
        position === "bottom" && "rounded-b-2xl",
    ]
        .filter(Boolean)
        .join(" ");
}

export function getFilterPanelClassName() {
    return [
        PANEL_BASE_CLASS_NAME,
        "border border-[#E6D5C3]",
        "rounded-2xl",
        "p-5",
        "shadow-sm",
        "mb-5 space-y-5",
    ]
        .filter(Boolean)
        .join(" ");
}
