import { T, MOCK, fmt, MONO } from "./shared";
import { Card, StatCard, TierProgress, BarChart, PageHeader, TH, Badge } from "./components";

export default function DashboardPage() {
  const { stats, tier_info, quarterly_data, recent_sales } = MOCK.dashboard;

  return (
    <div className="fade-up">
      <PageHeader
        title={`Good morning, ${MOCK.agent.user.name.split(" ")[0]} 👋`}
        subtitle="Here's a snapshot of your sales performance."
      />

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <StatCard label="Total Sales"     value={fmt(stats.total_sales)}      sub="All time"       acBg={T.primaryBg} acColor={T.primary} iconPath="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" />
        <StatCard label="Total Earnings"  value={fmt(stats.total_earnings)}   sub="This year"      acBg={T.violetBg}  acColor={T.violet} iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        <StatCard label="Customers"       value={stats.customers_count}       sub="Unique clients" acBg={T.blueBg}    acColor={T.blue}   iconPath="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />
        <StatCard label="Commission Rate" value={`${stats.commission_rate}%`} sub="Silver tier"    acBg={T.amberBg}   acColor={T.amber}  iconPath="M12 15a7 7 0 100-14 7 7 0 000 14z" />
      </div>

      {/* Chart + Tier sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 16 }}>
        <Card style={{ padding: 22 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 18 }}>
            Quarterly Sales — {new Date().getFullYear()}
          </p>
          <BarChart data={quarterly_data} />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TierProgress tier_info={tier_info} />
          <Card style={{ padding: 18 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Agent Code
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.primary, ...MONO }}>{MOCK.agent.agent_code}</p>
            <p style={{ fontSize: 11, color: T.textMute, marginTop: 4 }}>Share with customers on sign-up</p>
          </Card>
        </div>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Recent Sales</p>
          <span style={{ fontSize: 11, color: T.textMute }}>{recent_sales.length} transactions this month</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TH cols={["Reference", "Customer", "Amount", "Status", "Date"]} />
          <tbody>
            {recent_sales.map((s, i) => (
              <tr key={s.id}
                style={{ borderBottom: i < recent_sales.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
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
      </Card>
    </div>
  );
}