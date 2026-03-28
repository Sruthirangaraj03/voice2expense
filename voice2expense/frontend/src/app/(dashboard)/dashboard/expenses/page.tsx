"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Expense } from "@/types";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

const categories = ["food", "transport", "shopping", "bills", "health", "fitness", "entertainment", "education", "grooming", "clothing", "maintenance", "travel", "family", "investments", "donations", "other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState("");

  // Fetch all categories once on mount
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/api/expenses?limit=200");
      const cats = [...new Set(res.data.map((e: Expense) => e.category))].filter(Boolean) as string[];
      setUserCategories(cats);
    } catch {}
  }, []);

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

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      toast.success("Deleted");
      fetchExpenses();
      fetchCategories();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-2.5 min-w-0">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Your Expenses</h2>
        <p className="text-xs text-gray-400 mt-0.5">View, filter, and manage all your expenses</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{expenses.length} expenses</p>
        <button
          onClick={() => { setEditingExpense(null); setShowForm(true); }}
          className="px-4 py-2 bg-[#E65100] text-white rounded-lg text-xs font-semibold active:scale-95 transition"
        >
          + Add
        </button>
      </div>

      {/* Category filter — only shows categories the user actually has */}
      {userCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide min-w-0">
          <button
            onClick={() => setFilterCategory("")}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition ${!filterCategory ? "bg-[#E65100] text-white shadow-sm" : "bg-white text-gray-500"}`}
          >
            All
          </button>
          {userCategories.map((c) => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-semibold capitalize whitespace-nowrap active:scale-95 transition ${filterCategory === c ? "bg-[#E65100] text-white shadow-sm" : "bg-white text-gray-500"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onSuccess={() => { setShowForm(false); setEditingExpense(null); fetchExpenses(); fetchCategories(); }}
          onCancel={() => { setShowForm(false); setEditingExpense(null); }}
        />
      )}

      {loading ? (
        <div className="space-y-1.5">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl animate-pulse" />)}</div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          <p className="font-semibold text-sm">No expenses yet</p>
          <p className="text-xs text-gray-400 mt-1">Tap the mic on Dashboard to record your first expense</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {expenses.map((e) => (
            <div key={e.id} className="bg-white rounded-xl px-3.5 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-[#E65100] flex-shrink-0">
                  <CategoryIcon category={e.category} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{e.description || e.category}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {e.sub_type && <span className="capitalize text-[#E65100]">{e.sub_type} &middot; </span>}
                    {e.date} {e.source === "voice" ? "(voice)" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="font-bold text-sm text-gray-900">Rs.{Number(e.amount).toLocaleString("en-IN")}</span>
                  <button onClick={() => { setEditingExpense(e); setShowForm(true); }} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 transition">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
