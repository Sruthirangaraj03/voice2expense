"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { BudgetStatus } from "@/types";

const categories = ["food", "transport", "entertainment", "shopping", "bills", "health", "education", "other"];

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("food");
  const [limitAmount, setLimitAmount] = useState("");

  const fetchBudgets = async () => {
    try {
      const data = await api.get("/api/budgets/status");
      setBudgets(data);
    } catch { console.error("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const month = new Date().toISOString().slice(0, 7) + "-01";
    try {
      await api.post("/api/budgets", { category, month, limit_amount: parseFloat(limitAmount) });
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
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm">
              {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase">Monthly Limit (INR)</label>
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
          <p className="font-semibold">No budgets set yet</p>
          <p className="text-sm text-gray-400 mt-1">Set spending limits per category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const pct = Math.min(Math.round((Number(b.used_amount) / Number(b.limit_amount)) * 100), 100);
            const color = b.status === "exceeded" ? "#DC2626" : b.status === "warning" ? "#F59E0B" : "#22C55E";
            return (
              <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{b.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${color}15`, color }}>
                      {b.status === "exceeded" ? "Over Budget" : b.status === "warning" ? "Warning" : "On Track"}
                    </span>
                    <button onClick={() => handleDelete(b.id)} className="text-gray-300 text-xs">X</button>
                  </div>
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
          })}
        </div>
      )}
    </div>
  );
}
