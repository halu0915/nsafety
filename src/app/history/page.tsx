"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Record {
  id: string;
  timestamp: string;
  photoCount: number;
  totalViolations: number;
  avgRiskScore: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  summary: string;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    fetch("/api/history").then((r) => r.json()).then((d) => setRecords(d.records || []));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/"><div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center font-bold text-sm">N+</div></Link>
          <span className="font-semibold">巡檢紀錄</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">歷史巡檢紀錄</h1>

        {records.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-400 mb-4">尚無巡檢紀錄</p>
            <Link href="/inspect" className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-medium transition-colors inline-block">
              開始巡檢
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-orange-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">{r.id}</span>
                  <span className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleString("zh-TW")}</span>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <div className={`text-2xl font-bold ${r.avgRiskScore >= 7 ? "text-red-400" : r.avgRiskScore >= 4 ? "text-yellow-400" : "text-green-400"}`}>
                    {r.avgRiskScore}/10
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.photoCount} 張照片，{r.totalViolations} 項違規</div>
                    <div className="flex gap-3 text-xs mt-1">
                      {r.highRisk > 0 && <span className="text-red-400">高風險 {r.highRisk}</span>}
                      {r.mediumRisk > 0 && <span className="text-yellow-400">中風險 {r.mediumRisk}</span>}
                      {r.lowRisk > 0 && <span className="text-green-400">低風險 {r.lowRisk}</span>}
                    </div>
                  </div>
                </div>
                {r.summary && <p className="text-xs text-gray-500">{r.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
