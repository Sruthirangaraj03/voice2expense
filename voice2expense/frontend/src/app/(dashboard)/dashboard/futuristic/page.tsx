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

function BudgetCard({ label, o }: { label: string; o: OverallPeriod }) {
  if (!o.budget) return null;
  const pct = Math.min(Math.round((o.spent / o.budget) * 100), 100);
  const isOver = o.spent > o.budget;
  const willExceed = o.projected > o.budget;
  const barColor = isOver ? "#DC2626" : willExceed ? "#F59E0B" : "#22C55E";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-xs text-gray-400 uppercase font-medium mb-3">{label} Budget</p>

      {/* Spent / Budget */}
      <div className="flex items-end justify-between mb-1">
        <p className="text-2xl font-bold text-gray-900">{fmt(o.spent)}</p>
        <p className="text-sm text-gray-400">of {fmt(o.budget)}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>

      {/* Status */}
      {isOver ? (
        <p className="text-sm text-red-600 font-semibold">
          Over budget by {fmt(o.spent - o.budget)}
        </p>
      ) : (
        <p className="text-sm text-gray-900">
          <span className="font-semibold" style={{ color: barColor }}>{fmt(o.remaining_budget!)}</span> left for {o.days_remaining} day{o.days_remaining !== 1 && "s"}
        </p>
      )}

      {/* Daily info */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-gray-400">You spend</p>
          <p className="font-bold text-sm text-gray-900">{fmt(o.daily_rate)}/day</p>
        </div>
        <div className={`rounded-xl p-2.5 text-center ${willExceed ? "bg-red-50" : "bg-green-50"}`}>
          <p className="text-[10px] text-gray-400">Safe limit</p>
          <p className={`font-bold text-sm ${willExceed ? "text-red-600" : "text-green-600"}`}>
            {o.safe_daily_limit !== null ? `${fmt(o.safe_daily_limit)}/day` : "-"}
          </p>
        </div>
      </div>

      {/* Projection sentence */}
      {!isOver && (
        <p className="text-xs text-gray-400 mt-3">
          At this rate, you&apos;d spend {fmt(o.projected)} by end of the {label.toLowerCase()}
          {willExceed
            ? <span className="text-red-500"> — {fmt(o.projected - o.budget)} over budget</span>
            : <span className="text-green-500"> — within budget</span>
          }
        </p>
      )}
    </div>
  );
}

function CategoryRow({ cat, period }: { cat: CategoryPrediction; period: "weekly" | "monthly" }) {
  const c = period === "weekly" ? cat.weekly : cat.monthly;
  const color = categoryColors[cat.category] || "#546E7A";
  const hasBudget = c.budget_limit !== null && c.budget_limit > 0;
  const remaining = hasBudget ? Math.max(0, c.budget_limit! - c.spent) : null;
  const pct = hasBudget ? Math.min(Math.round((c.spent / c.budget_limit!) * 100), 100) : null;
  const isOver = hasBudget && c.spent > c.budget_limit!;
  const willExceed = c.status === "will_exceed";
  const barColor = isOver ? "#DC2626" : willExceed ? "#F59E0B" : pct !== null && pct > 80 ? "#F59E0B" : "#22C55E";

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
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
          {hasBudget && (
            <p className={`text-[11px] font-medium ${isOver ? "text-red-500" : "text-green-600"}`}>
              {isOver ? `${fmt(c.spent - c.budget_limit!)} over` : `${fmt(remaining!)} left`}
            </p>
          )}
          {!hasBudget && c.projected > 0 && (
            <p className="text-[11px] text-gray-400">→ {fmt(c.projected)} est.</p>
          )}
        </div>
      </div>
      {hasBudget && pct !== null && (
        <div className="mt-2">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{pct}% of {fmt(c.budget_limit!)} used</p>
        </div>
      )}
    </div>
  );
}

export default function FuturisticPage() {
  const [data, setData] = useState<FuturisticData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/analytics/futuristic");
        setData(res);
      } catch { /* */ }
      finally { setLoading(false); }
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
  const m = data.overall.monthly;
  const hasWeeklyBudget = w.budget !== null && w.budget > 0;
  const hasMonthlyBudget = m.budget !== null && m.budget > 0;
  const weeklyCats = data.categories.filter(c => c.weekly.budget_limit !== null && c.weekly.budget_limit > 0);
  const monthlyCats = data.categories.filter(c => c.monthly.budget_limit !== null && c.monthly.budget_limit > 0);
  const noBudgetCats = data.categories.filter(c =>
    (c.weekly.budget_limit === null || c.weekly.budget_limit === 0) &&
    (c.monthly.budget_limit === null || c.monthly.budget_limit === 0) &&
    (c.weekly.spent > 0 || c.monthly.spent > 0)
  );

  if (!hasWeeklyBudget && !hasMonthlyBudget && data.categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <p className="font-semibold text-gray-900">No data yet</p>
        <p className="text-sm text-gray-400 mt-1">Set a budget and add expenses to see predictions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* Weekly Budget Card */}
      <BudgetCard label="Weekly" o={w} />

      {/* Weekly categories */}
      {weeklyCats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 py-2.5 text-[10px] text-gray-400 uppercase font-medium border-b border-gray-50">Weekly by category</p>
          <div className="divide-y divide-gray-50">
            {weeklyCats.map(cat => <CategoryRow key={cat.category} cat={cat} period="weekly" />)}
          </div>
        </div>
      )}

      {/* Monthly Budget Card */}
      <BudgetCard label="Monthly" o={m} />

      {/* Monthly categories */}
      {monthlyCats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 py-2.5 text-[10px] text-gray-400 uppercase font-medium border-b border-gray-50">Monthly by category</p>
          <div className="divide-y divide-gray-50">
            {monthlyCats.map(cat => <CategoryRow key={cat.category} cat={cat} period="monthly" />)}
          </div>
        </div>
      )}

      {/* Categories without budget */}
      {noBudgetCats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 py-2.5 text-[10px] text-gray-400 uppercase font-medium border-b border-gray-50">Other spending</p>
          <div className="divide-y divide-gray-50">
            {noBudgetCats.map(cat => <CategoryRow key={cat.category} cat={cat} period="weekly" />)}
          </div>
        </div>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((insight, i) => {
            const isWarn = insight.includes("exceed") || insight.includes("Reduce") || insight.includes("limit spending") || insight.includes("over");
            const isGood = insight.includes("on track") || insight.includes("within budget") || insight.includes("Safe to");
            return (
              <div key={i}
                className={`px-4 py-3 rounded-2xl text-sm flex items-start gap-3 ${
                  isWarn ? "bg-red-50 text-red-700" : isGood ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                }`}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {isWarn ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span>{insight}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
