"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { BudgetStatus } from "@/types";

const categories = ["food", "transport", "shopping", "bills", "health", "fitness", "entertainment", "education", "grooming", "clothing", "maintenance", "travel", "family", "investments", "donations", "other"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [history, setHistory] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [category, setCategory] = useState("food");
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("monthly");
  const [limitAmount, setLimitAmount] = useState("");

  // Voice budget state
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const counterRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (voiceRecording) {
      setVoiceSeconds(0);
      counterRef.current = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    } else {
      if (counterRef.current) clearInterval(counterRef.current);
    }
    return () => { if (counterRef.current) clearInterval(counterRef.current); };
  }, [voiceRecording]);

  const fetchBudgets = async () => {
    try {
      const data = await api.get("/api/budgets/status");
      setBudgets(data);
    } catch { console.error("Failed"); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      const data = await api.get("/api/budgets/history");
      setHistory(data);
    } catch { console.error("Failed to fetch history"); }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/budgets", {
        category,
        period_type: periodType,
        limit_amount: parseFloat(limitAmount),
      });
      setShowForm(false);
      setLimitAmount("");
      toast.success("Budget set!");
      fetchBudgets();
    } catch { toast.error("Failed to create budget"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this budget?")) return;
    try {
      await api.delete(`/api/budgets/${id}`);
      toast.success("Removed");
      fetchBudgets();
    } catch { toast.error("Failed"); }
  };

  // Voice budget functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
        .find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoiceRecording(false);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size < 1000) { toast.error("Too short. Speak for at least 2 seconds."); return; }
        await processVoiceBudget(blob);
      };

      mr.start(250);
      setVoiceRecording(true);
      timerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      }, 20000);
    } catch {
      toast.error("Microphone access denied.");
    }
  };

  const stopVoiceRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const processVoiceBudget = async (blob: Blob) => {
    setVoiceProcessing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const filename = blob.type.includes("mp4") ? "recording.mp4" : "recording.webm";
      const res = await api.post("/api/ai/voice-budget", { audio: base64, filename });
      const count = res.saved_count || 0;
      if (count > 0) {
        toast.success(`${count} budget${count > 1 ? "s" : ""} set!`);
        fetchBudgets();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg.includes("Could not") ? "Couldn't understand. Try again." : msg);
    } finally {
      setVoiceProcessing(false);
    }
  };

  const weeklyBudgets = budgets.filter(b => b.period_type === "weekly");
  const monthlyBudgets = budgets.filter(b => b.period_type === "monthly");

  return (
    <div className="space-y-3">
      {/* Page Header + Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Budgets</h2>
          <p className="text-xs text-gray-400 mt-0.5">Set limits per category — get alerts before overspending</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={voiceRecording ? stopVoiceRecording : startVoiceRecording}
          disabled={voiceProcessing}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-50 ${
            voiceRecording ? "bg-red-500 animate-pulse" : "bg-[#E65100]"
          }`}
        >
          {voiceProcessing ? (
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : voiceRecording ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#E65100] text-white rounded-full text-sm font-medium">
          + Set Budget
        </button>
        </div>
      </div>

      {/* Voice Recording Modal */}
      {voiceRecording && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={stopVoiceRecording} />
          <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 animate-[slideUp_0.3s_ease-out]">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between px-6 pt-5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Recording</span>
                </div>
                <button onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); if (mediaRecorderRef.current?.state === "recording") { mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop()); } setVoiceRecording(false); }}
                  className="text-gray-300 hover:text-gray-500 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-center pt-6 pb-2">
                <p className="text-5xl font-extralight text-gray-900 tabular-nums tracking-widest">
                  {Math.floor(voiceSeconds / 60)}:{(voiceSeconds % 60).toString().padStart(2, "0")}
                </p>
              </div>
              <div className="flex items-center justify-center gap-[3px] h-12 px-8 my-4">
                {[...Array(18)].map((_, i) => (
                  <div key={i} className="w-[3px] bg-[#E65100] rounded-full animate-bounce"
                    style={{ height: `${6 + Math.random() * 18}px`, animationDelay: `${i * 50}ms`, animationDuration: "0.6s" }} />
                ))}
              </div>
              <p className="text-center text-gray-400 text-sm mb-6">
                Say: <span className="text-gray-300">&quot;set food budget 5000 monthly&quot;</span>
              </p>
              <div className="px-5 pb-6">
                <button onClick={stopVoiceRecording}
                  className="w-full py-4 bg-[#E65100] text-white rounded-xl font-bold text-base hover:bg-[#BF360C] transition active:scale-[0.98] flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Stop Recording
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Processing Modal */}
      {voiceProcessing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 animate-[slideUp_0.3s_ease-out]">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
              <div className="flex justify-center pt-8 pb-4">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-[#E65100]/5 animate-pulse" />
                  <div className="absolute -inset-8 rounded-full border border-[#E65100]/10 animate-[spin_8s_linear_infinite]" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#E65100] to-[#BF360C] flex items-center justify-center shadow-xl shadow-[#E65100]/20">
                    <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="text-center px-6 pb-8">
                <p className="text-lg font-bold text-gray-900">Setting your budget</p>
                <p className="text-gray-400 text-sm mt-1">Extracting category & amount...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm mb-4 sm:mb-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="text-lg font-bold text-gray-900">Set Budget</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 pb-6 pt-2 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase font-medium">Budget Period</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPeriodType("weekly")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${periodType === "weekly" ? "bg-[#E65100] text-white" : "bg-gray-100 text-gray-900"}`}>
                    Weekly
                  </button>
                  <button type="button" onClick={() => setPeriodType("monthly")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${periodType === "monthly" ? "bg-[#E65100] text-white" : "bg-gray-100 text-gray-900"}`}>
                    Monthly
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase font-medium">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20">
                  {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase font-medium">
                  {periodType === "weekly" ? "Weekly" : "Monthly"} Limit (INR)
                </label>
                <input type="number" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20" min="1" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#E65100] text-white rounded-xl font-medium hover:bg-[#BF360C] transition">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
          </svg>
          <p className="font-semibold">No active budgets</p>
          <p className="text-sm text-gray-400 mt-1">Tap the mic and say &quot;set food budget 5000&quot;</p>
        </div>
      ) : (
        <div className="space-y-5">
          {weeklyBudgets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Weekly Budgets</h3>
              <div className="space-y-3">
                {weeklyBudgets.map((b) => <BudgetCard key={b.id} budget={b} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {monthlyBudgets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Monthly Budgets</h3>
              <div className="space-y-3">
                {monthlyBudgets.map((b) => <BudgetCard key={b.id} budget={b} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(); }}
        className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition">
        {showHistory ? "Hide past budgets" : "View past budgets"}
      </button>

      {showHistory && history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Completed</h3>
          {history.map((b) => {
            const pct = Math.min(Math.round((Number(b.used_amount) / Number(b.limit_amount)) * 100), 100);
            return (
              <div key={b.id} className="bg-gray-50 rounded-2xl p-3 opacity-70">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize text-sm">{b.category}</span>
                  <span className="text-xs text-gray-400">
                    {b.period_type === "weekly" ? "W" : "M"} | {formatDate(b.period_start)} - {formatDate(b.period_end)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Rs.{Number(b.used_amount).toLocaleString("en-IN")} / Rs.{Number(b.limit_amount).toLocaleString("en-IN")}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gray-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showHistory && history.length === 0 && (
        <p className="text-center text-sm text-gray-400">No past budgets yet</p>
      )}
    </div>
  );
}

function BudgetCard({ budget: b, onDelete }: { budget: BudgetStatus; onDelete: (id: string) => void }) {
  const pct = Math.min(Math.round((Number(b.used_amount) / Number(b.limit_amount)) * 100), 100);
  const color = b.status === "exceeded" ? "#DC2626" : b.status === "warning" ? "#F59E0B" : "#22C55E";

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold capitalize">{b.category}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase font-medium">
            {b.period_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}15`, color }}>
            {b.status === "exceeded" ? "Over Budget" : b.status === "warning" ? "Warning" : "On Track"}
          </span>
          <button onClick={() => onDelete(b.id)} className="text-gray-300 text-xs hover:text-red-400">X</button>
        </div>
      </div>
      <div className="text-[11px] text-gray-400 mb-2">
        {formatDate(b.period_start)} - {formatDate(b.period_end)}
      </div>
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>Rs.{Number(b.used_amount).toLocaleString("en-IN")}</span>
        <span>Rs.{Number(b.limit_amount).toLocaleString("en-IN")}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
