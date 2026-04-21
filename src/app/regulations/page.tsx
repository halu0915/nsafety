"use client";

import { useState } from "react";
import Link from "next/link";

interface RegResult {
  content: string;
  filePath: string;
  sectionTitle: string;
  score: number;
}

export default function RegulationsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState("");

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setMessage("");
    try {
      const resp = await fetch(`/api/regulations?q=${encodeURIComponent(query)}&limit=8`);
      const data = await resp.json();
      setResults(data.results || []);
      if (data.redirect) {
        setMessage(data.message);
      } else if (data.suggestion) {
        setMessage(data.suggestion);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const EXAMPLES = [
    "高架作業護欄規定",
    "電氣設備接地要求",
    "局限空間作業安全",
    "施工架設置標準",
    "消防設備設置",
    "墜落防護措施",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/"><div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center font-bold text-sm">N+</div></Link>
          <span className="font-semibold">法規查詢</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">職安法規查詢</h1>
          <p className="text-gray-400 text-sm">輸入情境或關鍵字，AI 即時查詢相關法規條文</p>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="例：高空作業要什麼防護？"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
          />
          <button onClick={search} disabled={loading} className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors">
            {loading ? "..." : "搜尋"}
          </button>
        </div>

        {!searched && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); setTimeout(search, 100); }}
                className="text-left px-3 py-2 rounded-lg border border-white/10 text-xs text-gray-400 hover:border-orange-500/40 hover:text-gray-200 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="text-center text-gray-500 py-12">搜尋中...</div>}

        {message && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 mb-6 text-center">
            <p className="text-orange-300 text-sm">{message}</p>
          </div>
        )}

        {searched && !loading && results.length === 0 && !message && (
          <div className="text-center text-gray-500 py-12">未找到相關法規</div>
        )}

        <div className="space-y-4">
          {results.map((r, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-orange-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 font-mono">{r.filePath.split("/").pop()?.replace(".md", "")}</span>
                <span className="text-xs text-gray-600">相關度 {(r.score * 100).toFixed(0)}%</span>
              </div>
              <div className="text-sm text-blue-400 font-medium mb-2">{r.sectionTitle}</div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{r.content.slice(0, 500)}</p>
              {r.content.length > 500 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">展開完整內容</summary>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
