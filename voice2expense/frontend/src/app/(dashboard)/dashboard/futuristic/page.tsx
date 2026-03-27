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
  today: string;
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
  const [view, setView] = useState<"monthly" | "weekly">("weekly");
  const [selectedCat, setSelectedCat] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/analytics/futuristic");
        setData(res);
      } catch {
        console.error("Failed to fetch predictions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <p className="text-gray-900 font-semibold">Could not load predictions</p>
        <p className="text-sm text-gray-400 mt-1">Please try again later</p>
      </div>
    );
  }

  const o = view === "monthly" ? data.overall.monthly : data.overall.weekly;
  const periodLabel = view === "monthly" ? "Month" : "Week";
  const totalDays = o.days_elapsed + o.days_remaining;
  const spentPct = o.budget ? Math.min(Math.round((o.spent / o.budget) * 100), 100) : 0;
  const projectedPct = o.budget ? Math.round((o.projected / o.budget) * 100) : 0;
  const isOver = o.budget ? o.projected > o.budget : false;

  const filteredCats = selectedCat === "all"
    ? data.categories
    : data.categories.filter(c => c.category === selectedCat);

  return (
    <div className="space-y-3">
      {/* Period Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setView("weekly")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${view === "weekly" ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"}`}>
          Weekly
        </button>
        <button onClick={() => setView("monthly")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${view === "monthly" ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"}`}>
          Monthly
        </button>
      </div>

      {/* Budget vs Spending Card */}
      {o.budget ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Budget</p>
              <p className="text-lg font-bold text-gray-900">{fmt(o.budget)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Spent</p>
              <p className="text-lg font-bold text-[#E65100]">{fmt(o.spent)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">You&apos;d spend</p>
              <p className={`text-lg font-bold ${isOver ? "text-red-600" : "text-green-600"}`}>{fmt(o.projected)}</p>
            </div>
          </div>

          {/* Budget progress */}
          <div className="mb-4">
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute h-full rounded-full bg-[#E65100] transition-all" style={{ width: `${spentPct}%` }} />
              {projectedPct > spentPct && (
                <div className="absolute h-full rounded-full transition-all opacity-30"
                  style={{ left: `${spentPct}%`, width: `${Math.min(projectedPct - spentPct, 100 - spentPct)}%`, backgroundColor: isOver ? "#DC2626" : "#E65100" }} />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{spentPct}% spent</span>
              <span>{projectedPct}% projected</span>
            </div>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase">You spend</p>
              <p className="font-bold text-gray-900 text-sm">{fmt(o.daily_rate)}/day</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${isOver ? "bg-red-50" : "bg-green-50"}`}>
              <p className="text-[10px] text-gray-400 uppercase">Safe limit</p>
              <p className={`font-bold text-sm ${isOver ? "text-red-600" : "text-green-600"}`}>
                {o.safe_daily_limit !== null ? `${fmt(o.safe_daily_limit)}/day` : "-"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase">{o.days_remaining}d left</p>
              <p className="font-bold text-gray-900 text-sm">
                {o.remaining_budget !== null ? fmt(o.remaining_budget) : "-"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* No budget set — show basic projection */
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">You spent {fmt(o.spent)} in {o.days_elapsed} days</p>
          <p className="text-sm text-gray-900 font-semibold mb-3">
            At this rate, you would spend <span className="text-[#E65100] text-xl font-bold">{fmt(o.projected)}</span> by end of the {periodLabel.toLowerCase()}
          </p>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Your spending rate: <span className="font-bold text-gray-900">{fmt(o.daily_rate)}/day</span> with {o.days_remaining} days remaining</p>
          </div>
        </div>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((insight, i) => {
            const isWarn = insight.includes("exceed") || insight.includes("Reduce") || insight.includes("limit spending");
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

      {/* Category Filter - horizontal scroll */}
      {data.categories.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setSelectedCat("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCat === "all" ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"
              }`}>
              All Categories
            </button>
            {data.categories.map((cat) => (
              <button key={cat.category} onClick={() => setSelectedCat(cat.category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition ${
                  selectedCat === cat.category ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"
                }`}>
                {cat.category}
              </button>
            ))}
          </div>

          {/* Category Cards */}
          <div className="space-y-2">
            {filteredCats.map((cat) => {
              const c = view === "monthly" ? cat.monthly : cat.weekly;
              const color = categoryColors[cat.category] || "#546E7A";
              const hasBudget = c.budget_limit !== null && c.budget_limit > 0;
              const pct = hasBudget ? Math.round((c.spent / c.budget_limit!) * 100) : null;
              const projPct = hasBudget ? Math.round((c.projected / c.budget_limit!) * 100) : null;
              const willExceed = c.status === "will_exceed";
              const isWarning = c.status === "warning";

              return (
                <div key={cat.category} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: `${color}15`, color }}>
                        {cat.category.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-gray-900 capitalize">{cat.category}</p>
                    </div>
                    {c.status && (
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                        willExceed ? "bg-red-50 text-red-600" : isWarning ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                      }`}>
                        {willExceed ? "Will Exceed" : isWarning ? "Warning" : "On Track"}
                      </span>
                    )}
                  </div>

                  <div className={`grid ${hasBudget ? "grid-cols-4" : "grid-cols-3"} gap-2 text-center mb-3`}>
                    <div>
                      <p className="text-[10px] text-gray-400">Spent</p>
                      <p className="font-bold text-sm text-gray-900">{fmt(c.spent)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Rate</p>
                      <p className="font-bold text-sm text-gray-900">{fmt(c.daily_rate)}/d</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Projected</p>
                      <p className={`font-bold text-sm ${willExceed ? "text-red-600" : "text-gray-900"}`}>{fmt(c.projected)}</p>
                    </div>
                    {hasBudget && (
                      <div>
                        <p className="text-[10px] text-gray-400">Budget</p>
                        <p className="font-bold text-sm text-gray-900">{fmt(c.budget_limit!)}</p>
                      </div>
                    )}
                  </div>

                  {hasBudget && pct !== null && projPct !== null && (
                    <div className="mb-2">
                      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="absolute h-full rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: willExceed ? "#DC2626" : isWarning ? "#F59E0B" : "#22C55E" }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{pct}% used — {projPct}% projected</p>
                    </div>
                  )}

                  {c.insight && (
                    <p className={`text-xs ${willExceed ? "text-red-500" : isWarning ? "text-amber-500" : "text-green-500"}`}>
                      {c.insight}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {data.categories.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="font-semibold text-gray-900">No expense data yet</p>
          <p className="text-sm text-gray-400 mt-1">Add expenses to see spending predictions</p>
        </div>
      )}
    </div>
  );
}
