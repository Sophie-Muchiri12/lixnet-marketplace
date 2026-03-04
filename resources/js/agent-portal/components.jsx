import { T, TIER, STATUS_STYLE, fmt, pct, MONO } from "./shared";

export function Icon({ path, size = 18, color = "currentColor", sw = 1.75 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      {Array.isArray(path)
        ? path.map((d, i) => <path key={i} d={d} />)
        : <path d={path} />}
    </svg>
  );
}

export function Badge({ status, label }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.text, border: `1px solid ${s.bd}`,
      padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {label || status}
    </span>
  );
}

export function Card({ children, style = {}, onMouseEnter, onMouseLeave }) {
  return (
    <div
      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, ...style }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, acBg, acColor, iconPath }) {
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
        <div style={{ padding: 8, borderRadius: T.radiusSm, background: acBg }}>
          <Icon path={iconPath} size={15} color={acColor} sw={2} />
        </div>
      </div>
      <p style={{ fontSize: 23, fontWeight: 800, color: T.text, ...MONO, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: T.textSub, marginTop: 5 }}>{sub}</p>}
    </Card>
  );
}

export function TierProgress({ tier_info }) {
  const { name, current_sales, sales_to_next_tier } = tier_info;
  const t = TIER[name] || TIER.bronze;
  const max = name === "bronze" ? 25000 : name === "silver" ? 50000 : current_sales;
  const p = pct(current_sales, max);
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label} Tier</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub, ...MONO }}>{p}%</span>
      </div>
      <div style={{ height: 8, background: "#f0f1f5", borderRadius: 99, overflow: "hidden", border: `1px solid ${T.border}` }}>
        <div style={{ height: "100%", width: `${p}%`, background: t.bar, borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
      {sales_to_next_tier > 0 && (
        <p style={{ fontSize: 11, color: T.textMute, marginTop: 8 }}>{fmt(sales_to_next_tier)} more to unlock next tier</p>
      )}
    </Card>
  );
}

export function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.sales));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
      {data.map((d, i) => {
        const h = Math.max(6, pct(d.sales, max));
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
            <span style={{ fontSize: 10, color: T.textMute, ...MONO }}>{(d.sales / 1000).toFixed(0)}k</span>
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%", height: `${h}%`, minHeight: 6,
                background: `linear-gradient(to top, ${T.primary}, #34d399)`,
                borderRadius: "6px 6px 0 0", transition: "height 0.6s ease",
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textSub }}>{d.quarter}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: T.textSub, marginTop: 3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function TH({ cols }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
        {cols.map(c => (
          <th key={c} style={{
            padding: "10px 16px", textAlign: "left", fontSize: 10,
            fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.07em",
          }}>{c}</th>
        ))}
      </tr>
    </thead>
  );
}