// Tests for the regulation search client and the two routes that depend on it.
// Transpiles the real source with the repo's TypeScript and runs it in a VM
// with a stubbed fetch, so no search service or OpenRouter call is made.
// Run: npm test   (node:test)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const src = (p) => new URL(`../src/${p}`, import.meta.url);

function load(file, imports, fetch) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    module: { exports },
    require: (id) => {
      if (id in imports) return imports[id];
      throw new Error("unexpected import " + id);
    },
    fetch,
    process: { env: { SAFETY_SEARCH_API: "https://search.invalid" } },
    Response, Request, URL, URLSearchParams, AbortSignal, Number, Array, JSON, String, Error, Object,
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout,
  });
  return exports;
}

async function scenario(searchResponse) {
  let aiCalls = 0;
  const fetch = async (url, opt) => {
    if (String(url).includes("openrouter")) {
      aiCalls++;
      return Response.json({ choices: [{ message: { content: "synthetic answer" } }] });
    }
    return searchResponse(url, opt);
  };
  const kb = load(src("lib/safety-kb.ts"), {}, fetch);
  const guard = { gate: () => null };
  const chat = load(src("app/api/regulations/chat/route.ts"), { "@/lib/safety-kb": kb, "@/lib/api-guard": guard }, fetch);
  const raw = load(src("app/api/regulations/route.ts"), { "@/lib/safety-kb": kb }, fetch);
  const chatRes = await chat.POST(
    new Request("http://test.invalid/api/regulations/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "工地安全帽規範" }),
    })
  );
  const rawRes = await raw.GET(new Request("http://test.invalid/api/regulations?q=test"));
  return { chat: await chatRes.json(), rawStatus: rawRes.status, raw: await rawRes.json(), aiCalls };
}

const GOOD_ITEM = { content: "雇主應提供安全帽", file: "職業安全衛生設施規則.md", section: "第 11-1 條", score: 0.62 };

test("healthy results -> AI is called, raw route 200 with mapped fields", async () => {
  const r = await scenario(() => Response.json({ query: "q", count: 1, results: [GOOD_ITEM] }));
  assert.equal(r.aiCalls, 1);
  assert.equal(r.rawStatus, 200);
  assert.deepEqual(Object.keys(r.raw.results[0]).sort(), ["content", "filePath", "score", "sectionTitle"]);
});

test("legitimate empty results stay usable (not 'paused')", async () => {
  const r = await scenario(() => Response.json({ query: "q", count: 0, results: [] }));
  assert.equal(r.aiCalls, 1);
  assert.equal(r.rawStatus, 200);
  assert.equal(r.chat.unavailable, undefined);
});

// N1: HTTP 200 but broken body must be "paused" and must not reach the AI
for (const [name, body] of [
  ["error envelope", { error: "index unavailable" }],
  ["results not an array", { results: {} }],
  ["item missing fields", { results: [{}] }],
  ["score not a number", { results: [{ ...GOOD_ITEM, score: "high" }] }],
  ["null item", { results: [null] }],
  ["non-object body", "just a string"],
]) {
  test(`N1 HTTP 200 ${name} -> paused, AI not called`, async () => {
    const r = await scenario(() => Response.json(body));
    assert.equal(r.aiCalls, 0);
    assert.equal(r.chat.unavailable, true);
    assert.equal(r.rawStatus, 503);
    assert.equal(r.raw.unavailable, true);
  });
}

for (const [name, factory] of [
  ["HTTP 502", () => new Response("down", { status: 502 })],
  ["connection refused", () => { throw new TypeError("ECONNREFUSED"); }],
  ["invalid JSON", () => new Response("<html>wrong</html>")],
]) {
  test(`${name} -> paused, AI not called`, async () => {
    const r = await scenario(factory);
    assert.equal(r.aiCalls, 0);
    assert.equal(r.chat.answer, "法規查詢服務暫停，請稍後再試。");
    assert.equal(r.rawStatus, 503);
  });
}
