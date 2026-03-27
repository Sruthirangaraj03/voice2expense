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

export default function FuturisticPage() {
  const [data, setData] = useState<FuturisticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const [selectedCat, setSelectedCat] = useState<string>("all");

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

  const o = view === "weekly" ? data.overall.weekly : data.overall.monthly;
  const periodName = view === "weekly" ? "week" : "month";
  const hasBudget = o.budget !== null && o.budget > 0;
  const isOver = hasBudget && o.spent > o.budget!;
  const willExceed = hasBudget && o.projected > o.budget!;
  const spentPct = hasBudget ? Math.min(Math.round((o.spent / o.budget!) * 100), 100) : 0;
  const barColor = isOver ? "#DC2626" : willExceed ? "#F59E0B" : "#22C55E";

  const filteredCats = selectedCat === "all"
    ? data.categories
    : data.categories.filter(c => c.category === selectedCat);

  return (
    <div className="space-y-3">

      {/* Weekly / Monthly Toggle */}
      <div className="flex gap-2">
        <button onClick={() => { setView("weekly"); setSelectedCat("all"); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${view === "weekly" ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"}`}>
          Weekly
        </button>
        <button onClick={() => { setView("monthly"); setSelectedCat("all"); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${view === "monthly" ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"}`}>
          Monthly
        </button>
      </div>

      {/* Main Budget Card */}
      {hasBudget ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          {/* Budget and Spent */}
          <div className="flex items-end justify-between mb-1">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Spent</p>
              <p className="text-3xl font-bold text-gray-900">{fmt(o.spent)}</p>
            </div>
            <p className="text-sm text-gray-400 mb-1">of {fmt(o.budget!)} budget</p>
          </div>

          {/* Progress */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all" style={{ width: `${spentPct}%`, backgroundColor: barColor }} />
          </div>

          {/* Simple sentence */}
          <div className={`rounded-xl p-4 mb-3 ${isOver ? "bg-red-50" : willExceed ? "bg-amber-50" : "bg-green-50"}`}>
            {isOver ? (
              <p className="text-sm text-red-700">
                <span className="font-bold">You crossed your {periodName} budget.</span> You&apos;re {fmt(o.spent - o.budget!)} over.
                {o.days_remaining > 0 && ` Try to avoid spending for the next ${o.days_remaining} day${o.days_remaining > 1 ? "s" : ""}.`}
              </p>
            ) : willExceed ? (
              <p className="text-sm text-amber-700">
                <span className="font-bold">You&apos;d spend {fmt(o.projected)} by end of the {periodName}.</span> That&apos;s {fmt(o.projected - o.budget!)} over budget.
                {o.safe_daily_limit !== null && ` Reduce to ${fmt(o.safe_daily_limit)}/day to stay within budget.`}
              </p>
            ) : (
              <p className="text-sm text-green-700">
                <span className="font-bold">You&apos;re on track!</span> {fmt(o.remaining_budget!)} left for {o.days_remaining} day{o.days_remaining > 1 ? "s" : ""}.
                {o.safe_daily_limit !== null && ` You can safely spend ${fmt(o.safe_daily_limit)}/day.`}
              </p>
            )}
          </div>

          {/* 3 stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-400">Your rate</p>
              <p className="font-bold text-sm text-gray-900">{fmt(o.daily_rate)}/day</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-400">Day {o.days_elapsed}</p>
              <p className="font-bold text-sm text-gray-900">{o.days_remaining}d left</p>
            </div>
            <div className={`rounded-xl p-2.5 text-center ${willExceed || isOver ? "bg-red-50" : "bg-green-50"}`}>
              <p className="text-[10px] text-gray-400">Safe limit</p>
              <p className={`font-bold text-sm ${willExceed || isOver ? "text-red-600" : "text-green-600"}`}>
                {o.safe_daily_limit !== null ? `${fmt(o.safe_daily_limit)}/day` : "-"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* No budget — simple estimation */
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">You spent {fmt(o.spent)} in {o.days_elapsed} day{o.days_elapsed > 1 ? "s" : ""}</p>
          <p className="text-gray-900 text-lg font-bold">
            At this rate, you&apos;d spend <span className="text-[#E65100]">{fmt(o.projected)}</span> by end of the {periodName}
          </p>
          <p className="text-xs text-gray-400 mt-2">Spending rate: {fmt(o.daily_rate)}/day — {o.days_remaining} day{o.days_remaining > 1 ? "s" : ""} remaining</p>
          <p className="text-xs text-gray-400 mt-1">Set a {periodName}ly budget to get detailed predictions</p>
        </div>
      )}

      {/* Category Filter Pills */}
      {data.categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCat("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedCat === "all" ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"
            }`}>
            All
          </button>
          {data.categories.map((cat) => {
            const c = view === "weekly" ? cat.weekly : cat.monthly;
            const color = categoryColors[cat.category] || "#546E7A";
            return (
              <button key={cat.category} onClick={() => setSelectedCat(cat.category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition flex items-center gap-1.5 ${
                  selectedCat === cat.category ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"
                }`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selectedCat === cat.category ? "white" : color }} />
                {cat.category}
              </button>
            );
          })}
        </div>
      )}

      {/* Category Cards */}
      {filteredCats.length > 0 && (
        <div className="space-y-2">
          {filteredCats.map((cat) => {
            const c = view === "weekly" ? cat.weekly : cat.monthly;
            const color = categoryColors[cat.category] || "#546E7A";
            const hasCatBudget = c.budget_limit !== null && c.budget_limit > 0;
            const remaining = hasCatBudget ? Math.max(0, c.budget_limit! - c.spent) : null;
            const catOver = hasCatBudget && c.spent > c.budget_limit!;
            const catWillExceed = c.status === "will_exceed";
            const catWarning = c.status === "warning";
            const pct = hasCatBudget ? Math.min(Math.round((c.spent / c.budget_limit!) * 100), 100) : null;
            const catBarColor = catOver ? "#DC2626" : catWillExceed ? "#F59E0B" : catWarning ? "#F59E0B" : "#22C55E";

            return (
              <div key={cat.category} className="bg-white rounded-2xl p-4 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: `${color}15`, color }}>
                      {cat.category.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 capitalize">{cat.category}</p>
                      <p className="text-[11px] text-gray-400">{fmt(c.daily_rate)}/day avg</p>
                    </div>
                  </div>
                  {c.status && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                      catOver || catWillExceed ? "bg-red-50 text-red-600"
                        : catWarning ? "bg-amber-50 text-amber-600"
                        : "bg-green-50 text-green-600"
                    }`}>
                      {catOver ? "Over" : catWillExceed ? "Will Exceed" : catWarning ? "Warning" : "On Track"}
                    </span>
                  )}
                </div>

                {hasCatBudget ? (
                  <>
                    {/* Spent of Budget */}
                    <div className="flex items-end justify-between mb-1">
                      <p className="text-lg font-bold text-gray-900">{fmt(c.spent)}</p>
                      <p className="text-xs text-gray-400">of {fmt(c.budget_limit!)}</p>
                    </div>

                    {/* Progress */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: catBarColor }} />
                    </div>

                    {/* Remaining or Over */}
                    <p className={`text-sm font-medium ${catOver ? "text-red-600" : "text-green-600"}`}>
                      {catOver
                        ? `${fmt(c.spent - c.budget_limit!)} over budget`
                        : `${fmt(remaining!)} remaining`
                      }
                    </p>

                    {/* Projection */}
                    <p className="text-xs text-gray-400 mt-1">
                      Projected: {fmt(c.projected)} by end of {periodName}
                      {catWillExceed && !catOver && ` — ${fmt(c.projected - c.budget_limit!)} over budget`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-gray-900">{fmt(c.spent)} spent</p>
                    <p className="text-xs text-gray-400 mt-1">
                      At {fmt(c.daily_rate)}/day, you&apos;d spend {fmt(c.projected)} by end of {periodName}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data.categories.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="font-semibold text-gray-900">No expenses yet</p>
          <p className="text-sm text-gray-400 mt-1">Add expenses to see predictions</p>
        </div>
      )}
    </div>
  );
}
