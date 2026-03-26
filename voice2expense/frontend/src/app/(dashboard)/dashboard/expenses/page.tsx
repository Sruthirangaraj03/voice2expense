"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Expense } from "@/types";
import { ExpenseList } from "@/components/expense/ExpenseList";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filter, setFilter] = useState({ category: "", type: "" });

  const fetchExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.category) params.set("category", filter.category);
      if (filter.type) params.set("type", filter.type);
      params.set("limit", "50");

      const res = await api.get(`/api/expenses?${params.toString()}`);
      setExpenses(res.data);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingExpense(null);
    fetchExpenses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Expenses</h2>
        <div className="flex gap-3">
          <VoiceRecorder onSuccess={fetchExpenses} />
          <button
            onClick={() => { setEditingExpense(null); setShowForm(true); }}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filter.category}
          onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm"
        >
          <option value="">All Categories</option>
          {["food", "transport", "entertainment", "shopping", "bills", "health", "education", "other"].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select
          value={filter.type}
          onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm"
        >
          <option value="">All Types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingExpense(null); }}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <ExpenseList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}
