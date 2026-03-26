"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { CategoryBreakdown } from "@/types";

const COLORS = ["#f97316", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#22c55e", "#06b6d4", "#64748b"];

interface SpendingPieChartProps {
  data: CategoryBreakdown[];
}

export function SpendingPieChart({ data }: SpendingPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-center h-80">
        <p className="text-slate-400">No spending data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(props: PieLabelRenderProps) => `${props.name || ''} ${Math.round((props.percent || 0) * 100)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#e2e8f0" }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
