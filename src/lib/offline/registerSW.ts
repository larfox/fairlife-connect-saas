// The only place the offline app-shell worker is registered.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const PROJECT_ID = "1fc89a45-d904-4cab-a255-646ab7ea3952";

function refused(): boolean {
  if (!import.meta.env.PROD) return true;
  try { if (window.self !== window.top) return true; } catch { return true; }
  const h = window.location.hostname.toLowerCase();
  const label = h.split(".")[0];
  const lovableHost = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(h);
  if (lovableHost && PREVIEW_LABEL.test(label)) return true;
  if (lovableHost && label === `project--${PROJECT_ID}-dev`) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppSW() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.filter((r) => (r.active || r.installing || r.waiting)?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
}

export async function registerAppServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (refused()) { await unregisterAppSW().catch(() => {}); return; }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}
