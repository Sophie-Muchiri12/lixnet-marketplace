import { useState, useRef, useEffect } from "react";
import { T, MOCK } from "../shared";
import { Box, PageTitle, Ico } from "../components";

export default function MessagesPage() {
  const [msgs, setMsgs]     = useState(MOCK.messages);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  const REPLIES = [
    "Thanks! We'll follow up shortly (Mon–Fri, 8am–5pm EAT).",
    "Got it, let me check that for you.",
    "Noted — our team will respond within 24 hours.",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = () => {
    if (!input.trim()) return;
    setMsgs(p => [...p, {
      id: Date.now(), init: "S", text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), admin: false,
    }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(p => [...p, {
        id: Date.now() + 1, init: "A",
        text: REPLIES[Math.floor(Math.random() * REPLIES.length)],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), admin: true,
      }]);
    }, 1400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <PageTitle title="Messages" subtitle="Chat directly with your approver or support team." />

      <Box style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        {/* Chat header */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.primaryBg, border: `2px solid ${T.primaryBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: T.primary }}>A</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Lixnet Support</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 11, color: T.textSub }}>Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {msgs.map(m => (
            <div key={m.id} style={{ display: "flex", gap: 10, flexDirection: m.admin ? "row" : "row-reverse" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                background: m.admin ? T.primaryBg : T.violetBg,
                border: `1px solid ${m.admin ? T.primaryBd : T.violetBd}`,
                color: m.admin ? T.primary : T.violet,
              }}>{m.init}</div>
              <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: m.admin ? "flex-start" : "flex-end" }}>
                <div style={{
                  padding: "9px 14px", fontSize: 13, lineHeight: 1.6, color: T.text,
                  borderRadius: m.admin ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                  background: m.admin ? T.surfaceAlt : T.primaryBg,
                  border: `1px solid ${m.admin ? T.border : T.primaryBd}`,
                }}>{m.text}</div>
                <span style={{ fontSize: 10, color: T.textMute, marginTop: 4 }}>{m.time}</span>
              </div>
            </div>
          ))}

          {typing && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.primaryBg, border: `1px solid ${T.primaryBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.primary }}>A</div>
              <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "4px 12px 12px 12px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.textMute, animation: `pulse 1.2s ${d}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message…"
            style={{ flex: 1, padding: "9px 14px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, color: T.text, background: T.surface, outline: "none" }}
            onFocus={e => e.target.style.borderColor = T.primary}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <button onClick={send} style={{
            width: 40, height: 40, borderRadius: T.radiusSm, border: "none", flexShrink: 0,
            background: input.trim() ? T.primary : T.surfaceAlt,
            cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s",
          }}>
            <Ico d="M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z" size={15} color={input.trim() ? "#fff" : T.textMute} sw={2} />
          </button>
        </div>
      </Box>
    </div>
  );
}