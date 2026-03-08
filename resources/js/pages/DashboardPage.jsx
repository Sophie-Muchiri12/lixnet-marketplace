import { useState, useEffect } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  primary: "#059669", primaryBg: "#ecfdf5", primaryBd: "#6ee7b7",
  violet: "#7c3aed", violetBg: "#f5f3ff", violetBd: "#c4b5fd",
  amber: "#d97706",  amberBg: "#fffbeb",  amberBd: "#fcd34d",
  blue: "#2563eb",   blueBg: "#eff6ff",   blueBd: "#93c5fd",
  red: "#dc2626",    redBg: "#fef2f2",
  text: "#111827", textSub: "#6b7280", textMute: "#9ca3af",
  surface: "#fff", surfaceAlt: "#f9fafb",
  border: "#e5e7eb", radius: "10px", radiusSm: "7px",
  shadow: "0 1px 3px rgba(0,0,0,0.07)", shadowMd: "0 4px 12px rgba(0,0,0,0.10)",
};
const MONO = { fontFamily: "'JetBrains Mono','Fira Mono',monospace" };
const fmt = v => "KSh " + Number(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Ico({ d, size = 16, color = "currentColor", sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

function Card({ children, style = {}, ...rest }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, ...style }} {...rest}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, acBg, acColor, iconPath, loading }) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.textMute }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: acBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ico d={iconPath} size={14} color={acColor} sw={2} />
        </div>
      </div>
      {loading ? (
        <div style={{ height: 28, background: T.surfaceAlt, borderRadius: 6, animation: "pulse 1.5s infinite" }} />
      ) : (
        <p style={{ fontSize: 22, fontWeight: 800, color: T.text, ...MONO, marginBottom: 4 }}>{value}</p>
      )}
      <p style={{ fontSize: 11, color: T.textMute }}>{sub}</p>
    </Card>
  );
}

function Badge({ status }) {
  const map = {
    completed: { bg: "#ecfdf5", color: "#059669", bd: "#6ee7b7", label: "Completed" },
    pending:   { bg: "#fffbeb", color: "#d97706", bd: "#fcd34d", label: "Pending" },
    cancelled: { bg: "#fef2f2", color: "#dc2626", bd: "#fca5a5", label: "Cancelled" },
    paid:      { bg: "#ecfdf5", color: "#059669", bd: "#6ee7b7", label: "Paid" },
    active:    { bg: "#ecfdf5", color: "#059669", bd: "#6ee7b7", label: "Active" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.bd}` }}>
      {s.label}
    </span>
  );
}

function TierProgress({ tierInfo }) {
  if (!tierInfo) return null;
  const { name, current_sales, sales_to_next_tier, commission_rate } = tierInfo;
  const maxMap = { bronze: 25000, silver: 50000, gold: 50000 };
  const minMap = { bronze: 0, silver: 25000, gold: 50000 };
  const max = maxMap[name] || 25000;
  const min = minMap[name] || 0;
  const pct = name === "gold" ? 100 : Math.min(100, ((current_sales - min) / (max - min)) * 100);
  const tierColors = { bronze: "#b45309", silver: "#6b7280", gold: "#d97706" };
  const color = tierColors[name] || T.primary;

  return (
    <Card style={{ padding: 18 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Tier Progress</p>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{name.charAt(0).toUpperCase() + name.slice(1)} Tier</span>
        <span style={{ fontSize: 12, color: T.textSub, ...MONO }}>{commission_rate}% rate</span>
      </div>
      <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
      </div>
      {name !== "gold" ? (
        <p style={{ fontSize: 11, color: T.textMute }}>{fmt(sales_to_next_tier)} to next tier</p>
      ) : (
        <p style={{ fontSize: 11, color: T.primary, fontWeight: 700 }}>🏆 Maximum tier reached</p>
      )}
    </Card>
  );
}

function BarChart({ data = [] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.sales), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
      {data.map(d => (
        <div key={d.quarter} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: T.textMute, ...MONO }}>{d.sales > 0 ? fmt(d.sales).replace("KSh ", "") : "—"}</span>
          <div style={{ width: "100%", background: T.surfaceAlt, borderRadius: "4px 4px 0 0", position: "relative", height: 80 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderRadius: "4px 4px 0 0", background: T.primary, height: `${(d.sales / max) * 100}%`, transition: "height 0.8s ease" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.textSub }}>{d.quarter}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch("/api/agent/dashboard", {
      headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin",
    })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div style={{ padding: 32, textAlign: "center", color: T.red }}>
      <p style={{ fontWeight: 700 }}>Failed to load dashboard</p>
      <p style={{ fontSize: 13, marginTop: 4 }}>{error}</p>
    </div>
  );

  const stats         = data?.stats         || {};
  const tierInfo      = data?.tier_info      || null;
  const quarterlyData = data?.quarterly_data || [];
  const recentSales   = data?.recent_sales   || [];
  const agentName     = data?.agent_name     || "Agent";
  const agentCode     = data?.agent_code     || "—";

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>
          {loading ? "Loading…" : `Good morning, ${agentName.split(" ")[0]} 👋`}
        </h1>
        <p style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>Here's a snapshot of your sales performance.</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <StatCard loading={loading} label="Total Sales"     value={fmt(stats.total_sales || 0)}      sub="All time"       acBg={T.primaryBg} acColor={T.primary} iconPath="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" />
        <StatCard loading={loading} label="Total Earnings"  value={fmt(stats.total_earnings || 0)}   sub="This year"      acBg={T.violetBg}  acColor={T.violet} iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        <StatCard loading={loading} label="Customers"       value={stats.customers_count ?? "—"}      sub="Unique clients" acBg={T.blueBg}    acColor={T.blue}   iconPath="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />
        <StatCard loading={loading} label="Commission Rate" value={`${stats.commission_rate ?? "—"}%`} sub={`${stats.current_tier || "—"} tier`} acBg={T.amberBg} acColor={T.amber} iconPath="M12 15a7 7 0 100-14 7 7 0 000 14z" />
      </div>

      {/* Chart + Tier sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 16 }}>
        <Card style={{ padding: 22 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 18 }}>
            Quarterly Sales — {new Date().getFullYear()}
          </p>
          {loading
            ? <div style={{ height: 120, background: T.surfaceAlt, borderRadius: 6, animation: "pulse 1.5s infinite" }} />
            : <BarChart data={quarterlyData} />}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading
            ? <Card style={{ padding: 18, height: 120, animation: "pulse 1.5s infinite" }} />
            : <TierProgress tierInfo={tierInfo} />}
          <Card style={{ padding: 18 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Agent Code</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.primary, ...MONO }}>{agentCode}</p>
            <p style={{ fontSize: 11, color: T.textMute, marginTop: 4 }}>Share with customers on sign-up</p>
          </Card>
        </div>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Recent Sales</p>
          <span style={{ fontSize: 11, color: T.textMute }}>{recentSales.length} transactions this month</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ height: 16, background: T.surfaceAlt, borderRadius: 4, animation: "pulse 1.5s infinite", marginBottom: 10 }} />
            <div style={{ height: 16, background: T.surfaceAlt, borderRadius: 4, animation: "pulse 1.5s infinite", width: "70%" }} />
          </div>
        ) : recentSales.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: T.textMute, fontSize: 13 }}>No sales this month yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surfaceAlt }}>
                {["Reference", "Customer", "Amount", "Status", "Date"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s, i) => (
                <tr key={s.id}
                  style={{ borderBottom: i < recentSales.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", ...MONO, fontSize: 11, color: T.textSub }}>{s.order_reference}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: T.text }}>{s.full_name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: T.primary, ...MONO }}>{fmt(s.total_amount)}</td>
                  <td style={{ padding: "12px 16px" }}><Badge status={s.status} /></td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSub }}>{s.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}