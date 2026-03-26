import type { BudgetStatus } from "@/types";

interface BudgetProgressBarProps {
  budget: BudgetStatus;
  onDelete: (id: string) => void;
}

export function BudgetProgressBar({ budget, onDelete }: BudgetProgressBarProps) {
  const percentage = Math.min(
    Math.round((Number(budget.used_amount) / Number(budget.limit_amount)) * 100),
    100
  );

  const statusColor =
    budget.status === "exceeded"
      ? "bg-red-500"
      : budget.status === "warning"
      ? "bg-yellow-500"
      : "bg-emerald-500";

  const statusText =
    budget.status === "exceeded"
      ? "Exceeded"
      : budget.status === "warning"
      ? "Warning"
      : "On Track";

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-white font-medium capitalize">{budget.category}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            budget.status === "exceeded"
              ? "bg-red-500/20 text-red-400"
              : budget.status === "warning"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-emerald-500/20 text-emerald-400"
          }`}>
            {statusText}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">
            ₹{Number(budget.used_amount).toLocaleString('en-IN')} / ₹{Number(budget.limit_amount).toLocaleString('en-IN')}
          </span>
          <button
            onClick={() => onDelete(budget.id)}
            className="text-slate-400 hover:text-red-400 text-xs transition"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
