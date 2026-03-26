"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Prediction } from "@/types";
import { ChatAssistant } from "@/components/ai/ChatAssistant";

export default function InsightsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [generatingPredictions, setGeneratingPredictions] = useState(false);

  const handleGeneratePredictions = async () => {
    setGeneratingPredictions(true);
    try {
      const data = await api.post("/api/predictions/generate", {});
      if (data.predictions) {
        const fetched = await api.get("/api/predictions");
        setPredictions(fetched);
      }
    } catch (err) {
      console.error("Prediction failed:", err);
      toast.error('Failed to generate predictions. You may need more expense history.');
    } finally {
      setGeneratingPredictions(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">AI Insights</h2>

      {/* AI Chat */}
      <ChatAssistant />

      {/* Predictions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Spending Predictions</h3>
          <button
            onClick={handleGeneratePredictions}
            disabled={generatingPredictions}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition disabled:opacity-50"
          >
            {generatingPredictions ? "Generating..." : "Generate Predictions"}
          </button>
        </div>

        {predictions.length === 0 ? (
          <p className="text-slate-400 text-sm">
            Click &quot;Generate Predictions&quot; to forecast next month&apos;s spending based on your history.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-lg border ${
                  p.risk_flag
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-slate-700/50 border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium capitalize">{p.category}</span>
                  {p.risk_flag && <span className="text-xs text-red-400 font-medium">HIGH RISK</span>}
                </div>
                <div className="text-2xl font-bold text-white">
                  ₹{p.predicted_amount.toLocaleString('en-IN')}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  Confidence: {Math.round(p.confidence_score * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
