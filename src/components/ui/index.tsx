import React from "react";

// Merges class names, filtering out falsy values
export function cn(...classes: (string | false | undefined | null)[]) {
    return classes.filter(Boolean).join(" ");
}

// Renders a styled form field label
export const FieldLabel: React.FC<{
    children: React.ReactNode;
    htmlFor?: string;
}> = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block font-medium text-sm mb-1">
        {children}
    </label>
);

// Renders a styled error message below a form field
export const ErrorText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-red-600 text-sm mt-1">{children}</p>
);

// Styled input element with standard border and focus ring
export const Input = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
    <input
        ref={ref}
        {...props}
        className={cn(
            "w-full border border-zinc-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-200",
            props.className || ""
        )}
    />
));
Input.displayName = "Input";

// Styled select element with standard border and focus ring
export const Select = React.forwardRef<
    HTMLSelectElement,
    React.SelectHTMLAttributes<HTMLSelectElement>
>((props, ref) => (
    <select
        ref={ref}
        {...props}
        className={cn(
            "w-full border border-zinc-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-200",
            props.className || ""
        )}
    />
));
Select.displayName = "Select";
