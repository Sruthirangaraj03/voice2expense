"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AnalyticsSummary, CategoryBreakdown, Expense } from "@/types";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = async () => {
    setError(false);
    try {
      const [s, b, e] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get("/api/analytics/breakdown"),
        api.get("/api/expenses?limit=5"),
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleAiQuery = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await api.post("/api/ai/query", { question: aiQuery });
      setAiAnswer(res.answer);
    } catch {
      setAiAnswer("Sorry, couldn't process that question.");
    } finally {
      setAiLoading(false);
    }
  };

  const categoryIcons: Record<string, string> = {
    food: "🍽️", transport: "🚗", entertainment: "🎬", shopping: "🛍️",
    bills: "📄", health: "💊", education: "📚", other: "📦",
  };

  const categoryColors: Record<string, string> = {
    food: "#E65100", transport: "#1565C0", entertainment: "#7B1FA2",
    shopping: "#C2185B", bills: "#F9A825", health: "#2E7D32",
    education: "#00838F", other: "#546E7A",
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-44 bg-white rounded-2xl" />
        <div className="h-20 bg-white rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-white rounded-2xl" />
          <div className="h-24 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">Failed to load data</p>
        <button onClick={fetchData} className="px-6 py-3 bg-[#E65100] text-white rounded-2xl font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top row: Voice + AI side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Voice Record Card */}
      <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
        <p className="text-gray-500 text-sm mb-4">Record Expense</p>
        <VoiceRecorder onSuccess={fetchData} />
        <p className="text-[#E65100] text-xs font-semibold tracking-widest mt-3">
          TAP TO SPEAK
        </p>
      </div>

      {/* AI Assistant */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✨</span>
          <span className="font-semibold text-sm">Ask AI Assistant</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
            placeholder="How much did I spend on food today?"
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30"
          />
          <button
            onClick={handleAiQuery}
            disabled={aiLoading}
            className="px-3 py-2.5 bg-[#E65100] text-white rounded-xl"
          >
            {aiLoading ? "..." : "🔍"}
          </button>
        </div>
        {aiAnswer && (
          <div className="mt-3 p-3 bg-orange-50 rounded-xl text-sm text-gray-700">
            {aiAnswer}
          </div>
        )}
      </div>
      </div>{/* end top row grid */}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl font-bold mt-1">{summary?.transaction_count || 0} <span className="text-base font-normal text-gray-400">entries</span></p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider">This Month</p>
          <p className="text-2xl font-bold mt-1">₹{(summary?.total_spent || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Avg Expense</p>
          <p className="text-2xl font-bold mt-1">₹{Math.round(summary?.average_expense || 0).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Pie Chart - Category Breakdown */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Spending by Category</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0;
                  return breakdown.map((item, i) => {
                    const pct = item.percentage / 100;
                    const circumference = Math.PI * 80;
                    const dash = pct * circumference;
                    const el = (
                      <circle
                        key={i}
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={categoryColors[item.category] || "#546E7A"}
                        strokeWidth="12"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold">₹{(summary?.total_spent || 0).toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-gray-400">TOTAL</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {breakdown.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: categoryColors[item.category] || "#546E7A" }}
                    />
                    <span className="capitalize">{item.category}</span>
                  </div>
                  <span className="text-gray-500">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentExpenses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Activity</h3>
            <a href="/dashboard/expenses" className="text-[#E65100] text-sm font-medium">
              SEE ALL
            </a>
          </div>
          <div className="space-y-2">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${categoryColors[expense.category] || "#546E7A"}15` }}
                  >
                    {categoryIcons[expense.category] || "📦"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{expense.description || expense.category}</p>
                    <p className="text-xs text-gray-400">{expense.date}</p>
                  </div>
                </div>
                <span className="font-semibold">₹{Number(expense.amount).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentExpenses.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">🧾</div>
          <h3 className="font-bold text-lg mb-2">No expenses logged yet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Tap the microphone to record your first transaction using voice AI.
          </p>
        </div>
      )}
    </div>
  );
}
