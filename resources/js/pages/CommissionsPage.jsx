import { T, MOCK, TIER, fmt, MONO } from "../shared";
import { Card, StatCard, TierProgress, BarChart, PageHeader, TH, Badge } from "../components";

export default function CommissionsPage() {
  const earned  = MOCK.commissions.filter(c => c.status === "paid").reduce((a, c) => a + c.total_commission, 0);
  const pending = MOCK.commissions.filter(c => c.status === "pending").reduce((a, c) => a + c.total_commission, 0);

  return (
    <div className="fade-up">
      <PageHeader
        title="Commissions & Sales"
        subtitle="Track your earnings, tier progression, and quarterly performance."
      />

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <StatCard label="Total Earned"   value={fmt(earned)}   sub="All paid commissions"  acBg={T.primaryBg} acColor={T.primary} iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        <StatCard label="Pending"        value={fmt(pending)}  sub="Awaiting payment"      acBg={T.amberBg}   acColor={T.amber}  iconPath="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" />
        <StatCard label="Current Rate"   value={`${MOCK.agent.tier.commission_rate}%`} sub="Silver tier" acBg={T.violetBg} acColor={T.violet} iconPath="M12 15a7 7 0 100-14 7 7 0 000 14z" />
        <StatCard label="Total Sales"    value={fmt(MOCK.dashboard.stats.total_sales)} sub="Revenue generated" acBg={T.blueBg} acColor={T.blue} iconPath="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" />
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
            const t = TIER[tier.n];
            const isCurrent = MOCK.agent.tier.name === tier.n;
            return (
              <div key={tier.n} style={{ background: isCurrent ? T.primaryBg : t.bg, border: `2px solid ${isCurrent ? T.primary : t.bd}`, borderRadius: T.radius, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{t.icon} {t.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: T.text, ...MONO, margin: "6px 0 2px" }}>{tier.rate}</p>
                <p style={{ fontSize: 11, color: T.textMute, marginBottom: 10 }}>{tier.range}</p>
                {isCurrent && <Badge status="active" label="Your Current Tier" />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Progress Bar */}
      <TierProgress tier_info={MOCK.dashboard.tier_info} />

      {/* Commission History Table */}
      <Card style={{ marginTop: 14 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Commission History</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TH cols={["Period", "Total Sales", "Rate", "Commission", "Status"]} />
          <tbody>
            {MOCK.commissions.map((c, i) => {
              const t = TIER[c.tier];
              return (
                <tr key={c.id}
                  style={{ borderBottom: i < MOCK.commissions.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text }}>{c.period}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, ...MONO, color: T.textSub }}>{fmt(c.total_sales)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t?.color }}>{t?.icon} {c.rate}%</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: T.primary, ...MONO }}>{fmt(c.total_commission)}</td>
                  <td style={{ padding: "12px 16px" }}><Badge status={c.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Quarterly Chart */}
      <Card style={{ padding: 22, marginTop: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 18 }}>Sales by Quarter — {new Date().getFullYear()}</p>
        <BarChart data={MOCK.dashboard.quarterly_data} />
      </Card>
    </div>
  );
}