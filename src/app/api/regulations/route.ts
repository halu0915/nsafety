// ── Regulation Search API (raw vector search) ──
import { searchRegulationsChecked, SEARCH_UNAVAILABLE_MESSAGE } from "@/lib/safety-kb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!q) {
    return Response.json({ error: "請輸入搜尋關鍵字" }, { status: 400 });
  }

  const { ok, results } = await searchRegulationsChecked(q, limit);
  if (!ok) {
    return Response.json(
      { query: q, count: 0, results: [], unavailable: true, error: SEARCH_UNAVAILABLE_MESSAGE },
      { status: 503 }
    );
  }

  if (results.length > 0 && results[0].score < 0.4) {
    return Response.json({
      query: q,
      count: results.length,
      results,
      suggestion: "搜尋結果相關度較低，建議使用更具體的關鍵字",
    });
  }

  return Response.json({ query: q, count: results.length, results });
}
