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
  const [type, setType] = useState<string>(expense?.type || "expense");
  const [description, setDescription] = useState(expense?.description || "");
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        amount: parseFloat(amount),
        category,
        type,
        description,
        date,
      };

      if (expense) {
        await api.put(`/api/expenses/${expense.id}`, payload);
        toast.success("Expense updated!");
      } else {
        await api.post("/api/expenses", payload);
        toast.success("Expense added!");
      }
      onSuccess();
    } catch (err) {
      console.error("Failed to save expense:", err);
      toast.error("Failed to save expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Amount (INR)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="99999999.99"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="e.g., Lunch at cafe"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-300 hover:text-white transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : expense ? "Update" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
