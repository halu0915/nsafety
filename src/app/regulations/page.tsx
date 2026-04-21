"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { file: string; section: string; score: number }[];
}

export default function RegulationsPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async (q?: string) => {
    const question = q || query.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const resp = await fetch("/api/regulations/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || data.error || "無法回答", sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "連線失敗，請重試" }]);
    } finally {
      setLoading(false);
    }
  };

  const EXAMPLES = [
    "高架作業需要什麼防護？",
    "配電箱安全規定有哪些？",
    "工地可以唱歌嗎？",
    "開挖多深要擋土？",
    "沒戴安全帽罰多少？",
    "局限空間怎麼作業？",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50 shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#ns)" /><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="ns" x1="4" y1="2" x2="20" y2="22"><stop stopColor="#f97316"/><stop offset="1" stopColor="#e94560"/></linearGradient></defs></svg>
            </div>
          </Link>
          <span className="font-semibold">法規問答</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="mb-6 drop-shadow-[0_0_20px_rgba(233,69,96,0.3)]">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#hero)" /><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="hero" x1="4" y1="2" x2="20" y2="22"><stop stopColor="#f97316"/><stop offset="1" stopColor="#e94560"/></linearGradient></defs>
              </svg>
              <h2 className="text-xl font-semibold mb-2">工安法規問答</h2>
              <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
                用白話問問題，AI 根據台灣職安法規回答。涵蓋 12 部法規、800+ 條文。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => ask(ex)}
                    className="text-left px-3 py-2.5 rounded-xl border border-white/10 text-xs text-gray-400 hover:border-orange-500/40 hover:text-gray-200 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-orange-600 text-white"
                      : "bg-white/5 border border-white/10 text-gray-200"
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <div className="text-xs text-gray-500 mb-1">引用法規：</div>
                        {msg.sources.map((s, si) => (
                          <div key={si} className="text-xs text-blue-400">
                            {s.file.replace(".md", "")} {s.section} ({(s.score * 100).toFixed(0)}%)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/5 bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask()}
              placeholder="問任何工安問題..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              disabled={loading}
            />
            <button
              onClick={() => ask()}
              disabled={loading || !query.trim()}
              className="px-5 py-3 bg-orange-600 rounded-xl text-sm font-medium hover:bg-orange-500 disabled:opacity-50 transition-colors"
            >
              問
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">回答根據台灣職安法規知識庫，僅供參考</p>
        </div>
      </div>
    </div>
  );
}
