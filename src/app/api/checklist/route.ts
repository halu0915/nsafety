// ── Checklist API ──
import { CHECKLIST_TEMPLATES } from "@/lib/safety-kb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "mep";

  const template = CHECKLIST_TEMPLATES[type as keyof typeof CHECKLIST_TEMPLATES];
  if (!template) {
    return Response.json({
      error: "無此巡檢表類型",
      available: Object.keys(CHECKLIST_TEMPLATES),
    }, { status: 400 });
  }

  return Response.json({ type, ...template });
}
