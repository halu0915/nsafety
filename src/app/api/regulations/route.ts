// ── Regulation Search API ──
import { searchRegulations } from "@/lib/safety-kb";

const SAFETY_KEYWORDS = [
  "安全", "衛生", "職安", "勞安", "工安", "護欄", "墜落", "電氣", "消防", "施工",
  "鷹架", "開挖", "缺氧", "高架", "作業", "防護", "安全帽", "滅火", "通道", "標示",
  "危險", "檢查", "巡檢", "違規", "罰", "法規", "條例", "規則", "標準", "設施",
  "模板", "吊掛", "機械", "設備", "勞動", "職業", "營造", "工地", "工程", "配管",
  "配電", "接地", "漏電", "防火", "逃生", "急救", "防爆", "通風", "照明", "噪音",
];

function isRelevantQuery(query: string): boolean {
  const q = query.toLowerCase();
  return SAFETY_KEYWORDS.some((kw) => q.includes(kw));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!q) {
    return Response.json({ error: "請輸入搜尋關鍵字" }, { status: 400 });
  }

  // Check if query is related to safety
  if (!isRelevantQuery(q)) {
    return Response.json({
      query: q,
      count: 0,
      results: [],
      redirect: true,
      message: "此問題與職業安全衛生無關。請提問工安、施工安全、法規合規等相關問題。例如：「高架作業護欄規定」「電氣設備接地要求」「局限空間作業安全」",
    });
  }

  const results = await searchRegulations(q, limit);

  // If results are all low score, suggest better query
  if (results.length > 0 && results[0].score < 0.4) {
    return Response.json({
      query: q,
      count: results.length,
      results,
      suggestion: "搜尋結果相關度較低，建議使用更具體的關鍵字。例如：「護欄高度」「電線接地」「消防設備」",
    });
  }

  return Response.json({ query: q, count: results.length, results });
}
