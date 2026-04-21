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
  verified_regulation?: string;
}

interface InspectionResult {
  scene_description: string;
  violations: Violation[];
  risk_score: number;
  overall_assessment: string;
  immediate_actions: string[];
}

interface PhotoEntry {
  id: string;
  file: File;
  preview: string;
  result: InspectionResult | null;
  loading: boolean;
  error: string;
}

export default function InspectPage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const newPhotos: PhotoEntry[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      preview: URL.createObjectURL(f),
      result: null,
      loading: false,
      error: "",
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const analyzeAll = async () => {
    setAnalyzing(true);
    const updated = [...photos];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].result) continue;
      updated[i].loading = true;
      setPhotos([...updated]);

      const formData = new FormData();
      formData.append("image", updated[i].file);

      try {
        const resp = await fetch("/api/inspect", { method: "POST", body: formData });
        const data = await resp.json();
        updated[i].loading = false;
        if (data.success) {
          updated[i].result = data.inspection;
        } else {
          updated[i].error = data.error || "分析失敗";
        }
      } catch {
        updated[i].loading = false;
        updated[i].error = "連線失敗";
      }
      setPhotos([...updated]);
    }
    setAnalyzing(false);
  };

  const totalViolations = photos.reduce((sum, p) => sum + (p.result?.violations?.length || 0), 0);
  const avgRisk = photos.filter((p) => p.result).length > 0
    ? Math.round(photos.reduce((sum, p) => sum + (p.result?.risk_score || 0), 0) / photos.filter((p) => p.result).length * 10) / 10
    : 0;
  const hasResults = photos.some((p) => p.result);

  const downloadReport = () => {
    const date = new Date().toLocaleDateString("zh-TW");
    const time = new Date().toLocaleTimeString("zh-TW");

    let html = `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>工地安全巡檢報告</title>
<style>
body{font-family:'Noto Sans TC',sans-serif;color:#1a1a2e;line-height:1.6;max-width:800px;margin:0 auto;padding:40px;}
h1{text-align:center;color:#e94560;margin-bottom:4px;}
.subtitle{text-align:center;color:#64748b;margin-bottom:32px;}
.info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;font-size:14px;}
.info dt{color:#64748b;} .info dd{font-weight:600;}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0;}
.stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;}
.stat .num{font-size:24px;font-weight:800;} .stat .label{font-size:11px;color:#64748b;}
.photo-block{border:1px solid #e2e8f0;border-radius:12px;margin:20px 0;overflow:hidden;}
.photo-block img{width:100%;max-height:300px;object-fit:cover;}
.photo-info{padding:16px;}
.violation{border-left:3px solid #ef4444;background:#fafafa;padding:10px 14px;margin:8px 0;border-radius:0 8px 8px 0;font-size:13px;}
.violation.medium{border-left-color:#f59e0b;} .violation.low{border-left-color:#22c55e;}
.vt{font-weight:600;} .vr{color:#3b82f6;font-size:12px;} .vp{color:#ef4444;font-size:12px;} .vf{color:#64748b;font-size:12px;}
.footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:40px;border-top:1px solid #e2e8f0;padding-top:16px;}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:40px 0;}
.sign-box{border-top:1px solid #cbd5e1;padding-top:12px;} .sign-label{font-size:12px;color:#94a3b8;margin-bottom:40px;}
@media print{body{padding:20px;}}
</style></head><body>
<h1>工地安全巡檢報告</h1>
<div class="subtitle">N+Safety AI 工安助手</div>
<dl class="info">
<dt>報告日期</dt><dd>${date}</dd>
<dt>照片數量</dt><dd>${photos.length} 張</dd>
</dl>
<div class="stats">
<div class="stat"><div class="num" style="color:#e94560">${avgRisk}</div><div class="label">平均風險 /10</div></div>
<div class="stat"><div class="num" style="color:#ef4444">${totalViolations}</div><div class="label">違規總數</div></div>
<div class="stat"><div class="num" style="color:#22c55e">${photos.filter(p=>p.result).length}</div><div class="label">已分析照片</div></div>
</div>`;

    photos.forEach((p, i) => {
      if (!p.result) return;
      html += `<div class="photo-block">
<div style="background:#f1f5f9;padding:40px;text-align:center;color:#94a3b8;">現場照片 #${i + 1}</div>
<div class="photo-info">
<p style="color:#475569;font-size:14px;">${p.result.scene_description}</p>
<p style="margin:8px 0;"><strong>風險評分：${p.result.risk_score}/10</strong></p>`;

      if (p.result.violations?.length > 0) {
        p.result.violations.forEach((v) => {
          html += `<div class="violation ${v.severity}">
<div class="vt">${v.item}</div>
<div class="vr">${v.verified_regulation || v.regulation}</div>
<div class="vp">罰鍰：${v.penalty}</div>
<div class="vf">改善：${v.suggestion}</div></div>`;
        });
      }
      html += `</div></div>`;
    });

    html += `<div class="sign"><div class="sign-box"><div class="sign-label">巡檢人員</div><div style="border-bottom:1px solid #1a1a2e;margin-bottom:6px;"></div><div style="font-size:12px;color:#64748b;">姓名：__________ 日期：__________</div></div>
<div class="sign-box"><div class="sign-label">工地主任</div><div style="border-bottom:1px solid #1a1a2e;margin-bottom:6px;"></div><div style="font-size:12px;color:#64748b;">姓名：__________ 日期：__________</div></div></div>
<div class="footer">本報告由 N+Safety AI 自動產出 | safety.nplusstar.ai | ${date} ${time}</div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `工安巡檢報告-${date}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityColor = (s: string) => {
    if (s === "high") return "text-red-400 bg-red-500/20";
    if (s === "medium") return "text-yellow-400 bg-yellow-500/20";
    return "text-green-400 bg-green-500/20";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center font-bold text-sm">N+</div></Link>
            <span className="font-semibold">拍照巡檢</span>
          </div>
          {hasResults && (
            <button onClick={downloadReport} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium transition-colors">
              下載報告
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center mb-6 hover:border-orange-500/50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        >
          <div className="text-4xl mb-4">📸</div>
          <p className="text-gray-400 mb-6">拍攝或上傳工地照片（可多張）</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => cameraRef.current?.click()} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-500 rounded-xl text-sm font-semibold hover:from-orange-500 hover:to-red-400 transition-all">
              拍照
            </button>
            <button onClick={() => fileRef.current?.click()} className="px-6 py-3 border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all">
              選擇檔案
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
          <input ref={fileRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
          <p className="text-gray-600 text-xs mt-4">支援多張照片同時上傳</p>
        </div>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">{photos.length} 張照片</span>
              <button
                onClick={analyzeAll}
                disabled={analyzing || photos.every((p) => p.result)}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
              >
                {analyzing ? "分析中..." : "全部分析"}
              </button>
            </div>

            {hasResults && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${avgRisk >= 7 ? "text-red-400" : avgRisk >= 4 ? "text-yellow-400" : "text-green-400"}`}>{avgRisk}</div>
                  <div className="text-xs text-gray-500">平均風險</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{totalViolations}</div>
                  <div className="text-xs text-gray-500">違規總數</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{photos.filter((p) => p.result).length}/{photos.length}</div>
                  <div className="text-xs text-gray-500">已分析</div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="relative">
                    <img src={photo.preview} alt={`photo ${idx + 1}`} className="w-full max-h-72 object-cover" />
                    <button onClick={() => removePhoto(photo.id)} className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">x</button>
                    <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-full text-xs">#{idx + 1}</div>
                  </div>

                  {photo.loading && (
                    <div className="p-6 text-center text-gray-400">
                      <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
                      AI 分析中...
                    </div>
                  )}

                  {photo.error && (
                    <div className="p-4 text-red-400 text-sm">{photo.error}</div>
                  )}

                  {photo.result && (
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-400">{photo.result.scene_description}</p>
                        <div className={`text-xl font-bold ${photo.result.risk_score >= 7 ? "text-red-400" : photo.result.risk_score >= 4 ? "text-yellow-400" : "text-green-400"}`}>
                          {photo.result.risk_score}/10
                        </div>
                      </div>

                      {photo.result.violations?.map((v, vi) => (
                        <div key={vi} className={`border-l-3 rounded-r-lg p-3 mb-2 text-sm ${
                          v.severity === "high" ? "border-l-red-500 bg-red-500/5" : v.severity === "medium" ? "border-l-yellow-500 bg-yellow-500/5" : "border-l-green-500 bg-green-500/5"
                        }`} style={{ borderLeftWidth: "3px" }}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{v.item}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${severityColor(v.severity)}`}>
                              {v.severity === "high" ? "高" : v.severity === "medium" ? "中" : "低"}
                            </span>
                          </div>
                          <div className="text-xs text-blue-400 mt-1">{v.verified_regulation || v.regulation}</div>
                          <div className="text-xs text-orange-400">罰鍰：{v.penalty}</div>
                          <div className="text-xs text-gray-500 mt-1">{v.suggestion}</div>
                        </div>
                      ))}

                      {photo.result.violations?.length === 0 && (
                        <div className="text-green-400 text-sm text-center py-2">未發現違規</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
