"use client";

import React from "react";

type FormFieldProps = {
    label?: string;
    error?: string | null;
    hint?: string;
    className?: string;
    children: React.ReactNode;
};

export function FormField({ label, error, hint, className, children }: FormFieldProps) {
    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-[#4A3B32] mb-1">{label}</label>}
            {children}
            {error && <p className="text-xs text-[#C45A5A] mt-1">{error}</p>}
            {hint && <p className="text-xs text-[#A89F91] mt-1">{hint}</p>}
        </div>
    );
}
