interface StatCardProps {
    emoji: string;
    label: string;
    value: number | string;
    bgColor?: string;
}

// Renders a summary statistic card with an emoji icon, label, and formatted numeric value
export default function StatCard({ emoji, label, value, bgColor = "bg-white" }: StatCardProps) {
    return (
        <div className={`${bgColor} border border-[#DCD0C0] rounded-xl p-6`}>
            <div className="text-3xl mb-2">{emoji}</div>
            <div className="text-sm text-[#A89F91]">{label}</div>
            <div className="text-2xl font-extrabold text-[#4A3B32] mt-1">
                {typeof value === "number" ? Number(value).toLocaleString() : value}
            </div>
        </div>
    );
}
