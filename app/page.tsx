"use client";
import React, { useEffect, useRef, useState } from "react";

type Msg = { id?: number; role: "user"|"assistant"|"system"; content: string; created_at?: string };

const THREAD = "paulspeaks";

export default function Page() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    (async () => {
      try {
        const r = await fetch(`/api/messages?thread=${THREAD}&limit=200`, { cache: "no-store" });
        const j = await r.json();
        const items: Msg[] = (j.items || []).slice().reverse(); // oldest -> newest
        setMsgs(items);
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 50);
      } catch {}
    })();
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);

    // Optimistic user bubble
    setMsgs(prev => [...prev, { role:"user", content }]);
    setText("");
    inputRef.current?.focus();
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior:"smooth" }), 10);

    // Save user message
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({ thread: THREAD, role:"user", content })
      });
    } catch {}

    // Ask the agent → saves assistant reply server-side
    try {
      const r = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({ thread: THREAD, message: content })
      });
      const j = await r.json();
      const reply = j?.reply || "";
      if (reply) {
        setMsgs(prev => [...prev, { role:"assistant", content: reply }]);
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior:"smooth" }), 10);
      } else {
        setMsgs(prev => [...prev, { role:"system", content: "[empty agent reply]" }]);
      }
    } catch (e: any) {
      setMsgs(prev => [...prev, { role:"system", content: `Agent error: ${e?.message || "failed"}` }]);
    } finally {
      setBusy(false);
    }
  }

  const gold   = "#D4AF37";
  const panel  = "#0f172a";
  const border = "#334155";

  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr 260px", minHeight:"100vh", background:"#0b1220", color:"#fff"}}>
      <main style={{padding:"20px 20px 88px 20px"}}>
        <header style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
          <h1 style={{margin:0, fontSize:28}}>
            <span style={{color:gold, fontWeight:700}}>P</span>aul
            <span style={{color:gold, fontWeight:700}}>S</span>peaks <span style={{opacity:.8}}>Agent</span>
          </h1>
          <div style={{opacity:.8, fontSize:13}}>
            Status: <span style={{color: busy ? gold : "#22c55e"}}>{busy ? "Thinking…" : "Online"}</span>
          </div>
        </header>

        <div style={{background:panel, border:`1px solid ${border}`, borderRadius:12, padding:12, height:"calc(100vh - 180px)", display:"flex", flexDirection:"column"}}>
          <div ref={listRef} style={{overflowY:"auto", paddingRight:6, flex:1}}>
            {msgs.length === 0 && (
              <div style={{opacity:.75, fontSize:14, padding:8}}>No messages yet — say hi 👋</div>
            )}
            {msgs.map((m, i) => (
              <div key={i} style={{margin:"8px 0", display:"flex"}}>
                <div style={{
                  background: m.role === "user" ? "#1f2937" : "#0b1326",
                  border:`1px solid ${border}`,
                  padding:"10px 12px",
                  borderRadius:10,
                  maxWidth:"80%"
                }}>
                  <div style={{opacity:.7, fontSize:12, marginBottom:4}}>
                    {m.role === "user" ? "You" : m.role === "assistant" ? "PaulSpeaks" : "System"}
                  </div>
                  <div style={{whiteSpace:"pre-wrap", lineHeight:1.45}}>{m.content}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} style={{display:"flex", gap:8, paddingTop:10}}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message…"
              style={{
                flex:1, fontSize:14, padding:"12px 14px",
                borderRadius:10, outline:"none", color:"#fff",
                background:"#0b1326", border:`1px solid ${border}`
              }}
            />
            <button
              type="submit"
              disabled={busy}
              style={{
                padding:"12px 16px", borderRadius:10, border:`1px solid ${border}`,
                background: busy ? "#b59b36" : gold, color:"#0b1220", fontWeight:700, opacity: busy ? 0.85 : 1
              }}
            >
              {busy ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </main>

      <aside style={{borderLeft:`1px solid ${border}`, padding:"20px 16px"}}>
        <div style={{fontSize:18, marginBottom:10}}>Quick Links</div>
        <nav style={{display:"grid", gap:8}}>
          {[
            ["Marketing Agent","/agent/marketing/dashboard"],
            ["Accountancy Agent","/agent/accountancy/dashboard"],
            ["Lead Generation Agent","/agent/leadgen/dashboard"],
            ["Business Generation Agent","/agent/bizgen/dashboard"],
            ["Website Builder Agent","/agent/webbuilder/dashboard"],
            ["Payroll Agent","/agent/payroll/dashboard"],
            ["Tax Agent","/agent/tax/dashboard"],
            ["Business Ideas Agent","/agent/ideas/dashboard"],
            ["Engineering & Bug Fixes Agent","/agent/engineering/dashboard"]
          ].map(([label, href]) => (
            <a key={href} href={href} style={{
              display:"block", padding:"10px 12px",
              border:`1px solid ${border}`, borderRadius:10, background:"#0b1326"
            }}>{label}</a>
          ))}
        </nav>
        <div style={{marginTop:20, opacity:.75, fontSize:12}}>
          Shared history: <code>{THREAD}</code>
        </div>
      </aside>
    </div>
  );
}
