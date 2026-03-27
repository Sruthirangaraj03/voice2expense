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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Budget Goals</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#E65100] text-white rounded-full text-sm font-medium">
          + Set Budget
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          {/* Period Type Toggle */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase">Budget Period</label>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setPeriodType("weekly")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                  periodType === "weekly"
                    ? "bg-[#E65100] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}>
                Weekly
              </button>
              <button type="button"
                onClick={() => setPeriodType("monthly")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                  periodType === "monthly"
                    ? "bg-[#E65100] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}>
                Monthly
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm">
              {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase">
              {periodType === "weekly" ? "Weekly" : "Monthly"} Limit (INR)
            </label>
            <input type="number" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm" min="1" required />
          </div>
          <button type="submit" className="w-full py-3 bg-[#E65100] text-white rounded-xl font-medium">Save Budget</button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-4xl mb-3">o</p>
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
