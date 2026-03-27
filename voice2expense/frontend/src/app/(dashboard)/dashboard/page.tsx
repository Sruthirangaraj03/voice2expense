"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { AnalyticsSummary, CategoryBreakdown, Expense } from "@/types";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  food: "#E65100", transport: "#1565C0", entertainment: "#7B1FA2",
  shopping: "#C2185B", bills: "#F9A825", health: "#2E7D32",
  education: "#00838F", other: "#546E7A",
};

const categoryIcons: Record<string, string> = {
  food: "F", transport: "T", entertainment: "E", shopping: "S",
  bills: "B", health: "H", education: "Ed", other: "O",
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const autoRecord = searchParams.get("record") === "true";
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [filterCat, setFilterCat] = useState("");

  const fetchData = async () => {
    setError(false);
    try {
      const [s, b, e] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get("/api/analytics/breakdown"),
        api.get(`/api/expenses?limit=10${filterCat ? `&category=${filterCat}` : ""}`),
      ]);
      setSummary(s);
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

  const handleAiQuery = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await api.post("/api/ai/query", { question: aiQuery });
      setAiAnswer(res.answer);
    } catch {
      setAiAnswer("Sorry, couldn't process that.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-white rounded-2xl" />
          <div className="h-20 bg-white rounded-2xl" />
          <div className="h-20 bg-white rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-40 bg-white rounded-2xl" />
          <div className="h-40 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 mb-4">Failed to load data</p>
        <button onClick={fetchData} className="px-6 py-3 bg-[#E65100] text-white rounded-2xl font-medium">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Row 1: Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold mt-1">{summary?.transaction_count || 0}</p>
          <p className="text-[10px] text-gray-400">entries</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">This Month</p>
          <p className="text-xl font-bold mt-1">Rs.{(summary?.total_spent || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Average</p>
          <p className="text-xl font-bold mt-1">Rs.{Math.round(summary?.average_expense || 0).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* ── Row 2: Mic (left) + AI Assistant (right) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mic */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center">
          <p className="text-gray-400 text-xs mb-4 uppercase tracking-wider">Record Expense</p>
          <VoiceRecorder onSuccess={fetchData} autoStart={autoRecord} />
          <p className="text-[#E65100] text-[10px] font-bold tracking-[0.2em] mt-3 uppercase">Tap to speak</p>
        </div>

        {/* AI Assistant */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#E65100] font-bold text-sm">AI Assistant</span>
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
              placeholder="How much did I spend on food?"
              className="w-full px-4 py-3 pr-10 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/20"
            />
            <button onClick={handleAiQuery} disabled={aiLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E65100]">
              {aiLoading ? "..." : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
          {aiAnswer && (
            <div className="mt-3 p-3 bg-orange-50 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {aiAnswer.replace(/\*\*/g, "").replace(/\*/g, "")}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Category Chart ── */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm mb-4">Spending by Category</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0;
                  return breakdown.map((item, i) => {
                    const circ = Math.PI * 80;
                    const dash = (item.percentage / 100) * circ;
                    const el = (
                      <circle key={i} cx="50" cy="50" r="40" fill="none"
                        stroke={categoryColors[item.category] || "#546E7A"}
                        strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={-offset} />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold">Rs.{(summary?.total_spent || 0).toLocaleString("en-IN")}</span>
                <span className="text-[9px] text-gray-400">TOTAL</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {breakdown.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[item.category] || "#546E7A" }} />
                    <span className="capitalize text-xs">{item.category}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Row 4: Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "food", "transport", "entertainment", "shopping", "bills", "health", "education", "other"].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filterCat === c ? "bg-[#E65100] text-white" : "bg-white text-gray-500 shadow-sm"}`}>
            {c ? c.charAt(0).toUpperCase() + c.slice(1) : "All"}
          </button>
        ))}
      </div>

      {/* ── Row 5: Recent Activity ── */}
      {recentExpenses.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Recent Activity</h3>
            <Link href="/dashboard/expenses" className="text-[#E65100] text-xs font-semibold uppercase">See All</Link>
          </div>
          <div className="space-y-2">
            {recentExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-white rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${categoryColors[e.category] || "#546E7A"}12`, color: categoryColors[e.category] || "#546E7A" }}>
                    {categoryIcons[e.category] || "O"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{e.description || e.category}</p>
                    <p className="text-[11px] text-gray-400">
                      {e.sub_type && <span className="text-[#E65100] capitalize">{e.sub_type} &middot; </span>}
                      {e.date}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-sm">Rs.{Number(e.amount).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <h3 className="font-semibold mb-1">No expenses yet</h3>
          <p className="text-gray-400 text-xs">Tap the microphone to record your first expense</p>
        </div>
      )}
    </div>
  );
}
