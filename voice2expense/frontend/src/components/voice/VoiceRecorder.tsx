"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface VoiceRecorderProps {
  onSuccess?: () => void;
  autoStart?: boolean;
}

type ProcessStep = "captured" | "converting" | "transcribing" | "extracting" | "saving" | "done";

export function VoiceRecorder({ onSuccess, autoStart }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<ProcessStep>("captured");
  const [seconds, setSeconds] = useState(0);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(24).fill(4));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const counterRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);
  const autoStarted = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (autoStart && !autoStarted.current && !recording && !processing) {
      autoStarted.current = true;
      startRecording();
    }
  }, [autoStart]);

  // Live timer
  useEffect(() => {
    if (recording) {
      setSeconds(0);
      counterRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (counterRef.current) clearInterval(counterRef.current);
    }
    return () => { if (counterRef.current) clearInterval(counterRef.current); };
  }, [recording]);

  // Real audio visualizer
  const visualize = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(data);
      const bars = 24;
      const step = Math.floor(data.length / bars);
      const heights = Array.from({ length: bars }, (_, i) => {
        const val = data[i * step] || 0;
        return Math.max(4, (val / 255) * 48);
      });
      setWaveHeights(heights);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice recording not supported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup analyser for real waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
        .find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      cancelledRef.current = false;

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        analyserRef.current = null;
        audioCtx.close();
        setRecording(false);
        setWaveHeights(Array(24).fill(4));
        if (cancelledRef.current) { cancelledRef.current = false; return; }
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size < 1000) { toast.error("Too short. Speak for at least 2 seconds."); return; }
        if (blob.size > 3 * 1024 * 1024) { toast.error("Too long. Keep under 30 seconds."); return; }
        await processAudio(blob);
      };

      mr.start(250);
      setRecording(true);
      visualize();

      timerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          toast.info("Auto-stopped at 30s");
        }
      }, 30000);
    } catch {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelledRef.current = false;
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelledRef.current = true;
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setRecording(false);
    setWaveHeights(Array(24).fill(4));
  };

  const processAudio = async (blob: Blob) => {
    setProcessing(true);
    setProcessStep("captured");
    try {
      await new Promise((r) => setTimeout(r, 300));
      setProcessStep("converting");
      let audioBlob: Blob;
      let filename: string;
      try {
        audioBlob = await convertToWav(blob);
        filename = "recording.wav";
      } catch {
        audioBlob = blob;
        filename = blob.type.includes("mp4") ? "recording.mp4" : "recording.webm";
      }

      setProcessStep("transcribing");
      const base64 = await blobToBase64(audioBlob);

      setProcessStep("extracting");
      const res = await api.post("/api/ai/voice-log", { audio: base64, filename });

      setProcessStep("saving");
      await new Promise((r) => setTimeout(r, 400));

      setProcessStep("done");
      const count = res.saved_count || 1;
      toast.success(`${count} expense${count > 1 ? "s" : ""} added!`);

      if (res.budget_alerts && res.budget_alerts.length > 0) {
        for (const a of res.budget_alerts) {
          const remaining = Number(a.remaining);
          setTimeout(() => {
            if (remaining <= 0) {
              toast.error(`Exceeded ${a.period_type} ${a.category} budget of Rs.${Number(a.limit).toLocaleString("en-IN")}!`);
            } else {
              toast(`Rs.${remaining.toLocaleString("en-IN")} left for ${a.category}`, { duration: 4000 });
            }
          }, 500);
        }
      }

      await new Promise((r) => setTimeout(r, 600));
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg.includes("Could not") ? "Couldn't understand. Try again." : `Failed: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const ctx = new AudioContext({ sampleRate: 16000 });
    const ab = await blob.arrayBuffer();
    const audio = await ctx.decodeAudioData(ab);
    const ch = audio.getChannelData(0);
    const sr = 16000;
    let s: Float32Array;
    if (audio.sampleRate !== sr) {
      const ratio = audio.sampleRate / sr;
      const len = Math.round(ch.length / ratio);
      s = new Float32Array(len);
      for (let i = 0; i < len; i++) s[i] = ch[Math.round(i * ratio)];
    } else s = ch;
    const buf = new ArrayBuffer(44 + s.length * 2);
    const v = new DataView(buf);
    const ws = (o: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    ws(0, "RIFF"); v.setUint32(4, 36 + s.length * 2, true);
    ws(8, "WAVE"); ws(12, "fmt "); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    ws(36, "data"); v.setUint32(40, s.length * 2, true);
    for (let i = 0; i < s.length; i++) {
      const val = Math.max(-1, Math.min(1, s[i]));
      v.setInt16(44 + i * 2, val < 0 ? val * 0x8000 : val * 0x7fff, true);
    }
    await ctx.close();
    return new Blob([buf], { type: "audio/wav" });
  };

  const allSteps: ProcessStep[] = ["captured", "converting", "transcribing", "extracting", "saving", "done"];
  const stepInfo: Record<ProcessStep, { icon: string; label: string; hint: string }> = {
    captured: { icon: "mic", label: "Voice captured", hint: "Preparing audio data..." },
    converting: { icon: "waveform", label: "Optimizing audio", hint: "Converting to best format..." },
    transcribing: { icon: "ear", label: "AI is listening", hint: "Understanding your words..." },
    extracting: { icon: "brain", label: "Extracting expenses", hint: "Finding amounts & categories..." },
    saving: { icon: "save", label: "Saving to account", hint: "Almost there..." },
    done: { icon: "check", label: "All done!", hint: "Expenses added successfully" },
  };

  // ═══ RECORDING MODAL ═══
  if (recording) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cancelRecording} />

        {/* Modal */}
        <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 pt-5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Recording</span>
              </div>
              <button onClick={cancelRecording} className="text-gray-300 hover:text-gray-500 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Timer */}
            <div className="text-center pt-6 pb-2">
              <p className="text-6xl font-extralight text-gray-900 tabular-nums tracking-widest">{formatTime(seconds)}</p>
            </div>

            {/* Real Audio Waveform */}
            <div className="flex items-center justify-center gap-[3px] h-16 px-8 my-4">
              {waveHeights.map((h, i) => (
                <div key={i} className="w-[3px] rounded-full transition-all duration-75"
                  style={{
                    height: `${h}px`,
                    backgroundColor: `rgba(230, 81, 0, ${0.3 + (h / 48) * 0.7})`,
                  }} />
              ))}
            </div>

            {/* Hint */}
            <p className="text-center text-gray-400 text-sm mb-6">
              Speak naturally... <span className="text-gray-300">e.g. &quot;chai 20, auto 50&quot;</span>
            </p>

            {/* Ring pulse + Stop button */}
            <div className="flex justify-center pb-8">
              <button onClick={stopRecording} className="relative group">
                <span className="absolute inset-0 w-20 h-20 rounded-full bg-[#E65100]/15 animate-ping" />
                <span className="absolute -inset-2 w-24 h-24 rounded-full border-2 border-[#E65100]/20 animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-b from-[#E65100] to-[#BF360C] rounded-full flex items-center justify-center shadow-xl shadow-[#E65100]/20 group-active:scale-90 transition">
                  <div className="w-6 h-6 bg-white rounded-md" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ PROCESSING MODAL ═══
  if (processing) {
    const currentIdx = allSteps.indexOf(processStep);
    const progress = ((currentIdx + 1) / allSteps.length) * 100;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">

            {/* Animated orb */}
            <div className="flex justify-center pt-8 pb-4">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-[#E65100]/5 animate-pulse" />
                <div className="absolute -inset-8 rounded-full border border-[#E65100]/10 animate-[spin_8s_linear_infinite]" />
                <div className="absolute -inset-12 rounded-full border border-[#E65100]/5 animate-[spin_12s_linear_infinite_reverse]" />
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${
                  processStep === "done"
                    ? "bg-gradient-to-b from-green-500 to-green-600 shadow-green-500/20"
                    : "bg-gradient-to-b from-[#E65100] to-[#BF360C] shadow-[#E65100]/20"
                }`}>
                  {processStep === "done" ? (
                    <svg className="w-8 h-8 text-white animate-[scaleIn_0.3s_ease-out]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Current step label */}
            <div className="text-center px-6 pb-2">
              <p className={`text-lg font-bold transition-all duration-300 ${processStep === "done" ? "text-green-600" : "text-gray-900"}`}>
                {stepInfo[processStep].label}
              </p>
              <p className="text-gray-400 text-sm mt-1">{stepInfo[processStep].hint}</p>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2 py-4">
              {allSteps.map((step, i) => {
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step} className={`rounded-full transition-all duration-500 ${
                    isDone ? "w-2 h-2 bg-green-500"
                    : isCurrent ? "w-8 h-2 bg-[#E65100] rounded-full"
                    : "w-2 h-2 bg-gray-200"
                  }`} />
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mx-6 mb-6">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${processStep === "done" ? "bg-green-500" : "bg-[#E65100]"}`}
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ DEFAULT MIC BUTTON ═══
  return (
    <button
      onClick={startRecording}
      className="w-14 h-14 md:w-20 md:h-20 bg-[#E65100] rounded-full flex items-center justify-center mx-auto shadow-lg hover:bg-[#BF360C] transition active:scale-95"
    >
      <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </button>
  );
}
