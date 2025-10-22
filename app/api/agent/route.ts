export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getSupaAdmin } from "@/lib/supabaseAdmin";

async function callProvider(message: string): Promise<string> {
  const prov = (process.env.CHAT_PROVIDER || "openai").toLowerCase();

  if (prov === "xai") {
    const key = process.env.XAI_API_KEY;
    const base = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
    const model = process.env.XAI_MODEL || "grok-2";
    if (!key) throw new Error("XAI missing key");

    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "content-type":"application/json", "authorization":`Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: message }],
        max_tokens: 120
      }),
    });
    if (!r.ok) throw new Error(`XAI error ${r.status}`);
    const j = await r.json();
    return (j?.choices?.[0]?.message?.content || "").trim();
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI missing key");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type":"application/json", "authorization":`Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
      max_tokens: 120
    }),
  });
  if (!r.ok) throw new Error(`OpenAI error ${r.status}`);
  const j = await r.json();
  return (j?.choices?.[0]?.message?.content || "").trim();
}

export async function GET() {
  return Response.json({
    ok: true,
    provider: (process.env.CHAT_PROVIDER || "openai"),
    model: process.env.XAI_MODEL || process.env.OPENAI_MODEL || "default"
  });
}

export async function POST(req: NextRequest) {
  try {
    const { thread, message } = await req.json();
    if (!thread || !message) return Response.json({ ok:false, error:"thread and message required" }, { status: 400 });

    const admin = getSupaAdmin();
    await admin.from("messages").insert({ thread_id: thread, role: "user", content: message });

    let reply = "";
    try {
      reply = await callProvider(message);
    } catch (e:any) {
      console.error("[agent] model call failed:", e?.message || e);
      return Response.json({ ok:false, error: String(e?.message || e) }, { status: 500 });
    }

    const safe = reply.trim() || "Hello! (fallback)";
    await admin.from("messages").insert({ thread_id: thread, role: "assistant", content: safe });

    return Response.json({ ok:true, reply: safe });
  } catch (e:any) {
    return Response.json({ ok:false, error: String(e?.message || e) }, { status: 500 });
  }
}
