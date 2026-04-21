"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CheckItem {
  id: string;
  category: string;
  item: string;
  regulation: string;
}

interface CheckResult {
  id: string;
  status: "pass" | "fail" | "na" | "unchecked";
  note: string;
}

export default function ChecklistPage() {
  const [type, setType] = useState<"mep" | "construction">("mep");
  const [items, setItems] = useState<CheckItem[]>([]);
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [templateName, setTemplateName] = useState("");
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [inspector, setInspector] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/checklist?type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setTemplateName(data.name || "");
        const init: Record<string, CheckResult> = {};
        for (const item of data.items || []) {
          init[item.id] = { id: item.id, status: "unchecked", note: "" };
        }
        setResults(init);
      })
      .finally(() => setLoading(false));
  }, [type]);

  const setStatus = (id: string, status: CheckResult["status"]) => {
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], status } }));
  };

  const setNote = (id: string, note: string) => {
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], note } }));
  };

  const stats = {
    total: items.length,
    pass: Object.values(results).filter((r) => r.status === "pass").length,
    fail: Object.values(results).filter((r) => r.status === "fail").length,
    na: Object.values(results).filter((r) => r.status === "na").length,
    unchecked: Object.values(results).filter((r) => r.status === "unchecked").length,
  };

  const complianceRate = stats.total - stats.na > 0
    ? Math.round((stats.pass / (stats.total - stats.na)) * 100)
    : 0;

  const categories = [...new Set(items.map((i) => i.category))];

  const exportReport = () => {
    const date = new Date().toLocaleDateString("zh-TW");
    let md = `# ${templateName} 巡檢報告\n\n`;
    md += `**專案：** ${projectName || "未填寫"}  \n`;
    md += `**巡檢人員：** ${inspector || "未填寫"}  \n`;
    md += `**日期：** ${date}  \n`;
    md += `**合規率：** ${complianceRate}%  \n\n`;
    md += `| 項目 | 狀態 | 法規 | 備註 |\n|------|------|------|------|\n`;
    for (const item of items) {
      const r = results[item.id];
      const statusText = r?.status === "pass" ? "合格" : r?.status === "fail" ? "不合格" : r?.status === "na" ? "不適用" : "未檢查";
      md += `| ${item.item} | ${statusText} | ${item.regulation} | ${r?.note || ""} |\n`;
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `巡檢報告-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBtn = (id: string, status: CheckResult["status"], label: string, color: string) => (
    <button
      onClick={() => setStatus(id, status)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        results[id]?.status === status ? color : "bg-white/5 text-gray-500 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center font-bold text-sm">N+</div></Link>
            <span className="font-semibold">智慧巡檢表</span>
          </div>
          <button onClick={exportReport} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium transition-colors">
            匯出報告
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Project Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="專案名稱" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          <input value={inspector} onChange={(e) => setInspector(e.target.value)} placeholder="巡檢人員" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          <div className="flex gap-2">
            <button onClick={() => setType("mep")} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${type === "mep" ? "bg-orange-600 text-white" : "bg-white/5 text-gray-400"}`}>機電工程</button>
            <button onClick={() => setType("construction")} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${type === "construction" ? "bg-orange-600 text-white" : "bg-white/5 text-gray-400"}`}>一般營造</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-lg font-bold">{stats.total}</div>
            <div className="text-xs text-gray-500">總項</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-green-400">{stats.pass}</div>
            <div className="text-xs text-gray-500">合格</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-red-400">{stats.fail}</div>
            <div className="text-xs text-gray-500">不合格</div>
          </div>
          <div className="bg-gray-500/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-400">{stats.unchecked}</div>
            <div className="text-xs text-gray-500">未檢</div>
          </div>
          <div className={`rounded-xl p-3 text-center ${complianceRate >= 80 ? "bg-green-500/10" : complianceRate >= 60 ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
            <div className={`text-lg font-bold ${complianceRate >= 80 ? "text-green-400" : complianceRate >= 60 ? "text-yellow-400" : "text-red-400"}`}>{complianceRate}%</div>
            <div className="text-xs text-gray-500">合規率</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">載入中...</div>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-orange-400 mb-3 uppercase">{cat}</h3>
                <div className="space-y-2">
                  {items.filter((i) => i.category === cat).map((item) => (
                    <div key={item.id} className={`bg-white/5 border rounded-xl p-4 transition-colors ${
                      results[item.id]?.status === "fail" ? "border-red-500/50" : results[item.id]?.status === "pass" ? "border-green-500/30" : "border-white/10"
                    }`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="text-sm font-medium">{item.item}</div>
                          <div className="text-xs text-blue-400 mt-1">{item.regulation}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {statusBtn(item.id, "pass", "合格", "bg-green-600 text-white")}
                        {statusBtn(item.id, "fail", "不合格", "bg-red-600 text-white")}
                        {statusBtn(item.id, "na", "N/A", "bg-gray-600 text-white")}
                        <input
                          value={results[item.id]?.note || ""}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          placeholder="備註..."
                          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
