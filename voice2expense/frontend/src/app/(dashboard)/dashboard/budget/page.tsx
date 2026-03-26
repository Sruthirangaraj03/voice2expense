"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { BudgetStatus } from "@/types";
import { BudgetProgressBar } from "@/components/dashboard/BudgetProgressBar";

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
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const month = new Date().toISOString().slice(0, 7) + "-01";
    try {
      await api.post("/api/budgets", {
        category,
        month,
        limit_amount: parseFloat(limitAmount),
      });
      setShowForm(false);
      setLimitAmount("");
      fetchBudgets();
    } catch (err) {
      console.error("Failed to create budget:", err);
      toast.error('Failed to create budget');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this budget?')) return;
    try {
      await api.delete(`/api/budgets/${id}`);
      toast.success('Budget removed');
      fetchBudgets();
    } catch (err) {
      console.error("Failed to delete budget:", err);
      toast.error('Failed to remove budget');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Budget</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
        >
          + Set Budget
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Limit (INR)</label>
            <input
              type="number"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white w-32"
              min="1"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
          >
            Save
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">No budgets set yet</p>
          <p className="text-sm mt-1">Create a budget to start tracking your spending limits</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <BudgetProgressBar key={budget.id} budget={budget} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
