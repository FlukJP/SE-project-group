import React from "react";
import {
    getSegmentedControlClassName,
    getSegmentedControlItemClassName,
} from "@/src/components/ui/segmentedControlStyles";

type TabButtonGroupSize = "md" | "lg";

export type TabButtonGroupItem<T extends string = string> = {
    key: T;
    label: React.ReactNode;
    disabled?: boolean;
    title?: string;
};

type TabButtonGroupProps<T extends string> = {
    items: readonly TabButtonGroupItem<T>[];
    value: T;
    onChange: (value: T) => void;
    size?: TabButtonGroupSize;
    className?: string;
    itemClassName?: string;
    fullWidth?: boolean;
};

function joinClasses(...classNames: (string | false | null | undefined)[]) {
    return classNames.filter(Boolean).join(" ");
}

export function TabButtonGroup<T extends string>({
    items,
    value,
    onChange,
    size = "md",
    className,
    itemClassName,
    fullWidth = true,
}: TabButtonGroupProps<T>) {
    return (
        <div className={joinClasses(getSegmentedControlClassName({ fullWidth }), className)}>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    title={item.title}
                    disabled={item.disabled}
                    onClick={() => onChange(item.key)}
                    className={joinClasses(
                        getSegmentedControlItemClassName({
                            active: value === item.key,
                            size,
                        }),
                        item.disabled && "cursor-not-allowed opacity-50",
                        itemClassName,
                    )}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
