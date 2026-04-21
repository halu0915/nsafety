// ── Regulation Search API ──
import { searchRegulations } from "@/lib/safety-kb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!q) {
    return Response.json({ error: "請輸入搜尋關鍵字" }, { status: 400 });
  }

  const results = await searchRegulations(q, limit);
  return Response.json({ query: q, count: results.length, results });
}
