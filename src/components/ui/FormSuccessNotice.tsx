"use client";

type FormSuccessNoticeProps = {
    message: string;
    className?: string;
};

export function FormSuccessNotice({ message, className }: FormSuccessNoticeProps) {
    return (
        <div className={["bg-[#E6D5C3] border border-[#DCD0C0] text-[#D9734E] text-sm rounded-lg px-4 py-2", className].filter(Boolean).join(" ")}>
            {message}
        </div>
    );
}
