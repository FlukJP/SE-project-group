"use client";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmColor?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

// Renders a confirmation dialog modal with cancel and confirm buttons
export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "ยืนยัน",
    confirmColor = "bg-red-600",
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold text-[#4A3B32] mb-2">{title}</h3>
                <p className="text-sm text-[#A89F91] mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm border border-[#DCD0C0] rounded-lg hover:bg-[#F9F6F0] transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`${confirmColor} text-white px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors`}
                    >
                        {loading ? "กำลังดำเนินการ..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
