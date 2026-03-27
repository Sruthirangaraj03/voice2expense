"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Expense } from "@/types";

const categories = ["food", "transport", "entertainment", "shopping", "bills", "health", "education", "other"];

interface ExpenseFormProps {
  expense?: Expense | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [category, setCategory] = useState(expense?.category || "food");
  const [description, setDescription] = useState(expense?.description || "");
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      setLoading(false);
      return;
    }
    try {
      const payload = { amount: parsedAmount, category, description, date };
      if (expense) {
        await api.put(`/api/expenses/${expense.id}`, payload);
        toast.success("Updated!");
      } else {
        const res = await api.post("/api/expenses", payload);
        toast.success("Added!");
        if (res.budget_alert) {
          const a = res.budget_alert;
          const remaining = Number(a.remaining);
          if (remaining <= 0) {
            setTimeout(() => toast.error(`You've exceeded your ${a.period_type} ${a.category} budget of Rs.${Number(a.limit).toLocaleString("en-IN")}!`), 500);
          } else {
            setTimeout(() => toast(`Rs.${remaining.toLocaleString("en-IN")} remaining to spend on ${a.category}`, { duration: 4000 }), 500);
          }
        }
      }
      onSuccess();
    } catch {
      toast.error("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h3 className="text-lg font-bold text-gray-900">{expense ? "Edit Expense" : "Add Expense"}</h3>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase font-medium">Amount (INR)</label>
              <input type="number" step="0.01" min="0.01" max="99999999.99" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase font-medium">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20">
                {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-medium">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-medium">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500}
              placeholder="e.g., Lunch at cafe"
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-[#E65100] text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#BF360C] transition">
              {loading ? "Saving..." : expense ? "Update" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
