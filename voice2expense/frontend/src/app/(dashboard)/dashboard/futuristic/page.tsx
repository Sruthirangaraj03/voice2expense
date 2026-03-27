"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface CatPeriod {
  spent: number;
  projected: number;
  daily_rate: number;
  budget_limit: number | null;
  status: "on_track" | "warning" | "will_exceed" | null;
  insight: string | null;
}

interface CategoryPrediction {
  category: string;
  monthly: CatPeriod;
  weekly: CatPeriod;
}

interface OverallPeriod {
  spent: number;
  projected: number;
  daily_rate: number;
  days_elapsed: number;
  days_remaining: number;
  budget: number | null;
  remaining_budget: number | null;
  safe_daily_limit: number | null;
  period: string;
}

interface FuturisticData {
  overall: { weekly: OverallPeriod; monthly: OverallPeriod };
  categories: CategoryPrediction[];
  insights: string[];
}

const fmt = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;

const categoryColors: Record<string, string> = {
  food: "#E65100", transport: "#1565C0", entertainment: "#7B1FA2",
  shopping: "#C2185B", bills: "#F9A825", health: "#2E7D32",
  education: "#00838F", other: "#546E7A",
};

export default function FuturisticPage() {
  const [data, setData] = useState<FuturisticData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/analytics/futuristic");
        setData(res);
      } catch {
        console.error("Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <p className="text-gray-900 font-semibold">Could not load predictions</p>
      </div>
    );
  }

  const w = data.overall.weekly;
  const hasBudget = w.budget !== null && w.budget > 0;
  const isOver = hasBudget && w.projected > w.budget!;
  const alreadyOver = hasBudget && w.spent > w.budget!;

  return (
    <div className="space-y-3">

      {/* Main Card — Simple estimation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-gray-400 text-xs uppercase font-medium mb-3">This week&apos;s estimate</p>

        <p className="text-gray-900 text-sm leading-relaxed">
          You spent <span className="font-bold text-[#E65100]">{fmt(w.spent)}</span> in {w.days_elapsed} day{w.days_elapsed !== 1 && "s"}.
        </p>

        <p className="text-gray-900 text-2xl font-bold mt-2">
          {alreadyOver ? (
            <>You already crossed your {fmt(w.budget!)} budget</>
          ) : (
            <>You&apos;d spend <span className={isOver ? "text-red-600" : "text-green-600"}>{fmt(w.projected)}</span> by Sunday</>
          )}
        </p>

        {hasBudget && (
          <div className="mt-4">
            {/* Budget bar */}
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>{fmt(w.spent)} spent</span>
              <span>{fmt(w.budget!)} budget</span>
            </div>
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(Math.round((w.spent / w.budget!) * 100), 100)}%`,
                  backgroundColor: alreadyOver ? "#DC2626" : isOver ? "#F59E0B" : "#22C55E",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Card — What to do */}
      {hasBudget && w.days_remaining > 0 && (
        <div className={`rounded-2xl p-5 shadow-sm ${isOver || alreadyOver ? "bg-red-50" : "bg-green-50"}`}>
          {alreadyOver ? (
            <>
              <p className={`font-bold text-red-700`}>
                You&apos;re Rs.{(w.spent - w.budget!).toLocaleString("en-IN")} over budget
              </p>
              <p className="text-sm text-red-600 mt-1">
                Try not to spend for the remaining {w.days_remaining} day{w.days_remaining !== 1 && "s"} to limit the damage.
              </p>
            </>
          ) : isOver ? (
            <>
              <p className="font-bold text-red-700">
                Reduce to {fmt(w.safe_daily_limit!)}/day to stay within budget
              </p>
              <p className="text-sm text-red-600 mt-1">
                You have {fmt(w.remaining_budget!)} left for {w.days_remaining} day{w.days_remaining !== 1 && "s"}. Currently spending {fmt(w.daily_rate)}/day.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-green-700">
                You&apos;re on track — {fmt(w.safe_daily_limit!)}/day is safe
              </p>
              <p className="text-sm text-green-600 mt-1">
                {fmt(w.remaining_budget!)} left for {w.days_remaining} day{w.days_remaining !== 1 && "s"}.
              </p>
            </>
          )}
        </div>
      )}

      {/* Category Breakdown — simple list */}
      {data.categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-5 py-3 text-xs text-gray-400 uppercase font-medium border-b border-gray-50">
            Category breakdown
          </p>
          <div className="divide-y divide-gray-50">
            {data.categories.map((cat) => {
              const c = cat.weekly;
              const color = categoryColors[cat.category] || "#546E7A";
              const hasCatBudget = c.budget_limit !== null && c.budget_limit > 0;
              const catOver = hasCatBudget && c.projected > c.budget_limit!;
              const pct = hasCatBudget ? Math.min(Math.round((c.spent / c.budget_limit!) * 100), 100) : null;

              return (
                <div key={cat.category} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: `${color}15`, color }}>
                        {cat.category.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 capitalize text-sm">{cat.category}</p>
                        <p className="text-[11px] text-gray-400">{fmt(c.daily_rate)}/day</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">{fmt(c.spent)}</p>
                      {hasCatBudget && (
                        <p className={`text-[11px] ${catOver ? "text-red-500" : "text-green-500"}`}>
                          → {fmt(c.projected)} of {fmt(c.budget_limit!)}
                        </p>
                      )}
                      {!hasCatBudget && c.projected > 0 && (
                        <p className="text-[11px] text-gray-400">→ {fmt(c.projected)} est.</p>
                      )}
                    </div>
                  </div>

                  {hasCatBudget && pct !== null && (
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: catOver ? "#DC2626" : pct > 80 ? "#F59E0B" : "#22C55E",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.categories.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="font-semibold text-gray-900">No expenses this week</p>
          <p className="text-sm text-gray-400 mt-1">Add expenses to see predictions</p>
        </div>
      )}
    </div>
  );
}
