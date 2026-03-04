import { useState } from "react";
import { T, MOCK, fmt, pct } from "../shared";
import { Box, KpiCard, PageTitle, TableHead, Pill, Ico } from "../components";

export default function BillingPage() {
  const [dl, setDl] = useState(null);
  const total = MOCK.billing.reduce((a, b) => a + b.amount, 0);
  const paid  = MOCK.billing.filter(b => b.status === "paid").reduce((a, b) => a + b.amount, 0);

  const download = (id) => { setDl(id); setTimeout(() => setDl(null), 1800); };

  return (
    <div>
      <PageTitle title="Billing Statements" subtitle="Track commission payment status and download your statements." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        <KpiCard label="Total Payable" value={fmt(total)}      sub="Gross commissions" iconD="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" acBg={T.primaryBg} acColor={T.primary} />
        <KpiCard label="Paid Out"      value={fmt(paid)}       sub="Already received"  iconD="M20 6L9 17l-5-5"                                        acBg={T.blueBg}    acColor={T.blue}    />
        <KpiCard label="Outstanding"   value={fmt(total-paid)} sub="Pending payment"   iconD="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"             acBg={T.amberBg}   acColor={T.amber}   />
      </div>

      {/* Progress bar */}
      <Box style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Payment Progress</p>
          <span style={{ fontSize: 12, color: T.textSub }}>{fmt(paid)} of {fmt(total)}</span>
        </div>
        <div style={{ height: 10, background: T.surfaceAlt, borderRadius: 99, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <div style={{ height: "100%", width: `${pct(paid, total)}%`, background: `linear-gradient(to right, ${T.primary}, #34d399)`, borderRadius: 99 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: T.primary, fontWeight: 600 }}>{pct(paid, total)}% paid</span>
          <span style={{ fontSize: 11, color: T.amber, fontWeight: 600 }}>{100 - pct(paid, total)}% pending</span>
        </div>
      </Box>

      {/* Payment table */}
      <Box>
        <div style={{ padding: "15px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Payment History</p>
          <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T.primary, background: T.primaryBg, border: `1px solid ${T.primaryBd}`, padding: "6px 12px", borderRadius: T.radiusSm, cursor: "pointer" }}>
            <Ico d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" size={13} color={T.primary} sw={2} /> Export CSV
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHead cols={["Reference", "Period", "Amount", "Method", "Date Paid", "Status", ""]} />
          <tbody>
            {MOCK.billing.map((b, i) => (
              <tr key={b.id}
                style={{ borderBottom: i < MOCK.billing.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: T.textSub }}>{b.ref}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: T.text }}>{b.period}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: T.primary, fontFamily: "monospace" }}>{fmt(b.amount)}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSub }}>{b.method}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSub }}>{b.date || "—"}</td>
                <td style={{ padding: "12px 16px" }}><Pill status={b.status} /></td>
                <td style={{ padding: "12px 16px" }}>
                  {b.status === "paid" && (
                    <button onClick={() => download(b.id)} style={{
                      fontSize: 11, fontWeight: 600, background: "transparent", cursor: "pointer",
                      transition: "all 0.15s", color: dl === b.id ? T.primary : T.textSub,
                      border: `1px solid ${dl === b.id ? T.primaryBd : T.border}`, padding: "4px 10px", borderRadius: T.radiusSm,
                    }}>{dl === b.id ? "✓ Done" : "Statement"}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Notice */}
      <div style={{ background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: T.radius, padding: "14px 18px", marginTop: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Ico d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" size={16} color={T.amber} sw={2} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 3 }}>Payment Schedule</p>
          <p style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>
            Payments process within 7 business days after quarter close. Keep banking details current in <strong>My Profile</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}