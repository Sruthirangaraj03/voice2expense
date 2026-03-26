"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TrendPoint } from "@/types";

interface TrendLineChartProps {
  data: TrendPoint[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-center h-80">
        <p className="text-slate-400">No trend data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Spending Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(val) => val.slice(5)}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, "Spent"]}
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#e2e8f0" }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
