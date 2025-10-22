export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { getSupaAdmin } from "../../../lib/supabaseAdmin";

// GET /api/messages?thread=paulspeaks&limit=50&before=ISO
export async function GET(req: NextRequest) {
  try {
    const supa = getSupaAdmin();
    const url = new URL(req.url);
    const thread = url.searchParams.get("thread") || "paulspeaks";
    const limit = Number(url.searchParams.get("limit") || 50);
    const before = url.searchParams.get("before");

    let q = supa.from("messages")
      .select("id,role,content,created_at")
      .eq("thread_id", thread)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) q = q.lt("created_at", before);

    const { data, error } = await q;
    if (error) return new Response(error.message, { status: 500 });

    return Response.json({ ok: true, items: data }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return new Response(e?.message || "server error", { status: 500 });
  }
}

// POST /api/messages  {thread, role, content}
export async function POST(req: NextRequest) {
  try {
    const supa = getSupaAdmin();
    const body = await req.json();
    const thread = body.thread || "paulspeaks";
    const role   = body.role;
    const content= body.content;

    if (!role || !content) return new Response("missing role/content", { status: 400 });

    const { error } = await supa.from("messages")
      .insert({ thread_id: thread, role, content });

    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return new Response(e?.message || "server error", { status: 500 });
  }
}
