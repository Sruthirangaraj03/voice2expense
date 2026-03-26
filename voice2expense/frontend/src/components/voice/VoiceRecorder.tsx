"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface VoiceRecorderProps {
  onSuccess?: () => void;
}

export function VoiceRecorder({ onSuccess }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Voice recording is not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Check MediaRecorder support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Check file size (max 10MB)
        if (blob.size > 10 * 1024 * 1024) {
          toast.error('Recording too long. Please keep it under 1 minute.');
          return;
        }

        await processAudio(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast.error('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      await api.upload("/api/ai/voice-log", formData);
      toast.success("Expense logged via voice!");
      onSuccess?.();
    } catch (err) {
      console.error("Voice processing failed:", err);
      toast.error("Voice processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      disabled={processing}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
        recording
          ? "bg-red-500 text-white animate-pulse"
          : processing
          ? "bg-slate-700 text-slate-400"
          : "bg-emerald-500 text-white hover:bg-emerald-600"
      }`}
    >
      {recording ? (
        <>
          <span className="w-3 h-3 bg-white rounded-full" />
          Stop
        </>
      ) : processing ? (
        "Processing..."
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          Voice Log
        </>
      )}
    </button>
  );
}
