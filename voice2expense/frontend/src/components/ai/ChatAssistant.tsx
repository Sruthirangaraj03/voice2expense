"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.post("/api/ai/query", { question: userMessage.content });
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I couldn't process your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "How much did I spend this month?",
    "What's my biggest expense category?",
    "Compare this week vs last week",
    "Am I over budget on food?",
  ];

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
        <p className="text-sm text-slate-400">Ask anything about your spending</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 text-center mb-4">Try asking:</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="block w-full text-left px-4 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-emerald-500 text-white rounded-br-md"
                  : "bg-slate-700 text-slate-200 rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === "user" ? "text-emerald-200" : "text-slate-400"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your spending..."
          className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
