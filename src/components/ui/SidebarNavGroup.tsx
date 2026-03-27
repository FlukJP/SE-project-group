import React from "react";
import Link from "next/link";
import { getPanelClassName } from "@/src/components/ui/panelStyles";

export type SidebarNavItem<T extends string = string> = {
    key: T;
    label: React.ReactNode;
    href?: string;
    icon?: React.ReactNode;
    suffix?: React.ReactNode;
    title?: string;
    disabled?: boolean;
};

type SidebarNavGroupProps<T extends string> = {
    items: readonly SidebarNavItem<T>[];
    activeKey?: T;
    onChange?: (key: T) => void;
    heading?: React.ReactNode;
    className?: string;
    itemClassName?: string;
};

function joinClasses(...classNames: (string | false | null | undefined)[]) {
    return classNames.filter(Boolean).join(" ");
}

function getSidebarNavItemClassName(active: boolean, disabled: boolean) {
    return joinClasses(
        "flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors",
        active
            ? "bg-[#E6D5C3] text-[#4A3B32] font-semibold"
            : "text-[#4A3B32] hover:bg-[#F9F6F0]",
        disabled && "cursor-not-allowed opacity-50",
    );
}

export function SidebarNavGroup<T extends string>({
    items,
    activeKey,
    onChange,
    heading,
    className,
    itemClassName,
}: SidebarNavGroupProps<T>) {
    return (
        <aside className={joinClasses(getPanelClassName({ padding: "sm", radius: "xl" }), className)}>
            {heading ? (
                <div className="mb-4 px-4 text-sm font-bold text-[#D9734E]">
                    {heading}
                </div>
            ) : null}

            <nav className="flex flex-col gap-1">
                {items.map((item) => {
                    const isActive = activeKey === item.key;
                    const content = (
                        <>
                            {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                            <span className="min-w-0 flex-1">{item.label}</span>
                            {item.suffix ? <span className="shrink-0">{item.suffix}</span> : null}
                        </>
                    );

                    const sharedClassName = joinClasses(
                        getSidebarNavItemClassName(isActive, !!item.disabled),
                        itemClassName,
                    );

                    if (item.href) {
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                title={item.title}
                                aria-disabled={item.disabled}
                                className={sharedClassName}
                                onClick={(event) => {
                                    if (item.disabled) {
                                        event.preventDefault();
                                        return;
                                    }
                                    onChange?.(item.key);
                                }}
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={item.key}
                            type="button"
                            title={item.title}
                            disabled={item.disabled}
                            className={sharedClassName}
                            onClick={() => onChange?.(item.key)}
                        >
                            {content}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
