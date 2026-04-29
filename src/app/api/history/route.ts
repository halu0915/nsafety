import { getHistory, saveInspection } from "@/lib/inspection-store";
import { requireAuth, rateLimit } from "@/lib/api-guard";

// P2 #5: 加 auth gate（Origin 白名單 OR x-api-key）+ rate limit；同時備註持久化限制。
// NOTE: inspection-store 是 module-level in-memory，serverless cold start 會清空。
// 真正持久化需把 saveInspection / getHistory 換成 Vercel KV / Postgres / Blob。
// MVP 階段先保留 in-memory（避免 100 筆內看起來怪），並讓未來重構聚焦在 inspection-store.ts 一個檔。

export async function GET(request: Request) {
  const blocked = requireAuth(request) || rateLimit(request);
  if (blocked) return blocked;
  return Response.json({ records: getHistory() });
}

export async function POST(request: Request) {
  const blocked = requireAuth(request) || rateLimit(request);
  if (blocked) return blocked;
  const body = await request.json();
  saveInspection({
    id: `INS-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...body,
  });
  return Response.json({ success: true });
}
