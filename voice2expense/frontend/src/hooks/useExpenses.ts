import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Expense } from "@/types";

interface UseExpensesOptions {
  category?: string;
  type?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.category) params.set("category", options.category);
      if (options.type) params.set("type", options.type);
      if (options.from) params.set("from", options.from);
      if (options.to) params.set("to", options.to);
      params.set("limit", String(options.limit || 50));

      const res = await api.get(`/api/expenses?${params.toString()}`);
      setExpenses(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [options.category, options.type, options.from, options.to, options.limit]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, error, total, refetch: fetchExpenses };
}
