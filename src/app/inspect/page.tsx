"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface Violation {
  item: string;
  regulation: string;
  severity: string;
  penalty: string;
  suggestion: string;
  regulation_detail?: string;
}

interface InspectionResult {
  scene_description: string;
  violations: Violation[];
  risk_score: number;
  overall_assessment: string;
  immediate_actions: string[];
}

export default function InspectPage() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const resp = await fetch("/api/inspect", { method: "POST", body: formData });
      const data = await resp.json();
      if (data.success) {
        setResult(data.inspection);
      } else {
        setError(data.error || "分析失敗");
      }
    } catch {
      setError("連線失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (s: string) => {
    if (s === "high") return "text-red-400 bg-red-500/20";
    if (s === "medium") return "text-yellow-400 bg-yellow-500/20";
    return "text-green-400 bg-green-500/20";
  };

  const severityLabel = (s: string) => {
    if (s === "high") return "高風險";
    if (s === "medium") return "中風險";
    return "低風險";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center font-bold text-sm">N+</div>
          </Link>
          <span className="font-semibold">拍照巡檢</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center mb-8 cursor-pointer hover:border-orange-500/50 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {image ? (
            <img src={image} alt="uploaded" className="max-h-80 mx-auto rounded-xl" />
          ) : (
            <div>
              <div className="text-4xl mb-4">📸</div>
              <p className="text-gray-400">點擊拍照或上傳工地照片</p>
              <p className="text-gray-600 text-sm mt-2">支援 JPG、PNG，建議清晰拍攝工地全景</p>
            </div>
          )}
        </div>

        {image && (
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 rounded-xl text-lg font-semibold mb-8 disabled:opacity-50 transition-all"
          >
            {loading ? "AI 分析中..." : "開始安全分析"}
          </button>
        )}

        {error && <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-8 text-red-300">{error}</div>}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Risk Score */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">風險評估</h2>
                <div className={`text-3xl font-bold ${result.risk_score >= 7 ? "text-red-400" : result.risk_score >= 4 ? "text-yellow-400" : "text-green-400"}`}>
                  {result.risk_score}/10
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">{result.scene_description}</p>
              <p className="text-gray-300 text-sm">{result.overall_assessment}</p>
            </div>

            {/* Immediate Actions */}
            {result.immediate_actions?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <h3 className="font-semibold mb-3 text-red-300">立即處理事項</h3>
                <ul className="space-y-2">
                  {result.immediate_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-red-400 mt-0.5">!</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Violations */}
            {result.violations?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">違規項目（{result.violations.length} 項）</h3>
                <div className="space-y-3">
                  {result.violations.map((v, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{v.item}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${severityColor(v.severity)}`}>
                          {severityLabel(v.severity)}
                        </span>
                      </div>
                      <div className="text-sm text-blue-400 mb-1">{v.regulation}</div>
                      <div className="text-sm text-orange-400 mb-2">罰鍰：{v.penalty}</div>
                      <div className="text-sm text-gray-400">{v.suggestion}</div>
                      {v.regulation_detail && (
                        <details className="mt-3">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">查看法條原文</summary>
                          <div className="mt-2 text-xs text-gray-500 bg-black/30 rounded-lg p-3">{v.regulation_detail}</div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.violations?.length === 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">&#10004;</div>
                <p className="text-green-300 font-semibold">未發現明顯違規</p>
                <p className="text-gray-400 text-sm mt-1">建議持續維持良好安全措施</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
