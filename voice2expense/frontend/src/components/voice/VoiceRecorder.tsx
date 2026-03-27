"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface VoiceRecorderProps {
  onSuccess?: () => void;
  autoStart?: boolean;
}

export function VoiceRecorder({ onSuccess, autoStart }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);
  const autoStarted = useRef(false);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !autoStarted.current && !recording && !processing) {
      autoStarted.current = true;
      startRecording();
    }
  }, [autoStart]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice recording not supported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
        .find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      cancelledRef.current = false;

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (cancelledRef.current) { cancelledRef.current = false; return; }

        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size < 1000) { toast.error("Too short. Speak for at least 2 seconds."); return; }
        if (blob.size > 3 * 1024 * 1024) { toast.error("Too long. Keep under 30 seconds."); return; }
        await processAudio(blob);
      };

      mr.start(250);
      setRecording(true);

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
  };

  const processAudio = async (blob: Blob) => {
    setProcessing(true);
    try {
      let audioBlob: Blob;
      let filename: string;
      try {
        audioBlob = await convertToWav(blob);
        filename = "recording.wav";
      } catch {
        audioBlob = blob;
        filename = blob.type.includes("mp4") ? "recording.mp4" : "recording.webm";
      }

      const base64 = await blobToBase64(audioBlob);
      const res = await api.post("/api/ai/voice-log", { audio: base64, filename });

      const count = res.saved_count || 1;
      toast.success(`${count} expense${count > 1 ? "s" : ""} added!`);
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

  // ── Recording overlay ──
  if (recording) {
    return (
      <div className="fixed inset-0 bg-[#F5F5F0] z-50 flex flex-col items-center justify-center">
        <button onClick={cancelRecording} className="absolute top-5 right-5 text-gray-400 text-sm">Cancel</button>
        <button onClick={stopRecording} className="relative">
          <div className="w-36 h-36 bg-[#E65100]/15 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 bg-[#E65100] rounded-full flex items-center justify-center shadow-lg">
              <div className="w-7 h-7 bg-white rounded-sm" />
            </div>
          </div>
        </button>
        <div className="flex gap-1 mt-5">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-1 bg-[#E65100] rounded-full animate-bounce"
              style={{ height: `${8 + Math.random() * 16}px`, animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <p className="text-gray-500 text-sm mt-3">Listening... tap stop when done</p>
      </div>
    );
  }

  // ── Processing overlay ──
  if (processing) {
    return (
      <div className="fixed inset-0 bg-[#F5F5F0] z-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-[#E65100] rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm mt-4">Adding expenses...</p>
      </div>
    );
  }

  // ── Default mic button ──
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
