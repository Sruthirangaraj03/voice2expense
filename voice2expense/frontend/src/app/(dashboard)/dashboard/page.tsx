"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { AnalyticsSummary, CategoryBreakdown, Expense } from "@/types";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

const categoryColors: Record<string, string> = {
  food: "#E65100", transport: "#1565C0", shopping: "#C2185B",
  bills: "#F9A825", health: "#2E7D32", fitness: "#00897B",
  entertainment: "#7B1FA2", education: "#00838F", grooming: "#D81B60",
  clothing: "#5C6BC0", maintenance: "#6D4C41", travel: "#0277BD",
  family: "#AD1457", investments: "#2E7D32", donations: "#FF6F00",
  other: "#546E7A",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-400">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const autoRecord = searchParams.get("record") === "true";
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<AnalyticsSummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<AnalyticsSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterCat, setFilterCat] = useState("");

  const fetchData = async () => {
    setError(false);
    try {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diffToMonday);
      const weekFrom = weekStart.toISOString().split("T")[0];
      const monthFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const today = now.toISOString().split("T")[0];

      const [s, ws, ms, b, e] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get(`/api/analytics/summary?from=${weekFrom}&to=${today}`),
        api.get(`/api/analytics/summary?from=${monthFrom}&to=${today}`),
        api.get("/api/analytics/breakdown"),
        api.get(`/api/expenses?limit=10${filterCat ? `&category=${filterCat}` : ""}`),
      ]);
      setSummary(s);
      setWeeklySummary(ws);
      setMonthlySummary(ms);
      setBreakdown(b);
      setRecentExpenses(e.data);
    } catch (err) {
      console.error("Failed to fetch:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterCat]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl" />)}
        </div>
        <div className="h-24 bg-white rounded-xl" />
        <div className="h-16 bg-white rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 mb-3 text-sm">Failed to load data</p>
        <button onClick={fetchData} className="px-5 py-2.5 bg-[#E65100] text-white rounded-xl text-sm font-medium">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-3 min-w-0">

      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Welcome back</h2>
        <p className="text-xs text-gray-400 mt-0.5">Tap the mic to record expenses by voice</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-400 uppercase font-medium">Entries</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.transaction_count || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-400 uppercase font-medium">This Week</p>
          <p className="text-base font-bold text-gray-900 mt-1">{"\u20B9"}{(weeklySummary?.total_spent || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-400 uppercase font-medium">This Month</p>
          <p className="text-base font-bold text-gray-900 mt-1">{"\u20B9"}{(monthlySummary?.total_spent || 0).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Voice Recorder — full width */}
      <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
        <VoiceRecorder onSuccess={fetchData} autoStart={autoRecord} />
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Record Expense</p>
          <p className="text-xs text-gray-400 mt-0.5">Tap the mic and speak naturally</p>
        </div>
      </div>

      {/* Spending by Category */}
      {breakdown.length > 0 && (() => {
        const maxTotal = Math.max(...breakdown.map((b) => b.total));
        const totalSpent = breakdown.reduce((s, b) => s + b.total, 0);
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header with donut */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Spending Breakdown</h3>
                <p className="text-xs text-gray-400 mt-0.5">{breakdown.length} categories</p>
              </div>
              <div className="relative w-12 h-12">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  {(() => {
                    let offset = 0;
                    return breakdown.map((item, i) => {
                      const circ = Math.PI * 80;
                      const dash = (item.percentage / 100) * circ;
                      const el = (
                        <circle key={i} cx="50" cy="50" r="40" fill="none"
                          stroke={categoryColors[item.category] || "#546E7A"}
                          strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={-offset} />
                      );
                      offset += dash;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">{breakdown.length}</span>
                </div>
              </div>
            </div>

            {/* Category rows */}
            <div className="px-4 pb-3 space-y-3">
              {breakdown.map((item) => {
                const barWidth = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                const color = categoryColors[item.category] || "#546E7A";
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}15`, color }}>
                          <CategoryIcon category={item.category} />
                        </div>
                        <span className="capitalize text-sm font-medium text-gray-800 truncate">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-sm font-bold text-gray-900">Rs.{item.total.toLocaleString("en-IN")}</span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${color}15`, color }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer total */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase">Total Spent</span>
              <span className="text-sm font-bold text-gray-900">Rs.{totalSpent.toLocaleString("en-IN")}</span>
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      {breakdown.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide min-w-0">
          {["", ...breakdown.map((b) => b.category)].map((c) => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap capitalize active:scale-95 transition ${filterCat === c ? "bg-[#E65100] text-white shadow-sm" : "bg-white text-gray-500"}`}>
              {c || "All"}
            </button>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {recentExpenses.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-gray-800">Recent Activity</h3>
            <Link href="/dashboard/expenses" className="text-[#E65100] text-xs font-semibold">See All</Link>
          </div>
          <div className="space-y-1.5">
            {recentExpenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-3 shadow-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${categoryColors[e.category] || "#546E7A"}12`, color: categoryColors[e.category] || "#546E7A" }}>
                  <CategoryIcon category={e.category} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-medium text-sm text-gray-900 truncate">{e.description || e.category}</p>
                    <span className="font-bold text-sm text-gray-900 flex-shrink-0">Rs.{Number(e.amount).toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {e.sub_type && <span className="text-[#E65100] capitalize">{e.sub_type} &middot; </span>}
                    {e.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-sm">No expenses yet</p>
          <p className="text-xs text-gray-400 mt-1">Tap the microphone above to get started</p>
        </div>
      )}
    </div>
  );
}
