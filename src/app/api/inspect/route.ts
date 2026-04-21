// ── Photo Inspection API ──
// Upload a construction site photo, AI identifies safety violations

import { searchRegulations, COMMON_VIOLATIONS } from "@/lib/safety-kb";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image") as File | null;
  const imageUrl = formData.get("imageUrl") as string | null;

  if (!image && !imageUrl) {
    return Response.json({ error: "請上傳工地照片或提供圖片 URL" }, { status: 400 });
  }

  // Convert image to base64 if file uploaded
  let imageContent: { type: "image_url"; image_url: { url: string } };

  if (image) {
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";
    imageContent = {
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${base64}` },
    };
  } else {
    imageContent = {
      type: "image_url",
      image_url: { url: imageUrl! },
    };
  }

  // Build violation keywords for context
  const violationContext = COMMON_VIOLATIONS.map(
    (v) => `- ${v.description}（${v.regulation}，罰鍰${v.penalty}）`
  ).join("\n");

  const systemPrompt = `你是台灣職業安全衛生專家，專門辨識工地安全隱患。

根據照片，你需要：
1. 辨識所有可能的安全違規項目
2. 引用具體法條（台灣職安法規）
3. 評估風險等級（高/中/低）
4. 提供改善建議

常見違規項目參考：
${violationContext}

回覆格式（JSON）：
{
  "scene_description": "場景描述",
  "violations": [
    {
      "item": "違規項目",
      "regulation": "違反法條",
      "severity": "high|medium|low",
      "penalty": "可能罰鍰",
      "suggestion": "改善建議"
    }
  ],
  "risk_score": 1-10,
  "overall_assessment": "整體評估",
  "immediate_actions": ["立即需要做的事"]
}

如果照片中沒有明顯違規，也要說明觀察到的安全措施。
回覆必須是合法 JSON 格式。`;

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-6",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              imageContent,
              { type: "text", text: "請分析這張工地照片的安全狀況，辨識所有違規項目。" },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      return Response.json({ error: `AI 分析失敗: ${resp.status}` }, { status: 500 });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      result = { raw: content };
    }

    // Enrich with KB search for mentioned regulations
    if (result.violations) {
      for (const v of result.violations) {
        if (v.regulation) {
          const kbResults = await searchRegulations(v.regulation, 1);
          if (kbResults.length > 0) {
            v.regulation_detail = kbResults[0].content.slice(0, 300);
          }
        }
      }
    }

    return Response.json({ success: true, inspection: result });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "分析失敗" },
      { status: 500 }
    );
  }
}
