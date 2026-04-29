/**
 * 共用 API 防護：auth、rate limit、SSRF、MIME/size 驗證
 * 所有對外 AI endpoint 都應使用，避免被陌生人燒帳單。
 */

// ── Auth ───────────────────────────────────────────────────────────

/**
 * 驗證 API key header。沒設 NSAFETY_API_KEY 時 fail-closed（拒絕請求）。
 * 用：const failed = requireAuth(req); if (failed) return failed;
 */
export function requireAuth(req: Request): Response | null {
  const expected = process.env.NSAFETY_API_KEY;
  if (!expected || expected.length < 16) {
    console.error("[api-guard] NSAFETY_API_KEY env missing or too short — refusing all requests");
    return Response.json(
      { error: "API not configured" },
      { status: 503 }
    );
  }
  const provided = req.headers.get("x-api-key");
  if (!provided || provided !== expected) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  return null;
}

// ── Rate Limit (in-memory, best-effort) ────────────────────────────
// 注意：serverless 跨 instance 不共享，這是 best-effort 防 burst。
// 真要嚴謹防護要接 Upstash Redis。

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10; // 10 req / 60s / IP

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function rateLimit(req: Request): Response | null {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return Response.json(
      { error: `Rate limit exceeded. Try again in ${retryAfter}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  bucket.count++;
  return null;
}

// ── Image upload validation ────────────────────────────────────────

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): Response | null {
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return Response.json(
      {
        error: `Unsupported image type: ${file.type}. Allowed: ${[...ALLOWED_IMAGE_MIME].join(", ")}`,
      },
      { status: 415 }
    );
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return Response.json(
      {
        error: `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`,
      },
      { status: 413 }
    );
  }
  return null;
}

// ── SSRF protection on image URL ───────────────────────────────────
// 拒絕 file://、localhost、private/link-local IP、.internal/.local 等

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254", // AWS / GCP metadata
]);

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [parseInt(m[1]!, 10), parseInt(m[2]!, 10)];
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 127) return true;
  return false;
}

export function validateImageUrl(url: string): Response | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: "Invalid imageUrl" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return Response.json(
      { error: "imageUrl must use http or https protocol" },
      { status: 400 }
    );
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) {
    return Response.json({ error: "imageUrl points to a blocked host" }, { status: 400 });
  }
  if (host.endsWith(".internal") || host.endsWith(".local") || host.endsWith(".localhost")) {
    return Response.json({ error: "imageUrl points to an internal host" }, { status: 400 });
  }
  if (isPrivateIPv4(host)) {
    return Response.json({ error: "imageUrl points to a private IP" }, { status: 400 });
  }
  return null;
}

// ── Convenience: combined gate ─────────────────────────────────────
/**
 * 一次跑：auth → rate limit。失敗回 Response，成功回 null。
 * Image 驗證另外個別呼叫（因為要看是 file 或 url）。
 */
export function gate(req: Request): Response | null {
  return requireAuth(req) || rateLimit(req);
}
