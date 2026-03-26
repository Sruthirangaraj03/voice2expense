"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AnalyticsSummary, CategoryBreakdown, TrendPoint } from "@/types";
import { KPICards } from "@/components/dashboard/KPICards";
import { SpendingPieChart } from "@/components/dashboard/SpendingPieChart";
import { TrendLineChart } from "@/components/dashboard/TrendLineChart";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setError(false);
    try {
      const [s, b, t] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get("/api/analytics/breakdown"),
        api.get("/api/analytics/trends"),
      ]);
      setSummary(s);
      setBreakdown(b);
      setTrends(t);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-80 bg-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-400 text-lg mb-4">Failed to load dashboard data</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <VoiceRecorder onSuccess={fetchData} />
      </div>

      {summary && <KPICards summary={summary} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpendingPieChart data={breakdown} />
        <TrendLineChart data={trends} />
      </div>
    </div>
  );
}
