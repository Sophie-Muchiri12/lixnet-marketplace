import { useState } from "react";

// ── Page component imports ────────────────────────────────────────────────────
import DashboardPage     from "./pages/DashboardPage";
import ProductsPage      from "./pages/ProductsPage";
import ProfilePage       from "./pages/ProfilePage";
import CommissionsPage   from "./pages/CommissionsPage";
import MessagesPage      from "./pages/MessagesPage";
import BillingPage       from "./pages/BillingPage";
import CertificationsPage from "./pages/CertificationsPage";

// ── Shared data / constants ───────────────────────────────────────────────────
import { MOCK, NAV, TIER_META } from "./shared";

// ── Map nav IDs → imported page components ────────────────────────────────────
const PAGES = {
  dashboard:   DashboardPage,
  products:    ProductsPage,
  profile:     ProfilePage,
  commissions: CommissionsPage,
  messages:    MessagesPage,
  billing:     BillingPage,
  certs:       CertificationsPage,
};

// ── Tiny icon helper (used only in the shell) ─────────────────────────────────
function Ico({ d, size = 16, color = "currentColor", sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

// ── Design tokens (shell-level only) ─────────────────────────────────────────
const C = {
  bg: "#f4f5f7", surface: "#fff", alt: "#f9fafb", border: "#e5e7eb",
  text: "#111827", sub: "#6b7280", muted: "#9ca3af",
  green: "#059669", greenBg: "#ecfdf5", greenBd: "#6ee7b7",
  red: "#dc2626", redBg: "#fef2f2",
  r: "10px", rsm: "7px",
};

// ─────────────────────────────────────────────────────────────────────────────
// AgentPortal — the main shell
// Imports each page component above and renders the active one via <Page />
// ─────────────────────────────────────────────────────────────────────────────
export default function AgentPortal() {
  const [active, setActive]       = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const Page       = PAGES[active];                                    // ← swap page component
  const currentNav = NAV.find(n => n.id === active);
  const t          = TIER_META[MOCK.agent.tier.name] || TIER_META.bronze;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f4f5f7; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        input, button { font-family: inherit; }
        table { border-collapse: collapse; width: 100%; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 62 : 234, flexShrink: 0, transition: "width 0.25s ease",
        background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflow: "hidden",
      }}>

        {/* Logo */}
        <div style={{ padding: collapsed ? "16px 14px" : "16px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.green, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.text, lineHeight: 1 }}>Lixnet</p>
              <p style={{ fontSize: 9, color: C.green, fontWeight: 700, letterSpacing: "0.1em" }}>AGENT PORTAL</p>
            </div>
          )}
        </div>

        {/* Nav — each button sets active, which swaps the <Page /> below */}
        <nav style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {NAV.map(item => {
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => setActive(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 15px" : "9px 12px",
                borderRadius: C.rsm, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                background: isActive ? C.greenBg : "transparent",
                color: isActive ? C.green : C.sub,
                transition: "all 0.15s", position: "relative",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.alt; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                {isActive && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: C.green, borderRadius: "0 3px 3px 0" }} />}
                <Ico d={item.icon} size={16} color={isActive ? C.green : C.muted} sw={isActive ? 2.2 : 1.8} />
                {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span style={{ background: C.green, color: "#fff", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <div style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: C.green, border: `2px solid ${C.surface}` }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Agent chip */}
        {!collapsed && (
          <div style={{ margin: "0 8px 8px", padding: 12, background: t.bg, border: `1px solid ${t.bd}`, borderRadius: C.r }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: t.fill, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                {MOCK.agent.user.name.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {MOCK.agent.user.name.split(" ")[0]}
                </p>
                <p style={{ fontSize: 10, fontWeight: 700, color: t.color }}>{t.icon} {t.label}</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse + Sign out */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: 8 }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: C.rsm, border: "none", background: "transparent", cursor: "pointer", color: C.muted, fontSize: 12, justifyContent: collapsed ? "center" : "flex-start" }}
            onMouseEnter={e => e.currentTarget.style.background = C.alt}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Ico d={collapsed ? "M13 19l7-7-7-7M20 12H4" : "M11 19l-7-7 7-7M4 12h16"} size={15} color={C.muted} sw={2} />
            {!collapsed && <span>Collapse</span>}
          </button>
          <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: C.rsm, border: "none", background: "transparent", cursor: "pointer", color: C.muted, fontSize: 12, justifyContent: collapsed ? "center" : "flex-start" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.color = C.red; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}>
            <Ico d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={15} color="inherit" sw={2} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, height: 54, padding: "0 26px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ color: C.muted }}>Agent Portal</span>
            <span style={{ color: C.border }}>›</span>
            <span style={{ color: C.text, fontWeight: 700 }}>{currentNav?.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 12, color: C.sub }}>Active</span>
            </div>
            <div style={{ width: 1, height: 16, background: C.border }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: "monospace" }}>{MOCK.agent.code}</span>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: t.fill, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
              {MOCK.agent.user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Render the active imported page component here */}
        <main style={{ flex: 1, padding: 26, overflowY: "auto" }}>
          <Page key={active} />
        </main>
      </div>
    </div>
  );
}