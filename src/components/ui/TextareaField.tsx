"use client";

import React from "react";
import { FormField } from "@/src/components/ui/FormField";

type TextareaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string | null;
    hint?: string;
    className?: string;
    textareaClassName?: string;
};

export function TextareaField({
    label,
    error,
    hint,
    className,
    textareaClassName,
    ...props
}: TextareaFieldProps) {
    return (
        <FormField label={label} error={error} hint={hint} className={className}>
            <textarea {...props} className={textareaClassName} />
        </FormField>
    );
}
