import { useState, useEffect } from "react";

const T = {
  primary: "#059669", primaryBg: "#ecfdf5", primaryBd: "#6ee7b7",
  violet: "#7c3aed", violetBg: "#f5f3ff", violetBd: "#c4b5fd",
  text: "#111827", textSub: "#6b7280", textMute: "#9ca3af",
  surface: "#fff", surfaceAlt: "#f9fafb", border: "#e5e7eb",
  radius: "10px", radiusSm: "7px", shadow: "0 1px 3px rgba(0,0,0,0.07)", shadowMd: "0 4px 12px rgba(0,0,0,0.10)",
};
const MONO = { fontFamily: "'JetBrains Mono','Fira Mono',monospace" };
const fmt = v => "KSh " + Number(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });

function Card({ children, style = {}, ...rest }) {
  return <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, ...style }} {...rest}>{children}</div>;
}

function SkeletonCard() {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ height: 12, background: T.surfaceAlt, borderRadius: 4, width: "40%", marginBottom: 10, animation: "pulse 1.5s infinite" }} />
      <div style={{ height: 18, background: T.surfaceAlt, borderRadius: 4, marginBottom: 8, animation: "pulse 1.5s infinite" }} />
      <div style={{ height: 12, background: T.surfaceAlt, borderRadius: 4, width: "70%", marginBottom: 6, animation: "pulse 1.5s infinite" }} />
      <div style={{ height: 12, background: T.surfaceAlt, borderRadius: 4, width: "55%", animation: "pulse 1.5s infinite" }} />
    </Card>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [focused, setFocused]   = useState(false);

  useEffect(() => {
    fetch("/api/products?per_page=100", {
      headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin",
    })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data => {
        // Handle both paginated { data: [...] } and plain array responses
        const items = Array.isArray(data) ? data : (data.data || []);
        setProducts(items);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Extract unique categories
  const cats = ["All", ...new Set(products.map(p => p.category?.name || p.cat || "Other").filter(Boolean))];

  const filtered = products.filter(p => {
    const catName = p.category?.name || p.cat || "Other";
    const matchesCat = filter === "All" || catName === filter;
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.title?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>Products & Pricing</h1>
        <p style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>Browse the full catalogue available to sell to your customers.</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: T.radiusSm, marginBottom: 14, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          style={{
            flex: 1, padding: "9px 14px", border: `1px solid ${focused ? T.primary : T.border}`,
            borderRadius: T.radiusSm, fontSize: 13, color: T.text, background: T.surface, fontFamily: "inherit", outline: "none",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: T.textMute }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>No products found</p>
          <p style={{ fontSize: 13 }}>Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {filtered.map(p => {
            const title    = p.name || p.title || "Untitled";
            const desc     = p.description || p.desc || "";
            const catName  = p.category?.name || p.cat || "Other";
            const price    = p.price ?? p.base_price ?? 0;
            const isSub    = p.is_subscription || p.sub || false;
            const rating   = p.rating || 4.5;
            const rc       = p.review_count || p.rc || 0;

            return (
              <Card key={p.id}
                style={{ padding: 20, transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow;   e.currentTarget.style.transform = "translateY(0)"; }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.07em" }}>{catName}</span>
                    <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 3, lineHeight: 1.3 }}>{title}</p>
                  </div>
                  {isSub && (
                    <span style={{ fontSize: 10, background: T.violetBg, color: T.violet, border: `1px solid ${T.violetBd}`, padding: "2px 8px", borderRadius: 99, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8 }}>Sub</span>
                  )}
                </div>

                {desc && <p style={{ fontSize: 12, color: T.textSub, marginBottom: 12, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</p>}

                {/* Star Rating */}
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 14 }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width={12} height={12} viewBox="0 0 24 24"
                      fill={i < Math.round(rating) ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth={1.5}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span style={{ fontSize: 11, color: T.textMute, marginLeft: 2 }}>{rating} ({rc})</span>
                </div>

                {/* Pricing */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: T.textMute }}>{isSub ? "Subscription" : "One-time"}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: T.primary, ...MONO }}>
                    {price === 0 ? "Free" : fmt(price)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}