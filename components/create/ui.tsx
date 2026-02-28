import React from "react";

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export const FieldLabel: React.FC<{
  children: React.ReactNode;
  htmlFor?: string;
}> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block font-medium text-sm mb-1">
    {children}
  </label>
);

export const ErrorText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-red-600 text-sm mt-1">{children}</p>
);

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
