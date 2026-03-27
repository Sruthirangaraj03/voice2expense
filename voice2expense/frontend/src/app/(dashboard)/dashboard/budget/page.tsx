"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { BudgetStatus } from "@/types";

const categories = ["food", "transport", "entertainment", "shopping", "bills", "health", "education", "other"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [history, setHistory] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [category, setCategory] = useState("food");
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("monthly");
  const [limitAmount, setLimitAmount] = useState("");

  const fetchBudgets = async () => {
    try {
      const data = await api.get("/api/budgets/status");
      setBudgets(data);
    } catch { console.error("Failed"); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      const data = await api.get("/api/budgets/history");
      setHistory(data);
    } catch { console.error("Failed to fetch history"); }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/budgets", {
        category,
        period_type: periodType,
        limit_amount: parseFloat(limitAmount),
      });
      setShowForm(false);
      setLimitAmount("");
      toast.success("Budget set!");
      fetchBudgets();
    } catch { toast.error("Failed to create budget"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this budget?")) return;
    try {
      await api.delete(`/api/budgets/${id}`);
      toast.success("Removed");
      fetchBudgets();
    } catch { toast.error("Failed"); }
  };

  const weeklyBudgets = budgets.filter(b => b.period_type === "weekly");
  const monthlyBudgets = budgets.filter(b => b.period_type === "monthly");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#E65100] text-white rounded-full text-sm font-medium">
          + Set Budget
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="text-lg font-bold text-gray-900">Set Budget</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 pb-6 pt-2 space-y-4">
              {/* Period Type Toggle */}
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase font-medium">Budget Period</label>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setPeriodType("weekly")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      periodType === "weekly"
                        ? "bg-[#E65100] text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}>
                    Weekly
                  </button>
                  <button type="button"
                    onClick={() => setPeriodType("monthly")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      periodType === "monthly"
                        ? "bg-[#E65100] text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}>
                    Monthly
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase font-medium">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20">
                  {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase font-medium">
                  {periodType === "weekly" ? "Weekly" : "Monthly"} Limit (INR)
                </label>
                <input type="number" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20" min="1" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#E65100] text-white rounded-xl font-medium hover:bg-[#BF360C] transition">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
          </svg>
          <p className="font-semibold">No active budgets</p>
          <p className="text-sm text-gray-400 mt-1">Set weekly or monthly spending limits per category</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Weekly Budgets */}
          {weeklyBudgets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Weekly Budgets</h3>
              <div className="space-y-3">
                {weeklyBudgets.map((b) => (
                  <BudgetCard key={b.id} budget={b} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Monthly Budgets */}
          {monthlyBudgets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Monthly Budgets</h3>
              <div className="space-y-3">
                {monthlyBudgets.map((b) => (
                  <BudgetCard key={b.id} budget={b} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Toggle */}
      <button
        onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(); }}
        className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition">
        {showHistory ? "Hide past budgets" : "View past budgets"}
      </button>

      {showHistory && history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Completed</h3>
          {history.map((b) => {
            const pct = Math.min(Math.round((Number(b.used_amount) / Number(b.limit_amount)) * 100), 100);
            return (
              <div key={b.id} className="bg-gray-50 rounded-2xl p-3 opacity-70">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize text-sm">{b.category}</span>
                  <span className="text-xs text-gray-400">
                    {b.period_type === "weekly" ? "W" : "M"} | {formatDate(b.period_start)} - {formatDate(b.period_end)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Rs.{Number(b.used_amount).toLocaleString("en-IN")} / Rs.{Number(b.limit_amount).toLocaleString("en-IN")}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gray-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showHistory && history.length === 0 && (
        <p className="text-center text-sm text-gray-400">No past budgets yet</p>
      )}
    </div>
  );
}

function BudgetCard({ budget: b, onDelete }: { budget: BudgetStatus; onDelete: (id: string) => void }) {
  const pct = Math.min(Math.round((Number(b.used_amount) / Number(b.limit_amount)) * 100), 100);
  const color = b.status === "exceeded" ? "#DC2626" : b.status === "warning" ? "#F59E0B" : "#22C55E";

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold capitalize">{b.category}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase font-medium">
            {b.period_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}15`, color }}>
            {b.status === "exceeded" ? "Over Budget" : b.status === "warning" ? "Warning" : "On Track"}
          </span>
          <button onClick={() => onDelete(b.id)} className="text-gray-300 text-xs hover:text-red-400">X</button>
        </div>
      </div>
      <div className="text-[11px] text-gray-400 mb-2">
        {formatDate(b.period_start)} - {formatDate(b.period_end)}
      </div>
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>Rs.{Number(b.used_amount).toLocaleString("en-IN")}</span>
        <span>Rs.{Number(b.limit_amount).toLocaleString("en-IN")}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
