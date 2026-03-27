"use client";

import React from "react";
import { FormField } from "@/src/components/ui/FormField";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string | null;
    hint?: string;
    className?: string;
    inputClassName?: string;
};

export function TextField({
    label,
    error,
    hint,
    className,
    inputClassName,
    ...props
}: TextFieldProps) {
    return (
        <FormField label={label} error={error} hint={hint} className={className}>
            <input
                {...props}
                className={inputClassName}
            />
        </FormField>
    );
}
