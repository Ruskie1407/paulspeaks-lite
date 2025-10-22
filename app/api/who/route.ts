export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const provider = (process.env.CHAT_PROVIDER || "xai").toLowerCase();
  const xai = (process.env.XAI_API_KEY || "");
  const oai = (process.env.OPENAI_API_KEY || "");
  const model = provider === "openai"
    ? (process.env.OPENAI_MODEL || "gpt-4o-mini")
    : (process.env.XAI_MODEL || "grok-2");

  return Response.json({
    ok: true,
    provider,
    model,
    hasXAI: !!xai,
    xaiLen: xai.length,
    hasOAI: !!oai,
    oaiLen: oai.length
  });
}
