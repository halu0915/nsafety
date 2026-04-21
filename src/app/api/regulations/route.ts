// ── Regulation Search API (raw vector search) ──
import { searchRegulations } from "@/lib/safety-kb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!q) {
    return Response.json({ error: "請輸入搜尋關鍵字" }, { status: 400 });
  }

  const results = await searchRegulations(q, limit);

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
