"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface VoiceRecorderProps {
  onSuccess?: () => void;
}

interface ParsedResult {
  transcription: string;
  parsed: {
    amount: number;
    category: string;
    date: string;
    description: string;
    confidence: number;
  };
  expense_id: string;
  confidence: number;
}

export function VoiceRecorder({ onSuccess }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [liveText, setLiveText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null);

  function createSpeechRecognition() {
    const W = window as unknown as Record<string, unknown>;
    const SpeechRecognition = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new (SpeechRecognition as new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
      onerror: ((e: unknown) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
      abort: () => void;
    })();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    return recognition;
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Voice recording is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(
        (t) => MediaRecorder.isTypeSupported(t)
      ) || "";

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setLiveText("");

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);

        // Stop speech recognition
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch { /* ignore */ }
          recognitionRef.current = null;
        }

        if (cancelledRef.current) {
          cancelledRef.current = false;
          setLiveText("");
          return;
        }

        const actualMime = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualMime });

        if (blob.size < 1000) {
          toast.error("Recording too short. Please speak for at least 2 seconds.");
          setLiveText("");
          return;
        }
        if (blob.size > 3 * 1024 * 1024) {
          toast.error("Recording too long. Please keep it under 30 seconds.");
          setLiveText("");
          return;
        }
        await processAudio(blob);
      };

      mediaRecorder.start(250);
      setRecording(true);

      // Start live speech recognition (browser-side, for display only)
      const recognition = createSpeechRecognition();
      if (recognition) {
        let finalTranscript = "";
        recognition.onresult = (event) => {
          let interim = "";
          for (let i = 0; i < event.results.length; i++) {
            const r = event.results[i];
            if (r.isFinal) {
              finalTranscript += r[0].transcript + " ";
            } else {
              interim += r[0].transcript;
            }
          }
          setLiveText((finalTranscript + interim).trim());
        };
        recognition.onerror = () => { /* ignore - live text is optional */ };
        recognition.onend = () => {
          // Restart if still recording (recognition auto-stops sometimes)
          if (mediaRecorderRef.current?.state === "recording") {
            try { recognition.start(); } catch { /* ignore */ }
          }
        };
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch { /* browser doesn't support it — no live text, still works */ }
      }

      timerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          toast.info("Recording auto-stopped at 30 seconds");
        }
      }, 30000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelledRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelledRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setLiveText("");
  };

  const processAudio = async (blob: Blob) => {
    setProcessing(true);
    try {
      const wavBlob = await convertToWav(blob);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(wavBlob);
      });

      const res = await api.post("/api/ai/voice-log", {
        audio: base64,
        filename: "recording.wav",
      });
      setResult(res);
      toast.success("Expense logged via voice!");
      onSuccess?.();
    } catch (err) {
      console.error("Voice processing failed:", err);
      toast.error("Voice processing failed. Please try again.");
    } finally {
      setProcessing(false);
      setLiveText("");
    }
  };

  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = 16000;

    let samples: Float32Array;
    if (audioBuffer.sampleRate !== sampleRate) {
      const ratio = audioBuffer.sampleRate / sampleRate;
      const newLength = Math.round(channelData.length / ratio);
      samples = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        samples[i] = channelData[Math.round(i * ratio)];
      }
    } else {
      samples = channelData;
    }

    const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(wavBuffer);
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    await audioContext.close();
    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  // Recording overlay
  if (recording) {
    return (
      <div className="fixed inset-0 bg-gray-200/95 z-50 flex flex-col items-center justify-center px-6">
        <button onClick={cancelRecording} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
          <span className="text-xl">&times;</span>
        </button>

        {/* Live transcription display */}
        {liveText && (
          <div className="absolute top-20 left-6 right-6 bg-white rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-[10px] text-[#E65100] font-semibold uppercase tracking-wider mb-1">Live Transcript</p>
            <p className="text-gray-800 text-lg font-medium">{liveText}</p>
          </div>
        )}

        <button onClick={stopRecording} className="relative cursor-pointer">
          <div className="w-40 h-40 bg-[#E65100]/20 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-28 h-28 bg-[#E65100] rounded-full flex items-center justify-center shadow-lg hover:bg-[#BF360C] transition">
              <div className="w-8 h-8 bg-white rounded-md" />
            </div>
          </div>
        </button>
        <div className="flex gap-1 mt-6">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-1.5 bg-[#E65100] rounded-full animate-bounce" style={{ height: `${12 + Math.random() * 20}px`, animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <p className="text-lg font-medium mt-4 text-gray-700">{liveText ? "Listening..." : "Start speaking..."}</p>
        <p className="text-sm text-gray-400 mt-1">Tap the button to stop and process</p>

        {!liveText && (
          <div className="mt-6 bg-white/80 rounded-2xl px-6 py-4 max-w-xs text-center">
            <p className="text-sm text-gray-500 italic">Try saying something like</p>
            <p className="text-[#E65100] font-semibold mt-1">&quot;Today tea expense 15 rupees&quot;</p>
          </div>
        )}

        <button onClick={cancelRecording} className="mt-8 text-gray-500 text-sm tracking-widest uppercase">
          Cancel Voice Logging
        </button>
      </div>
    );
  }

  // Processing state
  if (processing) {
    return (
      <div className="fixed inset-0 bg-gray-200/95 z-50 flex flex-col items-center justify-center px-6">
        {liveText && (
          <div className="absolute top-20 left-6 right-6 bg-white rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider mb-1">You said</p>
            <p className="text-gray-800 text-lg font-medium">{liveText}</p>
          </div>
        )}
        <div className="w-28 h-28 bg-[#E65100] rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-lg font-medium mt-6 text-gray-700">Processing your voice...</p>
      </div>
    );
  }

  // Result confirmation
  if (result) {
    const p = result.parsed;
    return (
      <div className="fixed inset-0 bg-[#F5F5F0] z-50 overflow-auto">
        <div className="max-w-md mx-auto px-5 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#E65100] font-bold text-lg">Logger</span>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-green-600 font-bold">OK</span>
            <span className="text-green-700 text-sm font-medium">AI parsed your voice correctly!</span>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
              {Math.round((result.confidence || p.confidence || 0.95) * 100)}% CONFIDENCE
            </span>
          </div>

          {result.transcription && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">You said</p>
              <p className="text-gray-700 italic">&quot;{result.transcription}&quot;</p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Amount</p>
            <p className="text-5xl font-bold mt-2">Rs.{Number(p.amount).toLocaleString("en-IN")}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-sm font-bold text-[#E65100]">CAT</div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Category</p>
              <p className="font-semibold capitalize">{p.category}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-sm font-bold text-blue-600">DT</div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Date</p>
              <p className="font-semibold">{p.date}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-sm font-bold text-gray-600">DSC</div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Description</p>
              <p className="font-semibold">{p.description}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-4 border border-gray-200 rounded-2xl font-semibold text-gray-600"
            >
              Discard
            </button>
            <button
              onClick={() => { setResult(null); onSuccess?.(); }}
              className="flex-1 py-4 bg-gradient-to-r from-[#E65100] to-[#FF8A65] text-white rounded-2xl font-semibold"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default mic button
  return (
    <button
      onClick={startRecording}
      className="w-20 h-20 bg-[#E65100] rounded-full flex items-center justify-center mx-auto shadow-lg hover:bg-[#BF360C] transition active:scale-95"
    >
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </button>
  );
}
