import type { Expense } from "@/types";

const categoryColors: Record<string, string> = {
  food: "bg-orange-500/20 text-orange-400",
  transport: "bg-blue-500/20 text-blue-400",
  entertainment: "bg-purple-500/20 text-purple-400",
  shopping: "bg-pink-500/20 text-pink-400",
  bills: "bg-yellow-500/20 text-yellow-400",
  health: "bg-green-500/20 text-green-400",
  education: "bg-cyan-500/20 text-cyan-400",
  other: "bg-slate-500/20 text-slate-400",
};

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">No expenses yet</p>
        <p className="text-sm mt-1">Start by adding an expense or using voice logging</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[expense.category] || categoryColors.other}`}>
              {expense.category}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">
                {expense.description || expense.category}
              </p>
              <p className="text-slate-400 text-xs">{expense.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`font-semibold ${expense.type === "income" ? "text-emerald-400" : "text-white"}`}>
              {expense.type === "income" ? "+" : "-"}₹{Number(expense.amount).toLocaleString('en-IN')}
            </span>
            {expense.source === "voice" && (
              <span className="text-xs text-slate-500">🎙️</span>
            )}
            <button
              onClick={() => onEdit(expense)}
              className="text-slate-400 hover:text-white text-sm transition"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(expense.id)}
              className="text-slate-400 hover:text-red-400 text-sm transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
