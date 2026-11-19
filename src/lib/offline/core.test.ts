import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { applyOutbox, clearAllOffline, enqueue, listOutbox, prepareInsertBody, replayOutbox } from "./core";

const BASE = "https://x.supabase.co/rest/v1";
const hdr = { prefer: "return=representation", authorization: "Bearer old" };

beforeEach(async () => { await clearAllOffline(); });

describe("offline outbox", () => {
  it("replays queued changes in the order they were made", async () => {
    await enqueue({ url: `${BASE}/patients`, method: "POST", headers: hdr, body: '{"id":"p1"}', table: "patients" });
    await enqueue({ url: `${BASE}/patient_visits`, method: "POST", headers: hdr, body: '{"id":"v1","patient_id":"p1"}', table: "patient_visits" });
    await enqueue({ url: `${BASE}/service_queue?id=eq.q1`, method: "PATCH", headers: hdr, body: '{"status":"completed"}', table: "service_queue" });
    const seen: string[] = [];
    const r = await replayOutbox(async (url) => { seen.push(url.replace(BASE, "")); return new Response(null, { status: 201 }); }, () => "Bearer new");
    expect(seen).toEqual(["/patients", "/patient_visits", "/service_queue?id=eq.q1"]);
    expect(r.sent).toBe(3);
    expect(await listOutbox()).toHaveLength(0);
  });

  it("uses the newest sign-in token when sending", async () => {
    await enqueue({ url: `${BASE}/patients`, method: "POST", headers: hdr, body: "{}", table: "patients" });
    let auth = "";
    await replayOutbox(async (_u, init) => { auth = (init.headers as any).authorization; return new Response(null, { status: 201 }); }, () => "Bearer new");
    expect(auth).toBe("Bearer new");
  });

  it("keeps changes and stops when the connection drops mid-sync", async () => {
    await enqueue({ url: `${BASE}/a`, method: "POST", headers: hdr, body: "{}", table: "a" });
    await enqueue({ url: `${BASE}/b`, method: "POST", headers: hdr, body: "{}", table: "b" });
    let n = 0;
    await replayOutbox(async () => { if (n++ === 0) return new Response(null, { status: 201 }); throw new TypeError("network"); }, () => null);
    const left = await listOutbox();
    expect(left.map((i) => i.table)).toEqual(["b"]);
    expect(left[0].status).toBe("pending");
  });

  it("marks a rejected change as failed so it can be retried or discarded", async () => {
    await enqueue({ url: `${BASE}/a`, method: "POST", headers: hdr, body: "{}", table: "a" });
    const r = await replayOutbox(async () => new Response('{"message":"bad"}', { status: 400 }), () => null);
    expect(r.failed).toBe(1);
    expect((await listOutbox())[0].status).toBe("failed");
  });

  it("gives new offline rows an id so linked records stay attached", () => {
    const { body, rows } = prepareInsertBody('{"first_name":"Ann"}');
    const id = JSON.parse(body!).id;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(rows[0].id).toBe(id);
  });

  it("shows offline-added and edited rows on cached screens", async () => {
    await enqueue({ url: `${BASE}/service_queue`, method: "POST", headers: hdr, body: '{"id":"q2","patient_visit_id":"v1","status":"waiting"}', table: "service_queue" });
    await enqueue({ url: `${BASE}/service_queue?id=eq.q1`, method: "PATCH", headers: hdr, body: '{"status":"completed"}', table: "service_queue" });
    const rows = applyOutbox(`${BASE}/service_queue?select=*&patient_visit_id=eq.v1`, [{ id: "q1", patient_visit_id: "v1", status: "waiting" }], await listOutbox());
    expect(rows.map((r) => [r.id, r.status])).toEqual([["q1", "completed"], ["q2", "waiting"]]);
  });
});
