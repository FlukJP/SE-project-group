"use client";

import React from "react";
import { FormField } from "@/src/components/ui/FormField";

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: string | null;
    hint?: string;
    className?: string;
    selectClassName?: string;
    children: React.ReactNode;
};

export function SelectField({
    label,
    error,
    hint,
    className,
    selectClassName,
    children,
    ...props
}: SelectFieldProps) {
    return (
        <FormField label={label} error={error} hint={hint} className={className}>
            <select {...props} className={selectClassName}>
                {children}
            </select>
        </FormField>
    );
}
