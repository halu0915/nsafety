// ── Regulation Chat API ──
// User asks a question → search KB → LLM answers using real regulations

import { searchRegulations } from "@/lib/safety-kb";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const SAFETY_KEYWORDS = [
  "安全", "衛生", "職安", "勞安", "工安", "護欄", "墜落", "電氣", "消防", "施工",
  "鷹架", "開挖", "缺氧", "高架", "作業", "防護", "安全帽", "滅火", "通道", "標示",
  "危險", "檢查", "巡檢", "違規", "罰", "法規", "條例", "規則", "標準", "設施",
  "模板", "吊掛", "機械", "設備", "勞動", "職業", "營造", "工地", "工程", "配管",
  "配電", "接地", "漏電", "防火", "逃生", "急救", "通風", "照明", "噪音", "唱歌",
  "可以嗎", "規定", "要求", "怎麼", "需要", "合規", "違法", "處罰",
];

function isRelevantQuery(query: string): boolean {
  return SAFETY_KEYWORDS.some((kw) => query.includes(kw));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { question } = body;

  if (!question) {
    return Response.json({ error: "請輸入問題" }, { status: 400 });
  }

  // Off-topic filter
  if (!isRelevantQuery(question)) {
    return Response.json({
      answer: "這個問題與職業安全衛生無關。我是工安法規助手，可以回答工地安全、施工規範、職安法規等問題。\n\n試試問我：\n- 高架作業需要什麼防護？\n- 配電箱有什麼安全規定？\n- 工地噪音的法規限制？",
      sources: [],
    });
  }

  // Search knowledge base
  const kbResults = await searchRegulations(question, 5);
  const context = kbResults
    .filter((r) => r.score > 0.35)
    .map((r) => `【${r.filePath} ${r.sectionTitle}】\n${r.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `你是台灣職業安全衛生法規專家。根據以下法規資料回答用戶問題。

規則：
1. 只根據提供的法規資料回答，不要編造法條
2. 用口語化的方式回答，不要只丟法條
3. 先回答問題的結論，再引用具體法條佐證
4. 如果法規資料不足以回答，誠實說明並建議查詢方向
5. 適當提醒罰則金額
6. 回答要實用，站在工地現場人員的角度
7. 不回答與工安無關的問題

法規資料：
${context || "（未找到相關法規，請根據一般職安知識回答，並提醒用戶此回答僅供參考）"}`;

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_tokens: 1000,
      }),
    });

    if (!resp.ok) {
      return Response.json({ error: `AI 回答失敗: ${resp.status}` }, { status: 500 });
    }

    const data = await resp.json();
    const answer = data.choices?.[0]?.message?.content || "無法回答";

    return Response.json({
      answer,
      sources: kbResults.filter((r) => r.score > 0.35).map((r) => ({
        file: r.filePath,
        section: r.sectionTitle,
        score: r.score,
      })),
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "回答失敗" },
      { status: 500 }
    );
  }
}
