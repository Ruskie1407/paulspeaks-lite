const THREAD = "paulspeaks";

export async function loadMessages(limit = 50) {
  const r = await fetch(`/api/messages?thread=${THREAD}&limit=${limit}`, { cache: "no-store" });
  const j = await r.json();
  const items = (j.items || []).slice().reverse(); // oldest -> newest for rendering
  try { localStorage.setItem(`history:${THREAD}`, JSON.stringify(items)); } catch {}
  return items;
}

export async function saveMessage(role: "user"|"assistant"|"system", content: string) {
  await fetch("/api/messages", {
    method: "POST",
    headers: {"content-type":"application/json"},
    body: JSON.stringify({ thread: THREAD, agent: THREAD, role, content }),
  });
}
