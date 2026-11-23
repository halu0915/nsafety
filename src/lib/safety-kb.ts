// ── N+Safety Knowledge Base Integration ──
// Connects to the regulation vector search service (self-hosted on nplus-box
// behind a Cloudflare Tunnel). Override with SAFETY_SEARCH_API.

const SEARCH_API = process.env.SAFETY_SEARCH_API || "https://safety-search.nplusstar.ai";
const SEARCH_TIMEOUT_MS = 8_000;
export const SEARCH_UNAVAILABLE_MESSAGE = "法規查詢服務暫停，請稍後再試";

export interface RegulationResult {
  content: string;
  filePath: string;
  sectionTitle: string;
  score: number;
}

// Returns null unless the body is {results: [...]} with every item carrying
// content/file/section strings and a finite score. [] is a valid empty result.
function parseSearchResults(data: unknown): RegulationResult[] | null {
  if (!data || typeof data !== "object") return null;
  const results = (data as { results?: unknown }).results;
  if (!Array.isArray(results)) return null;
  const out: RegulationResult[] = [];
  for (const r of results) {
    if (!r || typeof r !== "object") return null;
    const { content, file, section, score } = r as Record<string, unknown>;
    if (typeof content !== "string" || typeof file !== "string" || typeof section !== "string") return null;
    if (typeof score !== "number" || !Number.isFinite(score)) return null;
    out.push({ content, filePath: file, sectionTitle: section, score });
  }
  return out;
}

// ok=false means the search service could not be reached (host off, tunnel
// down, timeout, non-2xx) — distinct from "reachable but nothing found".
export async function searchRegulationsChecked(
  query: string,
  limit: number = 5
): Promise<{ ok: boolean; results: RegulationResult[] }> {
  try {
    const url = `${SEARCH_API}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS) });
    if (!resp.ok) {
      console.warn("safety-search unavailable: HTTP", resp.status);
      return { ok: false, results: [] };
    }

    const data: unknown = await resp.json();
    const results = parseSearchResults(data);
    if (!results) {
      // 200 but an error envelope or missing fields: treat as unavailable so
      // callers never build an answer on top of a broken response
      console.warn("safety-search unavailable: malformed response");
      return { ok: false, results: [] };
    }
    return { ok: true, results };
  } catch (err) {
    console.warn("safety-search unavailable:", err);
    return { ok: false, results: [] };
  }
}

export async function searchRegulations(
  query: string,
  limit: number = 5
): Promise<RegulationResult[]> {
  return (await searchRegulationsChecked(query, limit)).results;
}

// Common violation database
export const COMMON_VIOLATIONS = [
  {
    id: "V001",
    category: "墜落",
    description: "高度 2 公尺以上工作場所未設護欄",
    regulation: "營造安全衛生設施標準第 19 條",
    penalty: "3-30 萬",
    severity: "high",
    keywords: ["護欄", "高架", "墜落", "開口"],
  },
  {
    id: "V002",
    category: "電氣",
    description: "電線外露或接地不良",
    regulation: "職安設施規則第 243 條",
    penalty: "3-30 萬",
    severity: "high",
    keywords: ["電線", "漏電", "接地", "配電箱"],
  },
  {
    id: "V003",
    category: "個人防護",
    description: "未提供或未佩戴安全帽",
    regulation: "職安法第 6 條、營造標準第 11-1 條",
    penalty: "3-30 萬",
    severity: "medium",
    keywords: ["安全帽", "頭盔", "防護具"],
  },
  {
    id: "V004",
    category: "開挖",
    description: "開挖深度超過 1.5 公尺未設擋土支撐",
    regulation: "營造安全衛生設施標準第 71 條",
    penalty: "3-30 萬",
    severity: "high",
    keywords: ["開挖", "擋土", "崩塌", "溝渠"],
  },
  {
    id: "V005",
    category: "鷹架",
    description: "施工架未設交叉拉桿或工作平台",
    regulation: "營造安全衛生設施標準第 40 條",
    penalty: "3-30 萬",
    severity: "high",
    keywords: ["鷹架", "施工架", "踏板", "拉桿"],
  },
  {
    id: "V006",
    category: "通道",
    description: "安全通道或逃生路線被堵塞",
    regulation: "職安設施規則第 32 條",
    penalty: "3-15 萬",
    severity: "medium",
    keywords: ["通道", "逃生", "出口", "堆放"],
  },
  {
    id: "V007",
    category: "標示",
    description: "危險區域未設置警告標示",
    regulation: "職安設施規則第 21 條",
    penalty: "3-15 萬",
    severity: "low",
    keywords: ["標示", "警告", "危險區域", "告示"],
  },
  {
    id: "V008",
    category: "消防",
    description: "工地未設置滅火器或消防設備",
    regulation: "營造安全衛生設施標準第 228 條",
    penalty: "3-15 萬",
    severity: "medium",
    keywords: ["滅火器", "消防", "火災", "防火"],
  },
  {
    id: "V009",
    category: "墜落",
    description: "使用合梯作業未有防滑措施",
    regulation: "職安設施規則第 230 條",
    penalty: "3-15 萬",
    severity: "medium",
    keywords: ["合梯", "梯子", "A字梯", "爬梯"],
  },
  {
    id: "V010",
    category: "缺氧",
    description: "局限空間作業未測定氧氣濃度",
    regulation: "缺氧症預防規則第 4 條",
    penalty: "3-30 萬",
    severity: "high",
    keywords: ["局限空間", "缺氧", "人孔", "水塔", "管道"],
  },
];

// Checklist templates by project type
export const CHECKLIST_TEMPLATES = {
  mep: {
    name: "機電工程巡檢表",
    items: [
      { id: "M01", category: "電氣", item: "配電箱門是否關閉上鎖", regulation: "職安設施規則§243" },
      { id: "M02", category: "電氣", item: "臨時用電是否有漏電斷路器", regulation: "職安設施規則§244" },
      { id: "M03", category: "電氣", item: "電線是否有破損外露", regulation: "職安設施規則§246" },
      { id: "M04", category: "電氣", item: "電氣設備是否接地", regulation: "職安設施規則§250" },
      { id: "M05", category: "管路", item: "管路開口是否有蓋板或護欄", regulation: "營造標準§19" },
      { id: "M06", category: "管路", item: "管路支撐是否穩固", regulation: "職安設施規則§167" },
      { id: "M07", category: "高架", item: "2 公尺以上作業是否有護欄", regulation: "營造標準§19" },
      { id: "M08", category: "高架", item: "工作人員是否佩戴安全帶", regulation: "營造標準§22" },
      { id: "M09", category: "防護", item: "工作人員是否佩戴安全帽", regulation: "營造標準§11-1" },
      { id: "M10", category: "防護", item: "是否提供適當手套/護目鏡", regulation: "職安法§6" },
      { id: "M11", category: "通道", item: "逃生通道是否暢通", regulation: "職安設施規則§32" },
      { id: "M12", category: "消防", item: "是否配置滅火器", regulation: "營造標準§228" },
      { id: "M13", category: "環境", item: "工作場所照明是否充足", regulation: "職安設施規則§313" },
      { id: "M14", category: "環境", item: "工作場所通風是否良好", regulation: "職安設施規則§312" },
      { id: "M15", category: "標示", item: "危險區域是否有警告標示", regulation: "職安設施規則§21" },
    ],
  },
  construction: {
    name: "一般營造巡檢表",
    items: [
      { id: "C01", category: "墜落", item: "開口處是否設護欄或蓋板", regulation: "營造標準§19" },
      { id: "C02", category: "墜落", item: "屋頂作業是否有安全網", regulation: "營造標準§18" },
      { id: "C03", category: "鷹架", item: "施工架是否穩固、有交叉拉桿", regulation: "營造標準§40" },
      { id: "C04", category: "鷹架", item: "施工架踏板是否完整無缺口", regulation: "營造標準§46" },
      { id: "C05", category: "開挖", item: "開挖面是否有擋土措施", regulation: "營造標準§71" },
      { id: "C06", category: "模板", item: "模板支撐是否經結構計算", regulation: "營造標準§131" },
      { id: "C07", category: "吊掛", item: "吊掛作業是否有指揮人員", regulation: "營造標準§163" },
      { id: "C08", category: "電氣", item: "臨時電源是否合規", regulation: "職安設施規則§243" },
      { id: "C09", category: "防護", item: "全員是否佩戴安全帽", regulation: "營造標準§11-1" },
      { id: "C10", category: "消防", item: "是否配置滅火器具", regulation: "營造標準§228" },
    ],
  },
};
