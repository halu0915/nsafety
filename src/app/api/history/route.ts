import { getHistory, saveInspection } from "@/lib/inspection-store";

export async function GET() {
  return Response.json({ records: getHistory() });
}

export async function POST(request: Request) {
  const body = await request.json();
  saveInspection({
    id: `INS-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...body,
  });
  return Response.json({ success: true });
}
