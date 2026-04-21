import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-orange-500/20">N+</div>
            <span className="text-xl font-semibold">N+Safety</span>
          </div>
          <a href="https://nplusstar.ai" className="text-gray-400 hover:text-white transition-colors text-sm">nplusstar.ai</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <div className="text-center py-24">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-300 via-red-300 to-yellow-300 bg-clip-text text-transparent">
            AI 工安助手
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
            以台灣職安法規為核心，拍照辨識工地安全隱患、智慧巡檢表、法規即時查詢。降低罰款風險，守護工人安全。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inspect" className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-orange-600/25 hover:scale-105">
              拍照巡檢
            </Link>
            <Link href="/regulations" className="px-8 py-4 border border-white/10 hover:border-white/25 rounded-xl text-lg font-semibold transition-all hover:bg-white/5">
              法規查詢
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <Link href="/inspect" className="group bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-orange-500/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/15 to-transparent border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📸
            </div>
            <h3 className="text-lg font-semibold mb-2">拍照辨識</h3>
            <p className="text-gray-400 text-sm">上傳工地照片，AI 自動辨識安全隱患，引用具體法條，評估風險等級。</p>
          </Link>
          <Link href="/checklist" className="group bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-orange-500/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/15 to-transparent border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📋
            </div>
            <h3 className="text-lg font-semibold mb-2">智慧巡檢表</h3>
            <p className="text-gray-400 text-sm">依工程類型自動生成檢查表，逐項勾選拍照，產出合規巡檢報告。</p>
          </Link>
          <Link href="/regulations" className="group bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-orange-500/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/15 to-transparent border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              ⚖️
            </div>
            <h3 className="text-lg font-semibold mb-2">法規查詢</h3>
            <p className="text-gray-400 text-sm">輸入情境或關鍵字，即時查詢職安法規條文，含罰則金額提示。</p>
          </Link>
          <Link href="/history" className="group bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-orange-500/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/15 to-transparent border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📊
            </div>
            <h3 className="text-lg font-semibold mb-2">巡檢紀錄</h3>
            <p className="text-gray-400 text-sm">查看歷史巡檢報告、違規趨勢分析、改善追蹤。</p>
          </Link>
        </div>

        <div className="mb-24">
          <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">涵蓋法規</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["職業安全衛生法", "營造安全衛生設施標準", "職安設施規則", "勞動檢查法", "高架作業保護標準", "缺氧症預防規則", "消防設備設置標準", "用戶用電裝置規則"].map((law) => (
              <div key={law} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-sm text-gray-300">{law}</div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-b from-orange-600/10 to-transparent border border-orange-500/20 rounded-2xl p-8 mb-24 text-center">
          <h2 className="text-2xl font-bold mb-3">一張罰單的錢，用一整年的安全</h2>
          <p className="text-gray-400 mb-6">營造業平均每張罰單 6-15 萬，N+Safety 專業版月費僅 4,990 元</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white/5 rounded-xl px-6 py-4">
              <div className="text-sm text-gray-400">基礎版</div>
              <div className="text-2xl font-bold">NT$1,990<span className="text-sm text-gray-400 font-normal">/月</span></div>
            </div>
            <div className="bg-orange-600/20 border border-orange-500/30 rounded-xl px-6 py-4">
              <div className="text-sm text-orange-400">專業版</div>
              <div className="text-2xl font-bold">NT$4,990<span className="text-sm text-gray-400 font-normal">/月</span></div>
            </div>
            <div className="bg-white/5 rounded-xl px-6 py-4">
              <div className="text-sm text-gray-400">企業版</div>
              <div className="text-2xl font-bold">聯繫我們</div>
            </div>
          </div>
        </div>

        <footer className="text-center text-gray-600 text-sm pb-12 border-t border-white/5 pt-8">
          N+Star International Co., Ltd. | N+Safety by N+Claw
        </footer>
      </main>
    </div>
  );
}
