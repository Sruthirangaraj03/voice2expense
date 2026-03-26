import type { AnalyticsSummary } from "@/types";

interface KPICardsProps {
  summary: AnalyticsSummary;
}

export function KPICards({ summary }: KPICardsProps) {
  const cards = [
    {
      label: "Total Spent",
      value: `₹${summary.total_spent.toLocaleString('en-IN')}`,
      color: "text-red-400",
    },
    {
      label: "Total Income",
      value: `₹${summary.total_income.toLocaleString('en-IN')}`,
      color: "text-emerald-400",
    },
    {
      label: "Transactions",
      value: summary.transaction_count.toString(),
      color: "text-blue-400",
    },
    {
      label: "Voice Usage",
      value: `${Math.round(summary.voice_ratio * 100)}%`,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="p-4 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
