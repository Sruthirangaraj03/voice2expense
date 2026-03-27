"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Expense } from "@/types";
import { ExpenseForm } from "@/components/expense/ExpenseForm";

const categories = ["food", "transport", "entertainment", "shopping", "bills", "health", "education", "other"];
const categoryIcons: Record<string, string> = {
  food: "F", transport: "T", entertainment: "E", shopping: "S",
  bills: "B", health: "H", education: "Ed", other: "O",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState("");

  const fetchExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      params.set("limit", "50");
      const res = await api.get(`/api/expenses?${params.toString()}`);
      setExpenses(res.data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      toast.success("Deleted");
      fetchExpenses();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button
          onClick={() => { setEditingExpense(null); setShowForm(true); }}
          className="px-4 py-2 bg-[#E65100] text-white rounded-full text-sm font-medium"
        >
          + Add
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterCategory("")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${!filterCategory ? "bg-[#E65100] text-white" : "bg-white text-gray-600"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${filterCategory === c ? "bg-[#E65100] text-white" : "bg-white text-gray-600"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onSuccess={() => { setShowForm(false); setEditingExpense(null); fetchExpenses(); }}
          onCancel={() => { setShowForm(false); setEditingExpense(null); }}
        />
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No expenses yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xs font-bold text-[#E65100]">
                  {categoryIcons[e.category] || "O"}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{e.description || e.category}</p>
                  <p className="text-xs text-gray-400">
                    {e.sub_type && <span className="capitalize text-[#E65100]">{e.sub_type} &middot; </span>}
                    {e.date} {e.source === "voice" ? "(voice)" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">₹{Number(e.amount).toLocaleString("en-IN")}</span>
                <button onClick={() => { setEditingExpense(e); setShowForm(true); }} className="text-gray-400 text-xs">Edit</button>
                <button onClick={() => handleDelete(e.id)} className="text-gray-400 text-xs">X</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
