import { useState, useEffect } from "react";

const T = {
  primary: "#059669", primaryBg: "#ecfdf5", primaryBd: "#6ee7b7",
  violet: "#7c3aed", violetBg: "#f5f3ff", violetBd: "#c4b5fd",
  amber: "#d97706",  amberBg: "#fffbeb",  amberBd: "#fcd34d",
  blue: "#2563eb",   blueBg: "#eff6ff",   blueBd: "#93c5fd",
  text: "#111827", textSub: "#6b7280", textMute: "#9ca3af",
  surface: "#fff", surfaceAlt: "#f9fafb", border: "#e5e7eb",
  radius: "10px", radiusSm: "7px", shadow: "0 1px 3px rgba(0,0,0,0.07)",
};
const MONO = { fontFamily: "'JetBrains Mono','Fira Mono',monospace" };
const fmt = v => "KSh " + Number(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });

const TIER_META = {
  bronze: { label: "Bronze", icon: "🥉", color: "#b45309", bg: "#fef3c7", bd: "#fcd34d", fill: "#b45309" },
  silver: { label: "Silver", icon: "🥈", color: "#6b7280", bg: "#f9fafb", bd: "#d1d5db", fill: "#6b7280" },
  gold:   { label: "Gold",   icon: "🥇", color: "#d97706", bg: "#fffbeb", bd: "#fcd34d", fill: "#d97706" },
};

function Card({ children, style = {} }) {
  return <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, ...style }}>{children}</div>;
}

function StatCard({ label, value, sub, acBg, acColor, iconPath, loading }) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.textMute }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: acBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={acColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={iconPath} /></svg>
        </div>
      </div>
      {loading
        ? <div style={{ height: 28, background: T.surfaceAlt, borderRadius: 6, animation: "pulse 1.5s infinite" }} />
        : <p style={{ fontSize: 22, fontWeight: 800, color: T.text, ...MONO, marginBottom: 4 }}>{value}</p>}
      <p style={{ fontSize: 11, color: T.textMute }}>{sub}</p>
    </Card>
  );
}

function Badge({ status, label }) {
  const map = {
    paid:      { bg: "#ecfdf5", color: "#059669", bd: "#6ee7b7" },
    pending:   { bg: "#fffbeb", color: "#d97706", bd: "#fcd34d" },
    cancelled: { bg: "#fef2f2", color: "#dc2626", bd: "#fca5a5" },
    active:    { bg: "#ecfdf5", color: "#059669", bd: "#6ee7b7" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.bd}` }}>
      {label || status}
    </span>
  );
}

function TierProgress({ tierInfo }) {
  if (!tierInfo) return null;
  const { name, current_sales, sales_to_next_tier, commission_rate } = tierInfo;
  const maxMap = { bronze: 25000, silver: 50000 };
  const minMap = { bronze: 0, silver: 25000, gold: 50000 };
  const max = maxMap[name] || 50000;
  const min = minMap[name] || 0;
  const pct = name === "gold" ? 100 : Math.min(100, ((current_sales - min) / (max - min)) * 100);
  const tm = TIER_META[name] || TIER_META.bronze;

  return (
    <Card style={{ padding: 20, marginBottom: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Your Tier Progress</p>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: tm.color }}>{tm.icon} {tm.label}</span>
        <span style={{ fontSize: 12, color: T.textSub, ...MONO }}>{commission_rate}% commission rate</span>
      </div>
      <div style={{ height: 10, background: T.surfaceAlt, borderRadius: 5, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: tm.fill, borderRadius: 5, transition: "width 1s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: T.textMute }}>Current: {fmt(current_sales)}</span>
        {name !== "gold"
          ? <span style={{ fontSize: 11, color: T.textMute }}>{fmt(sales_to_next_tier)} to next tier</span>
          : <span style={{ fontSize: 11, color: T.primary, fontWeight: 700 }}>🏆 Max tier!</span>}
      </div>
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
          <span style={{ fontSize: 10, color: T.textMute, ...MONO }}>{d.sales > 0 ? Number(d.sales).toLocaleString("en-KE") : "—"}</span>
          <div style={{ width: "100%", background: T.surfaceAlt, borderRadius: "4px 4px 0 0", position: "relative", height: 80 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderRadius: "4px 4px 0 0", background: T.primary, height: `${(d.sales / max) * 100}%`, transition: "height 0.8s ease" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.textSub }}>{d.quarter}</span>
        </div>
      ))}
    </div>
  );
}

export default function CommissionsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch("/api/agent/commissions", {
      headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin",
    })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div style={{ padding: 32, textAlign: "center", color: "#dc2626" }}>
      <p style={{ fontWeight: 700 }}>Failed to load commissions</p>
      <p style={{ fontSize: 13, marginTop: 4 }}>{error}</p>
    </div>
  );

  const commissions   = data?.commissions   || [];
  const summary       = data?.summary       || {};
  const tierInfo      = data?.tier_info      || null;
  const quarterlyData = data?.quarterly_data || [];

  const earned  = summary.total_earned  || 0;
  const pending = summary.total_pending || 0;

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>Commissions & Sales</h1>
        <p style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>Track your earnings, tier progression, and quarterly performance.</p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <StatCard loading={loading} label="Total Earned"   value={fmt(earned)}   sub="All paid commissions"  acBg={T.primaryBg} acColor={T.primary} iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        <StatCard loading={loading} label="Pending"        value={fmt(pending)}  sub="Awaiting payment"      acBg={T.amberBg}   acColor={T.amber}  iconPath="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" />
        <StatCard loading={loading} label="Current Rate"   value={`${tierInfo?.commission_rate ?? "—"}%`} sub={`${tierInfo?.name || "—"} tier`} acBg={T.violetBg} acColor={T.violet} iconPath="M12 15a7 7 0 100-14 7 7 0 000 14z" />
        <StatCard loading={loading} label="Total Sales"    value={fmt(tierInfo?.current_sales || 0)} sub="Revenue generated" acBg={T.blueBg} acColor={T.blue} iconPath="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" />
      </div>

      {/* Tier Ladder */}
      <Card style={{ padding: 22, marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Commission Tier Ladder</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { n: "bronze", rate: "10%", range: "KSh 0 – 25,000" },
            { n: "silver", rate: "20%", range: "KSh 25,000 – 50,000" },
            { n: "gold",   rate: "30%", range: "KSh 50,000+" },
          ].map(tier => {
            const tm = TIER_META[tier.n];
            const isCurrent = tierInfo?.name === tier.n;
            return (
              <div key={tier.n} style={{ background: isCurrent ? T.primaryBg : tm.bg, border: `2px solid ${isCurrent ? T.primary : tm.bd}`, borderRadius: T.radius, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: tm.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{tm.icon} {tm.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: T.text, ...MONO, margin: "6px 0 2px" }}>{tier.rate}</p>
                <p style={{ fontSize: 11, color: T.textMute, marginBottom: 10 }}>{tier.range}</p>
                {isCurrent && <Badge status="active" label="Your Current Tier" />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Progress Bar */}
      {!loading && <TierProgress tierInfo={tierInfo} />}

      {/* Commission History Table */}
      <Card style={{ marginTop: 14 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Commission History</p>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ height: 16, background: T.surfaceAlt, borderRadius: 4, animation: "pulse 1.5s infinite", marginBottom: 10 }} />
            <div style={{ height: 16, background: T.surfaceAlt, borderRadius: 4, animation: "pulse 1.5s infinite", width: "70%" }} />
          </div>
        ) : commissions.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: T.textMute, fontSize: 13 }}>No commission records yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surfaceAlt }}>
                {["Period", "Total Sales", "Rate", "Commission", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map((c, i) => {
                const tm = TIER_META[c.tier] || TIER_META.bronze;
                return (
                  <tr key={c.id}
                    style={{ borderBottom: i < commissions.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: T.text }}>{c.period}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, ...MONO, color: T.textSub }}>{fmt(c.total_sales)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: tm.color }}>{tm.icon} {c.rate}%</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: T.primary, ...MONO }}>{fmt(c.total_commission)}</td>
                    <td style={{ padding: "12px 16px" }}><Badge status={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Quarterly Chart */}
      {!loading && quarterlyData.length > 0 && (
        <Card style={{ padding: 22, marginTop: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 18 }}>Sales by Quarter — {new Date().getFullYear()}</p>
          <BarChart data={quarterlyData} />
        </Card>
      )}
    </div>
  );
}