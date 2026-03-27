"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim(), timestamp: new Date() };
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

  const suggestions = ["How much did I spend this month?", "What's my biggest category?", "Last week's total?", "Budget health?"];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <h2 className="text-xl font-bold mb-4">AI Assistant</h2>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 text-center mb-3">Try asking:</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => setInput(s)}
                className="block w-full text-left px-4 py-3 bg-white rounded-2xl text-sm text-gray-600 shadow-sm hover:shadow transition">
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-xs">AI</span>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
              msg.role === "user"
                ? "bg-[#E65100] text-white rounded-br-md"
                : "bg-white text-gray-700 rounded-bl-md shadow-sm"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-orange-200" : "text-gray-400"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
              <span className="text-xs">AI</span>
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

      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-gray-100">
        <div className="w-10 h-10 bg-[#E65100] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">Mic</span>
        </div>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading}
          placeholder="Ask me anything..."
          className="flex-1 px-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30 shadow-sm" />
        <button type="submit" disabled={loading || !input.trim()}
          className="w-10 h-10 bg-[#E65100] text-white rounded-full flex items-center justify-center disabled:opacity-50">
          &gt;
        </button>
      </form>
    </div>
  );
}
