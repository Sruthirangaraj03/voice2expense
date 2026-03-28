"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function InsightsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", content: question.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await api.post("/api/ai/query", { question: userMsg.content });
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, couldn't process that.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAndSend(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAndSend = async (blob: Blob) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: "Voice message...", timestamp: new Date() }]);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const data = await api.post("/api/ai/transcribe", { audio: base64, filename: "voice.webm" });
      const transcript = data.text || data.transcript || "";

      if (transcript) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "user", content: transcript, timestamp: new Date() };
          return updated;
        });
        const answer = await api.post("/api/ai/query", { question: transcript });
        setMessages((prev) => [...prev, { role: "assistant", content: answer.answer, timestamp: new Date() }]);
      } else {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "user", content: "(Could not understand audio)", timestamp: new Date() };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, couldn't process the voice message.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ["How much did I spend this month?", "What's my biggest category?", "Last week's total?", "Budget health?"];

  return (
    <div className="flex flex-col h-[calc(100dvh-170px)] md:h-[calc(100dvh-120px)]">

      {/* Page Header */}
      <div className="pb-2">
        <h2 className="text-lg font-bold text-gray-900">AI Assistant</h2>
        <p className="text-xs text-gray-400 mt-0.5">Ask anything about your spending — type or use voice</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="space-y-2 px-1">
            <p className="text-sm text-gray-400 text-center mb-3">Try asking:</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => setInput(s)}
                className="block w-full text-left px-4 py-3.5 bg-white rounded-2xl text-sm text-gray-600 shadow-sm hover:shadow transition active:bg-gray-50">
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-50 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[80%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm ${
              msg.role === "user"
                ? "bg-[#E65100] text-white rounded-br-md"
                : "bg-white text-gray-700 rounded-bl-md shadow-sm"
            }`}>
              <p className="whitespace-pre-line leading-relaxed">{msg.content.replace(/\*\*/g, "").replace(/\*/g, "")}</p>
              <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-orange-200" : "text-gray-400"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-50 rounded-full flex items-center justify-center mr-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {/* Voice button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50 ${
            isRecording
              ? "bg-red-500 animate-pulse"
              : "bg-[#E65100] hover:bg-[#BF360C]"
          }`}
        >
          {isRecording ? (
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

        {/* Text input */}
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading || isRecording}
          placeholder={isRecording ? "Listening..." : "Ask me anything..."}
          className="flex-1 px-4 py-3 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30 shadow-sm disabled:opacity-50" />

        {/* Send button */}
        <button type="submit" disabled={loading || !input.trim() || isRecording}
          className="w-11 h-11 sm:w-10 sm:h-10 bg-[#E65100] text-white rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
