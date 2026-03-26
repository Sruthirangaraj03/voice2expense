import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { BudgetStatus } from "@/types";

export function useBudget(month?: string) {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = month ? `?month=${month}` : "";
      const data = await api.get(`/api/budgets/status${params}`);
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch budgets");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return { budgets, loading, error, refetch: fetchBudgets };
}
