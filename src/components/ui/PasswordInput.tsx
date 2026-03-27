"use client";

import React, { useState } from "react";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
    showToggleWhenFilled?: boolean;
    showAriaLabel?: string;
    hideAriaLabel?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    (
        {
            className,
            showToggleWhenFilled = true,
            showAriaLabel = "Show password",
            hideAriaLabel = "Hide password",
            value,
            defaultValue,
            ...props
        },
        ref
    ) => {
        const [isVisible, setIsVisible] = useState(false);
        const hasValue = typeof value === "string"
            ? value.length > 0
            : typeof defaultValue === "string"
                ? defaultValue.length > 0
                : false;
        const shouldShowToggle = showToggleWhenFilled ? hasValue : true;

        return (
            <div className="relative">
                <input
                    ref={ref}
                    {...props}
                    type={isVisible ? "text" : "password"}
                    value={value}
                    defaultValue={defaultValue}
                    className={["w-full pr-12", className].filter(Boolean).join(" ")}
                />
                {shouldShowToggle && (
                    <button
                        type="button"
                        onClick={() => setIsVisible((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-[#B88363] hover:text-[#D9734E] transition-colors"
                        aria-label={isVisible ? hideAriaLabel : showAriaLabel}
                    >
                        {isVisible ? (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M4 4l16 16" />
                                <path d="M10.58 10.58A2 2 0 0 0 13.4 13.4" />
                                <path d="M9.15 5.51A10.7 10.7 0 0 1 12 5.13c4.97 0 8.98 3 10.65 6.87a11.8 11.8 0 0 1-3.2 4.21" />
                                <path d="M6.1 6.1A11.77 11.77 0 0 0 1.35 12C3.02 15.87 7.03 18.87 12 18.87c1.82 0 3.54-.4 5.08-1.12" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M1.35 12C3.02 8.13 7.03 5.13 12 5.13S20.98 8.13 22.65 12C20.98 15.87 16.97 18.87 12 18.87S3.02 15.87 1.35 12Z" />
                                <circle cx="12" cy="12" r="3.15" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";
