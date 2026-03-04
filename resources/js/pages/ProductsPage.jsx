import { useState } from "react";
import { T, MOCK, fmt, MONO } from "../shared";
import { Card, PageHeader } from "../components";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const cats = ["All", ...new Set(MOCK.products.map(p => p.cat))];
  const filtered = MOCK.products.filter(p =>
    (filter === "All" || p.cat === filter) &&
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up">
      <PageHeader
        title="Products & Pricing"
        subtitle="Browse the full catalogue available to sell to your customers."
      />

      {/* Search + Category Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          style={{
            flex: 1, padding: "9px 14px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
            fontSize: 13, color: T.text, background: T.surface, fontFamily: "inherit", outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = T.primary}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding: "7px 14px", borderRadius: T.radiusSm, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none", transition: "all 0.15s", fontFamily: "inherit",
              background: filter === c ? T.primary : T.surface,
              color: filter === c ? "#fff" : T.textSub,
              boxShadow: filter === c ? "none" : T.shadow,
              outline: `1px solid ${filter === c ? T.primary : T.border}`,
            }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {filtered.map(p => (
          <Card key={p.id}
            style={{ padding: 20, transition: "box-shadow 0.2s, transform 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = "translateY(0)"; }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {p.cat}
                </span>
                <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 3, lineHeight: 1.3 }}>{p.title}</p>
              </div>
              {p.sub && (
                <span style={{ fontSize: 10, background: T.violetBg, color: T.violet, border: `1px solid ${T.violetBd}`, padding: "2px 8px", borderRadius: 99, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8 }}>
                  Sub
                </span>
              )}
            </div>

            <p style={{ fontSize: 12, color: T.textSub, marginBottom: 12, lineHeight: 1.6 }}>{p.desc}</p>

            {/* Star Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 14 }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width={12} height={12} viewBox="0 0 24 24"
                  fill={i < Math.round(p.rating) ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth={1.5}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
              <span style={{ fontSize: 11, color: T.textMute, marginLeft: 2 }}>{p.rating} ({p.rc})</span>
            </div>

            {/* Pricing */}
            {p.sub && p.tiers ? (
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(p.tiers).map(([tier, info]) => (
                  <div key={tier} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surfaceAlt, borderRadius: T.radiusSm, padding: "6px 12px" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{tier}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.primary, ...MONO }}>
                      {info.price === 0 ? "Free" : fmt(info.price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: T.textMute }}>One-time</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: T.primary, ...MONO }}>{fmt(p.price)}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}