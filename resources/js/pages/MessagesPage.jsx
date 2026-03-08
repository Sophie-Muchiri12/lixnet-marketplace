import { useState, useRef, useEffect } from "react";

const T = {
  primary: "#059669", primaryBg: "#ecfdf5", primaryBd: "#6ee7b7",
  violet: "#7c3aed", violetBg: "#f5f3ff", violetBd: "#c4b5fd",
  text: "#111827", textSub: "#6b7280", textMute: "#9ca3af",
  surface: "#fff", surfaceAlt: "#f9fafb", border: "#e5e7eb",
  radius: "10px", radiusSm: "7px", shadow: "0 1px 3px rgba(0,0,0,0.07)",
};

function Ico({ d, size = 16, color = "currentColor", sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

export default function MessagesPage() {
  const [msgs, setMsgs]       = useState([]);
  const [input, setInput]     = useState("");
  const [typing, setTyping]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState(null);
  const bottomRef = useRef(null);

  const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

  // Load message history
  useEffect(() => {
    fetch("/api/agent/messages", {
      headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin",
    })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data => setMsgs(data.messages || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic UI
    const tempId = Date.now();
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMsgs(p => [...p, { id: tempId, body: text, from_agent: true, created_at: now, sender_initial: "A" }]);

    try {
      const res = await fetch("/api/agent/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": csrfToken() || "",
        },
        credentials: "same-origin",
        body: JSON.stringify({ body: text }),
      });

      const data = await res.json();

      // Replace temp message with confirmed one
      setMsgs(p => p.map(m => m.id === tempId ? (data.message || m) : m));

      // Show auto-reply if any
      if (data.auto_reply) {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setMsgs(p => [...p, data.auto_reply]);
        }, 1200);
      }
    } catch {
      // Remove temp message on failure
      setMsgs(p => p.filter(m => m.id !== tempId));
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>Messages</h1>
        <p style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>Chat directly with your approver or support team.</p>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: T.radiusSm, marginBottom: 12, color: "#dc2626", fontSize: 12, fontWeight: 600 }}>
          ⚠ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 800 }}>✕</button>
        </div>
      )}

      <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

        {/* Chat header */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.primaryBg, border: `2px solid ${T.primaryBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: T.primary }}>L</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Lixnet Support</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 11, color: T.textSub }}>Online · Replies within 24hrs (Mon–Fri)</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

          {loading && (
            <div style={{ textAlign: "center", padding: 32, color: T.textMute, fontSize: 13 }}>
              <div style={{ animation: "pulse 1.5s infinite" }}>Loading messages…</div>
            </div>
          )}

          {!loading && msgs.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: T.textMute }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.textSub }}>No messages yet</p>
              <p style={{ fontSize: 13 }}>Send a message to get in touch with support.</p>
            </div>
          )}

          {msgs.map(m => {
            // Support both old MOCK format and new API format
            const isAgent   = m.from_agent !== undefined ? m.from_agent : !m.admin;
            const body      = m.body || m.text || "";
            const time      = m.created_at || m.time || "";
            const initial   = m.sender_initial || (isAgent ? "Y" : "L");
            const timeStr   = typeof time === "string" && time.includes("T")
              ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : time;

            return (
              <div key={m.id} style={{ display: "flex", gap: 10, flexDirection: isAgent ? "row-reverse" : "row" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                  background: isAgent ? T.violetBg : T.primaryBg,
                  border: `1px solid ${isAgent ? T.violetBd : T.primaryBd}`,
                  color: isAgent ? T.violet : T.primary,
                }}>{initial}</div>
                <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isAgent ? "flex-end" : "flex-start" }}>
                  <div style={{
                    padding: "9px 14px", fontSize: 13, lineHeight: 1.6, color: T.text,
                    borderRadius: isAgent ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    background: isAgent ? T.primaryBg : T.surfaceAlt,
                    border: `1px solid ${isAgent ? T.primaryBd : T.border}`,
                  }}>{body}</div>
                  <span style={{ fontSize: 10, color: T.textMute, marginTop: 4 }}>{timeStr}</span>
                </div>
              </div>
            );
          })}

          {typing && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.primaryBg, border: `1px solid ${T.primaryBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.primary }}>L</div>
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
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type a message…"
            disabled={sending}
            style={{
              flex: 1, padding: "9px 14px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
              fontSize: 13, color: T.text, background: T.surface, outline: "none", fontFamily: "inherit",
            }}
            onFocus={e => e.target.style.borderColor = T.primary}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <button onClick={send} disabled={!input.trim() || sending} style={{
            width: 40, height: 40, borderRadius: T.radiusSm, border: "none", flexShrink: 0,
            background: input.trim() && !sending ? T.primary : T.surfaceAlt,
            cursor: input.trim() && !sending ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s",
          }}>
            <Ico d="M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z" size={15} color={input.trim() && !sending ? "#fff" : T.textMute} sw={2} />
          </button>
        </div>
      </div>
    </div>
  );
}