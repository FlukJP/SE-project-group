interface StatCardProps {
  emoji: string;
  label: string;
  value: number | string;
  bgColor?: string;
}

export default function StatCard({ emoji, label, value, bgColor = "bg-emerald-50" }: StatCardProps) {
  return (
    <div className={`${bgColor} border border-zinc-200 rounded-xl p-6`}>
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-2xl font-extrabold text-zinc-900 mt-1">
        {typeof value === "number" ? Number(value).toLocaleString() : value}
      </div>
    </div>
  );
}
