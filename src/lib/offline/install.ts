// Must be imported before the Supabase client is created (first import in main.tsx).
import {
  applyOutbox, cacheKey, enqueue, getCache, listOutbox, prepareInsertBody,
  putCache, replayOutbox, restTable,
} from "./core";

const SUPABASE_HOST = "njcwpdgrdcxlaglvdxkx.supabase.co";
// Tables that must never be edited offline (need full, current data or admin rights)
const ONLINE_ONLY_WRITES = new Set(["staff", "staff_service_permissions", "services", "locations", "doctors", "nurses", "towns", "service_prices"]);

const realFetch: typeof fetch = window.fetch.bind(window);
let lastAuth: string | null = null;
let forcedOffline = false;

export const isOffline = () => forcedOffline || !navigator.onLine;
/** For testing: simulate being offline via ?offline=1 */
if (new URLSearchParams(location.search).get("offline") === "1") forcedOffline = true;

const headersToObj = (h?: HeadersInit): Record<string, string> => {
  const out: Record<string, string> = {};
  new Headers(h).forEach((v, k) => (out[k.toLowerCase()] = v));
  return out;
};

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status, headers: { "content-type": "application/json", ...extra },
  });

async function offlineRead(url: string, headers: Record<string, string>) {
  const cached = await getCache(cacheKey(url, headers));
  const outbox = await listOutbox();
  const single = (headers["accept"] || "").includes("vnd.pgrst.object");
  if (!cached) {
    // Nothing cached: still show anything created offline for simple lookups
    const rows = applyOutbox(url, [], outbox);
    if (single) return rows[0] ? json(rows[0]) : json({ message: "Not available offline", code: "PGRST116" }, 406);
    return json(rows, 200, { "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
  }
  let data: any = null;
  try { data = cached.body ? JSON.parse(cached.body) : null; } catch { /* keep raw */ }
  if (Array.isArray(data)) {
    const rows = applyOutbox(url, data, outbox);
    return json(rows, cached.status, { "content-range": cached.contentRange ?? `0-${rows.length - 1}/${rows.length}` });
  }
  if (data && typeof data === "object") {
    const [merged] = applyOutbox(url, [data], outbox);
    return json(merged ?? data, cached.status);
  }
  return new Response(cached.body, { status: cached.status, headers: { "content-type": "application/json" } });
}

async function offlineWrite(url: string, method: string, headers: Record<string, string>, rawBody: string | null) {
  const table = restTable(url)!;
  if (ONLINE_ONLY_WRITES.has(table)) {
    return json({ message: "This change needs an internet connection.", code: "OFFLINE" }, 503);
  }
  let body = rawBody;
  let rows: any[] = [];
  if (method === "POST") ({ body, rows } = prepareInsertBody(rawBody));
  else if (rawBody) { try { const b = JSON.parse(rawBody); rows = [b]; } catch { /* ignore */ } }
  await enqueue({ url, method, headers, body, table });
  window.dispatchEvent(new CustomEvent("offline-queued"));
  const wantsRows = (headers["prefer"] || "").includes("return=representation");
  if (!wantsRows) return new Response(null, { status: 201 });
  const single = (headers["accept"] || "").includes("vnd.pgrst.object");
  return json(single ? rows[0] ?? {} : rows, 201);
}

const offlineFetch: typeof fetch = async (input, init) => {
  const req = input instanceof Request ? input : null;
  const url = req ? req.url : String(input);
  if (!url.includes(SUPABASE_HOST)) return realFetch(input as any, init);
  const method = (init?.method || req?.method || "GET").toUpperCase();
  const headers = headersToObj(init?.headers || req?.headers);
  if (headers["authorization"] && !headers["authorization"].includes(headers["apikey"] || "__")) lastAuth = headers["authorization"];
  const isRest = url.includes("/rest/v1/") && !url.includes("/rest/v1/rpc/");
  if (!isRest) return realFetch(input as any, init);

  if (isOffline()) {
    if (method === "GET" || method === "HEAD") return offlineRead(url, headers);
    const body = typeof init?.body === "string" ? init.body : init?.body ? String(init.body) : null;
    return offlineWrite(url, method, headers, body);
  }

  try {
    const res = await realFetch(input as any, init);
    if (method === "GET" && res.ok) {
      res.clone().text().then((t) => putCache(cacheKey(url, headers), t, res.status, res.headers.get("content-range"))).catch(() => {});
    }
    return res;
  } catch (e) {
    // Connection dropped mid-request: fall back to offline handling
    if (method === "GET" || method === "HEAD") return offlineRead(url, headers);
    const body = typeof init?.body === "string" ? init.body : null;
    return offlineWrite(url, method, headers, body);
  }
};

window.fetch = offlineFetch;

let syncing = false;
export async function syncNow() {
  if (syncing || isOffline()) return;
  syncing = true;
  window.dispatchEvent(new CustomEvent("offline-sync", { detail: { state: "start" } }));
  try {
    const r = await replayOutbox(realFetch, () => lastAuth);
    window.dispatchEvent(new CustomEvent("offline-sync", { detail: { state: "done", ...r } }));
  } finally {
    syncing = false;
  }
}
export function setForcedOffline(v: boolean) {
  forcedOffline = v;
  window.dispatchEvent(new Event(v ? "offline" : "online"));
}
window.addEventListener("online", () => setTimeout(syncNow, 1500));
setInterval(() => { syncNow(); }, 30000);
