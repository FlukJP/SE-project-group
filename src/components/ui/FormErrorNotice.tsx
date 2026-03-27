"use client";

type FormErrorNoticeProps = {
    message: string;
    className?: string;
};

export function FormErrorNotice({ message, className }: FormErrorNoticeProps) {
    return (
        <div className={["bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2", className].filter(Boolean).join(" ")}>
            {message}
        </div>
    );
}
