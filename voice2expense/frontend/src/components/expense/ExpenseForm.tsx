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
        await api.post("/api/expenses", payload);
        toast.success("Added!");
      }
      onSuccess();
    } catch {
      toast.error("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase">Amount (INR)</label>
          <input type="number" step="0.01" min="0.01" max="99999999.99" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30" required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30">
            {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1 uppercase">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1 uppercase">Description</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500}
          placeholder="e.g., Lunch at cafe"
          className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-500">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex-1 py-3 bg-[#E65100] text-white rounded-xl text-sm font-medium disabled:opacity-50">
          {loading ? "Saving..." : expense ? "Update" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
