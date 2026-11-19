// Offline layer: caches Supabase REST reads and queues writes while offline.
// Pure logic lives here so it can be unit-tested; install.ts wires it to window.fetch.
import { get, set, del, keys, createStore, type UseStore } from "idb-keyval";

export type OutboxItem = {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  table: string;
  createdAt: number;
  attempts: number;
  error?: string;
  status: "pending" | "failed";
};

let cacheStore: UseStore | undefined;
let outboxStore: UseStore | undefined;
const stores = () => {
  if (!cacheStore) cacheStore = createStore("fairlife-offline-cache", "responses");
  if (!outboxStore) outboxStore = createStore("fairlife-offline-outbox", "items");
  return { cacheStore: cacheStore!, outboxStore: outboxStore! };
};

const listeners = new Set<() => void>();
export const onOutboxChange = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const notify = () => listeners.forEach((l) => l());

export const restTable = (url: string): string | null => {
  const m = new URL(url).pathname.match(/\/rest\/v1\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export const cacheKey = (url: string, headers: Record<string, string>) => {
  const accept = headers["accept"] || "";
  const prefer = headers["prefer"] || "";
  return `${accept}|${prefer}|${url}`;
};

export async function putCache(key: string, body: string, status: number, contentRange?: string | null) {
  await set(key, { body, status, contentRange: contentRange ?? null, at: Date.now() }, stores().cacheStore);
}
export async function getCache(key: string) {
  return (await get(key, stores().cacheStore)) as
    | { body: string; status: number; contentRange: string | null }
    | undefined;
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const { outboxStore } = stores();
  const ks = await keys(outboxStore);
  const items = await Promise.all(ks.map((k) => get(k, outboxStore)));
  return (items.filter(Boolean) as OutboxItem[]).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
let seq = 0;
export async function enqueue(item: Omit<OutboxItem, "id" | "createdAt" | "attempts" | "status">) {
  const now = Date.now();
  const full: OutboxItem = { ...item, id: `${now}-${String(seq++).padStart(6, "0")}`, createdAt: now, attempts: 0, status: "pending" };
  await set(full.id, full, stores().outboxStore);
  notify();
  return full;
}
export async function updateOutbox(item: OutboxItem) {
  await set(item.id, item, stores().outboxStore);
  notify();
}
export async function removeOutbox(id: string) {
  await del(id, stores().outboxStore);
  notify();
}
export async function clearAllOffline() {
  const { cacheStore, outboxStore } = stores();
  for (const k of await keys(cacheStore)) await del(k, cacheStore);
  for (const k of await keys(outboxStore)) await del(k, outboxStore);
  notify();
}

const uuid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    }));

/** Give new rows an id and timestamps so linked rows can reference them before sync. */
export function prepareInsertBody(body: string | null): { body: string | null; rows: any[] } {
  if (!body) return { body, rows: [] };
  let parsed: any;
  try { parsed = JSON.parse(body); } catch { return { body, rows: [] }; }
  const now = new Date().toISOString();
  const fill = (r: any) => ({ id: r.id ?? uuid(), ...r });
  const withIds = Array.isArray(parsed) ? parsed.map(fill) : fill(parsed);
  const rows = (Array.isArray(withIds) ? withIds : [withIds]).map((r: any) => ({
    created_at: now, updated_at: now, __pending: true, ...r,
  }));
  return { body: JSON.stringify(withIds), rows };
}

/** Simple `col=eq.value` filters from a PostgREST URL. Returns null when other filter kinds are used. */
export function eqFilters(url: string): Record<string, string> | null {
  const u = new URL(url);
  const out: Record<string, string> = {};
  for (const [k, v] of u.searchParams) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(k)) continue;
    if (!v.startsWith("eq.")) return null;
    out[k] = v.slice(3);
  }
  return out;
}

const matches = (row: any, f: Record<string, string>) =>
  Object.entries(f).every(([k, v]) => String(row?.[k]) === v);

/** Overlay pending outbox writes onto a cached read so offline screens show new work. */
export function applyOutbox(url: string, rows: any[], outbox: OutboxItem[]): any[] {
  const table = restTable(url);
  const sel = new URL(url).searchParams.get("select") || "*";
  const filters = eqFilters(url);
  let result = [...rows];
  for (const item of outbox) {
    if (item.table !== table) continue;
    const body = item.body ? safeParse(item.body) : null;
    if (item.method === "POST" && filters && !sel.includes("(")) {
      const now = new Date(item.createdAt).toISOString();
      const list = Array.isArray(body) ? body : body ? [body] : [];
      for (const r of list) {
        const row = { created_at: now, updated_at: now, __pending: true, ...r };
        const idx = result.findIndex((x) => x?.id && x.id === row.id);
        if (idx >= 0) result[idx] = { ...result[idx], ...row };
        else if (matches(row, filters)) result.push(row);
      }
    } else if (item.method === "PATCH" && body) {
      const f = eqFilters(item.url);
      if (!f) continue;
      result = result.map((r) => (matches(r, f) ? { ...r, ...body } : r));
    } else if (item.method === "DELETE") {
      const f = eqFilters(item.url);
      if (!f) continue;
      result = result.filter((r) => !matches(r, f));
    }
  }
  return result;
}
const safeParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };

/** Replays queued writes in order. Returns counts. */
export async function replayOutbox(
  doFetch: (url: string, init: RequestInit) => Promise<Response>,
  authHeader: () => string | null,
): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0;
  for (const item of await listOutbox()) {
    if (item.status === "failed") { failed++; continue; }
    const headers = { ...item.headers };
    const auth = authHeader();
    if (auth) headers["authorization"] = auth;
    // Ask PostgREST for minimal replies so replays don't depend on select columns
    headers["prefer"] = (headers["prefer"] || "").replace(/return=representation/, "return=minimal");
    try {
      const res = await doFetch(item.url, { method: item.method, headers, body: item.body });
      if (res.ok) { await removeOutbox(item.id); sent++; continue; }
      const text = await res.text().catch(() => "");
      // Duplicate key on replay of an insert that already landed counts as success
      if (res.status === 409 && item.method === "POST" && /duplicate key/i.test(text) && !/on_conflict/.test(item.url)) {
        await removeOutbox(item.id); sent++; continue;
      }
      if (res.status >= 500 || res.status === 401) {
        // Server/auth trouble: stop and retry later, keep order
        await updateOutbox({ ...item, attempts: item.attempts + 1, error: text.slice(0, 300) });
        break;
      }
      await updateOutbox({ ...item, attempts: item.attempts + 1, status: "failed", error: text.slice(0, 300) || `HTTP ${res.status}` });
      failed++;
    } catch {
      break; // network down again
    }
  }
  return { sent, failed };
}
