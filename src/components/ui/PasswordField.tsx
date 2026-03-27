"use client";

import React from "react";
import { FormField } from "@/src/components/ui/FormField";
import { PasswordInput } from "@/src/components/ui/PasswordInput";

type PasswordFieldProps = {
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    placeholder?: string;
    autoComplete?: string;
    error?: string | null;
    hint?: string;
    showAriaLabel?: string;
    hideAriaLabel?: string;
    className?: string;
    inputClassName?: string;
};

export function PasswordField({
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    autoComplete,
    error,
    hint,
    showAriaLabel,
    hideAriaLabel,
    className,
    inputClassName,
}: PasswordFieldProps) {
    return (
        <FormField label={label} error={error} hint={hint} className={className}>
            <PasswordInput
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                autoComplete={autoComplete}
                showAriaLabel={showAriaLabel}
                hideAriaLabel={hideAriaLabel}
                className={inputClassName}
            />
        </FormField>
    );
}
