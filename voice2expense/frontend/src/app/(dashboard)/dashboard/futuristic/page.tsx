"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface CategoryPrediction {
  category: string;
  monthly: {
    spent: number;
    projected: number;
    daily_rate: number;
    budget_limit: number | null;
    status: "on_track" | "warning" | "will_exceed" | null;
    insight: string | null;
  };
  weekly: {
    spent: number;
    projected: number;
    daily_rate: number;
    budget_limit: number | null;
    status: "on_track" | "warning" | "will_exceed" | null;
    insight: string | null;
  };
}

interface FuturisticData {
  today: string;
  overall: {
    weekly: {
      spent: number;
      projected: number;
      daily_rate: number;
      days_elapsed: number;
      days_remaining: number;
      period: string;
    };
    monthly: {
      spent: number;
      projected: number;
      daily_rate: number;
      days_elapsed: number;
      days_remaining: number;
      period: string;
    };
  };
  categories: CategoryPrediction[];
  insights: string[];
}

const fmt = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;

const statusColor = (s: string | null) => {
  if (s === "will_exceed") return { bg: "bg-red-50", text: "text-red-600", bar: "#DC2626", label: "Will Exceed" };
  if (s === "warning") return { bg: "bg-amber-50", text: "text-amber-600", bar: "#F59E0B", label: "Warning" };
  return { bg: "bg-green-50", text: "text-green-600", bar: "#22C55E", label: "On Track" };
};

const categoryColors: Record<string, string> = {
  food: "#E65100", transport: "#1565C0", entertainment: "#7B1FA2",
  shopping: "#C2185B", bills: "#F9A825", health: "#2E7D32",
  education: "#00838F", other: "#546E7A",
};

export default function FuturisticPage() {
  const [data, setData] = useState<FuturisticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"monthly" | "weekly">("monthly");

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

  const overall = view === "monthly" ? data.overall.monthly : data.overall.weekly;
  const periodLabel = view === "monthly" ? "Month" : "Week";

  return (
    <div className="space-y-4">
      {/* Period Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("weekly")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
            view === "weekly" ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"
          }`}
        >
          Weekly Forecast
        </button>
        <button
          onClick={() => setView("monthly")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
            view === "monthly" ? "bg-[#E65100] text-white" : "bg-white text-gray-900 shadow-sm"
          }`}
        >
          Monthly Forecast
        </button>
      </div>

      {/* Overall Projection Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">{periodLabel}ly Projection</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{fmt(overall.projected)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Spent so far</p>
            <p className="text-lg font-bold text-[#E65100]">{fmt(overall.spent)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>Day {overall.days_elapsed}</span>
            <span>{overall.days_remaining} days left</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E65100] transition-all"
              style={{ width: `${Math.min((overall.days_elapsed / (overall.days_elapsed + overall.days_remaining)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Daily Rate</p>
            <p className="font-bold text-gray-900">{fmt(overall.daily_rate)}</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Remaining to Spend</p>
            <p className="font-bold text-gray-900">{fmt(Math.max(0, overall.projected - overall.spent))}</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((insight, i) => {
            const isWarning = insight.includes("exceed") || insight.includes("may exceed");
            const isGood = insight.includes("on track") || insight.includes("within budget");
            return (
              <div
                key={i}
                className={`px-4 py-3 rounded-2xl text-sm flex items-start gap-3 ${
                  isWarning ? "bg-red-50 text-red-700" : isGood ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {isWarning ? (
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

      {/* Category Predictions */}
      {data.categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Category Forecast</h3>
          <div className="space-y-2">
            {data.categories.map((cat) => {
              const c = view === "monthly" ? cat.monthly : cat.weekly;
              const s = statusColor(c.status);
              const pct = c.budget_limit ? Math.min(Math.round((c.projected / c.budget_limit) * 100), 150) : null;
              const color = categoryColors[cat.category] || "#546E7A";

              return (
                <div key={cat.category} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: `${color}15`, color }}>
                        {cat.category.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 capitalize text-sm">{cat.category}</p>
                        <p className="text-[11px] text-gray-400">
                          {fmt(c.daily_rate)}/day
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {c.status && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>
                          {s.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Spent: {fmt(c.spent)}</span>
                    <span>Projected: {fmt(c.projected)}</span>
                  </div>

                  {c.budget_limit && pct !== null && (
                    <div className="mb-2">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: s.bar,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                        <span>{pct}% of {fmt(c.budget_limit)} budget</span>
                      </div>
                    </div>
                  )}

                  {c.insight && (
                    <p className={`text-xs mt-1 ${c.status === "will_exceed" ? "text-red-500" : c.status === "warning" ? "text-amber-500" : "text-green-500"}`}>
                      {c.insight}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.categories.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
          <p className="font-semibold text-gray-900">No expense data yet</p>
          <p className="text-sm text-gray-400 mt-1">Add expenses to see spending predictions</p>
        </div>
      )}
    </div>
  );
}
