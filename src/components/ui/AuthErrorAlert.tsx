"use client";

type AuthErrorAlertProps = {
    message: string;
    className?: string;
};

export function AuthErrorAlert({ message, className }: AuthErrorAlertProps) {
    return (
        <div className={className ?? "bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-4"}>
            {message}
        </div>
    );
}
