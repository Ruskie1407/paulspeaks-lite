import { getSupaAnon } from "@/lib/supabaseAdmin";
type Props = { params: { agent: string } };
export const dynamic = "force-dynamic";

async function loadHistory(agent: string) {
  const supa = getSupaAnon();
  const { data } = await supa
    .from("messages")
    .select("role,content,created_at")
    .eq("thread_id", agent)
    .order("created_at", { ascending: true })
    .limit(200);
  return data || [];
}

export default async function Page({ params }: Props) {
  const agent = (params.agent || "agent").toLowerCase();
  const history = await loadHistory(agent);

  return (
    <div style={{maxWidth:960, margin:"40px auto", padding:"0 16px"}}>
      <h1 style={{color:"#fff"}}>PaulSpeaks — {agent}</h1>
      <div style={{margin:"14px 0", color:"#9aa4b2"}}>Model: {process.env.XAI_MODEL || process.env.OPENAI_MODEL || "configured"}</div>

      <div style={{background:"#0f1a2b", border:"1px solid #24324a", borderRadius:12, padding:14}}>
        <div style={{marginBottom:12, color:"#cbd5e1"}}>History (from Supabase):</div>
        <div style={{display:"grid", gap:10}}>
          {history.length === 0 && <div style={{color:"#64748b"}}>(no messages yet)</div>}
          {history.map((m:any, i:number)=>(
            <div key={i} style={{
              background: m.role === "assistant" ? "#0b1220" : "#0e2438",
              border:"1px solid #233047",
              borderRadius:8, padding:"10px 12px",
              color:"#e2e8f0"
            }}>
              <div style={{fontSize:12, color:"#94a3b8", marginBottom:4}}>{m.role.toUpperCase()}</div>
              <div style={{whiteSpace:"pre-wrap"}}>{(m.content || "").trim() || "[no text]"}</div>
            </div>
          ))}
        </div>

        <form method="post" action="/api/agent" style={{marginTop:16}}>
          <input type="hidden" name="thread" value={agent} />
          <input
            name="message"
            placeholder={`Type to chat with ${agent}…`}
            style={{width:"100%", padding:"12px 14px", background:"#091221", color:"#e5e7eb",
                    border:"1px solid #24324a", borderRadius:8}}
          />
        </form>
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            const form = document.querySelector('form[action="/api/agent"]');
            const input = form.querySelector('input[name="message"]');
            form.addEventListener('submit', async (e)=>{
              e.preventDefault();
              const thread = form.querySelector('input[name="thread"]').value;
              const message = input.value.trim();
              if(!message) return;
              input.value = "";
              await fetch('/api/agent', {
                method:'POST',
                headers:{'content-type':'application/json'},
                body: JSON.stringify({ thread, message })
              });
              location.reload();
            });
          })();`
        }} />
      </div>

      <div style={{marginTop:24, display:"grid", gap:8, gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))"}}>
        {["agent","marketing","accountancy","lead-generation","business-generation","website-builder","payroll","tax","ideas","engineering"].map(x=>(
          <a key={x} href={`/${x}/dashboard`}
             style={{display:"block", textDecoration:"none", color:"#eae8dc",
                     background:"#0b1220", border:"1px solid #343c4d", borderRadius:10, padding:"10px 12px"}}>
            PaulSpeaks {x.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} Agent
          </a>
        ))}
      </div>
    </div>
  );
}
