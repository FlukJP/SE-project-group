import React from "react";
import { getFormFieldClassName } from "@/src/components/ui/formFieldStyles";

// Merges class names, filtering out falsy values
export function cn(...classes: (string | false | undefined | null)[]) {
    return classes.filter(Boolean).join(" ");
}

// Renders a styled form field label
export const FieldLabel: React.FC<{
    children: React.ReactNode;
    htmlFor?: string;
}> = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block font-medium text-sm mb-1 text-[#4A3B32]">
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
            getFormFieldClassName({ size: "md" }),
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
            getFormFieldClassName({ size: "md" }),
            props.className || ""
        )}
    />
));
Select.displayName = "Select";

export { PasswordInput } from "@/src/components/ui/PasswordInput";
export { PasswordField } from "@/src/components/ui/PasswordField";
export { FormField } from "@/src/components/ui/FormField";
export { TextField } from "@/src/components/ui/TextField";
export { SelectField } from "@/src/components/ui/SelectField";
export { TextareaField } from "@/src/components/ui/TextareaField";
export { SidebarNavGroup } from "@/src/components/ui/SidebarNavGroup";
export { TabButtonGroup } from "@/src/components/ui/TabButtonGroup";
export { AuthErrorAlert } from "@/src/components/ui/AuthErrorAlert";
export { FormErrorNotice } from "@/src/components/ui/FormErrorNotice";
export { FormSuccessNotice } from "@/src/components/ui/FormSuccessNotice";
export { getFormButtonClassName } from "@/src/components/ui/formButtonStyles";
export { getFilterChipClassName, getFilterChipRemoveButtonClassName } from "@/src/components/ui/filterChipStyles";
export {
    getSegmentedControlClassName,
    getSegmentedControlItemClassName,
} from "@/src/components/ui/segmentedControlStyles";
export {
    getFilterPanelClassName,
    getPanelClassName,
    getPanelSectionClassName,
} from "@/src/components/ui/panelStyles";
