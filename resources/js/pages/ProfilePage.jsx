import { useState, useEffect } from "react";

const T = {
  primary: "#059669", primaryBg: "#ecfdf5", primaryBd: "#6ee7b7",
  amber: "#d97706",  amberBg: "#fffbeb",
  red: "#dc2626",    redBg: "#fef2f2",
  text: "#111827", textSub: "#6b7280", textMute: "#9ca3af",
  surface: "#fff", surfaceAlt: "#f9fafb", border: "#e5e7eb",
  radius: "10px", radiusSm: "7px", shadow: "0 1px 3px rgba(0,0,0,0.07)",
};
const MONO = { fontFamily: "'JetBrains Mono','Fira Mono',monospace" };

const TIER_META = {
  bronze: { label: "Bronze", icon: "🥉", color: "#b45309", fill: "#b45309" },
  silver: { label: "Silver", icon: "🥈", color: "#6b7280", fill: "#6b7280" },
  gold:   { label: "Gold",   icon: "🥇", color: "#d97706", fill: "#d97706" },
};

function Card({ children, style = {} }) {
  return <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, ...style }}>{children}</div>;
}

function Field({ label, value, mono = false }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, color: value ? T.text : T.textMute, fontStyle: value ? "normal" : "italic", ...(mono ? MONO : {}) }}>
        {value || "Not provided"}
      </p>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", required = false, disabled = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 6 }}>
        {label} {required && <span style={{ color: T.red }}>*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        disabled={disabled} required={required}
        style={{
          width: "100%", padding: "9px 12px", border: `1px solid ${focused ? T.primary : T.border}`,
          borderRadius: T.radiusSm, fontSize: 13, color: T.text, background: disabled ? T.surfaceAlt : T.surface,
          fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "",
    bank_name: "", account_holder_name: "", account_number: "",
    branch_code: "", swift_code: "", bank_address: "",
  });

  useEffect(() => {
    fetch("/api/agent/profile", {
      headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin",
    })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(res => {
        if (res.success) {
          setProfile(res.data);
          const d = res.data;
          setForm({
            name: d.user?.name || "",
            email: d.user?.email || "",
            phone: d.user?.phone || "",
            company: d.user?.company || "",
            bank_name: d.bank_name || "",
            account_holder_name: d.account_holder_name || "",
            account_number: d.account_number || "",
            branch_code: d.branch_code || "",
            swift_code: d.swift_code || "",
            bank_address: d.bank_address || "",
          });
        } else {
          throw new Error(res.message);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

    try {
      const res = await fetch("/api/agent/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
        },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const msgs = Object.values(data.errors).flat();
          throw new Error(msgs[0]);
        }
        throw new Error(data.message || "Update failed");
      }

      if (data.success) {
        setProfile(data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const tier = profile?.tier || {};
  const tm = TIER_META[tier.name] || TIER_META.bronze;

  const tabs = [
    { id: "personal", label: "Personal Info" },
    { id: "banking",  label: "Banking Details" },
    { id: "account",  label: "Account Info" },
  ];

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>My Profile</h1>
        <p style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>Manage your personal information and banking details for commission payouts.</p>
      </div>

      {/* Profile Hero */}
      {loading ? (
        <Card style={{ padding: 24, marginBottom: 16, animation: "pulse 1.5s infinite" }}>
          <div style={{ height: 60, background: T.surfaceAlt, borderRadius: 8 }} />
        </Card>
      ) : (
        <Card style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: tm.fill, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {(profile?.user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{profile?.user?.name}</p>
              <p style={{ fontSize: 13, color: T.textSub }}>{profile?.user?.email}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Agent Code</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: T.primary, ...MONO }}>{profile?.agent_code}</p>
            </div>
            <div style={{ textAlign: "right", marginLeft: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Tier</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: tm.color }}>{tm.icon} {tm.label}</p>
            </div>
            <div style={{ marginLeft: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: profile?.is_active ? T.primaryBg : "#fef2f2", color: profile?.is_active ? T.primary : "#dc2626", border: `1px solid ${profile?.is_active ? T.primaryBd : "#fca5a5"}` }}>
                {profile?.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: T.surfaceAlt, padding: 4, borderRadius: T.radiusSm, width: "fit-content" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13,
            fontWeight: activeTab === tab.id ? 700 : 500, fontFamily: "inherit",
            background: activeTab === tab.id ? T.surface : "transparent",
            color: activeTab === tab.id ? T.text : T.textSub,
            boxShadow: activeTab === tab.id ? T.shadow : "none",
            transition: "all 0.15s",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: "12px 16px", background: T.redBg, border: "1px solid #fca5a5", borderRadius: T.radiusSm, marginBottom: 14, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "12px 16px", background: T.primaryBg, border: `1px solid ${T.primaryBd}`, borderRadius: T.radiusSm, marginBottom: 14, color: T.primary, fontSize: 13, fontWeight: 600 }}>
          ✓ Profile updated successfully
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "personal" && (
        <Card style={{ padding: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 20 }}>Personal Information</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Full Name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" required />
            <Input label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />
            <Input label="Company / Business" name="company" value={form.company} onChange={handleChange} />
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSave} disabled={saving || loading} style={{
              padding: "10px 24px", background: saving ? T.primaryBg : T.primary, color: saving ? T.primary : "#fff",
              border: `1px solid ${T.primaryBd}`, borderRadius: T.radiusSm, cursor: saving ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
            }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Card>
      )}

      {activeTab === "banking" && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Banking Details</p>
              <p style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>Used for commission payouts. Keep this accurate.</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Bank Name" name="bank_name" value={form.bank_name} onChange={handleChange} />
            <Input label="Account Holder Name" name="account_holder_name" value={form.account_holder_name} onChange={handleChange} />
            <Input label="Account Number" name="account_number" value={form.account_number} onChange={handleChange} />
            <Input label="Branch Code" name="branch_code" value={form.branch_code} onChange={handleChange} />
            <Input label="SWIFT Code" name="swift_code" value={form.swift_code} onChange={handleChange} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 6 }}>Bank Address</label>
              <textarea name="bank_address" value={form.bank_address} onChange={handleChange} rows={3}
                style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", resize: "vertical" }}
                onFocus={e => e.target.style.borderColor = T.primary}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSave} disabled={saving || loading} style={{
              padding: "10px 24px", background: saving ? T.primaryBg : T.primary, color: saving ? T.primary : "#fff",
              border: `1px solid ${T.primaryBd}`, borderRadius: T.radiusSm, cursor: saving ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
            }}>
              {saving ? "Saving…" : "Save Banking Details"}
            </button>
          </div>
        </Card>
      )}

      {activeTab === "account" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Account Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Agent Code" value={profile?.agent_code} mono />
              <Field label="Member Since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }) : null} />
              <Field label="Last Updated" value={profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }) : null} />
              <Field label="Status" value={profile?.is_active ? "Active" : "Inactive"} />
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Current Tier</p>
            {profile?.tier ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T.amberBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{tm.icon}</div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: tm.color }}>{tm.label} Tier</p>
                    <p style={{ fontSize: 12, color: T.textMute }}>{tier.commission_rate}% commission rate</p>
                  </div>
                </div>
                <div style={{ background: T.surfaceAlt, borderRadius: T.radiusSm, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: T.textMute }}>Min Sales</span>
                    <span style={{ fontWeight: 700, color: T.text, ...MONO }}>KSh {Number(tier.min_sales || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: T.textMute }}>Max Sales</span>
                    <span style={{ fontWeight: 700, color: T.text, ...MONO }}>
                      {tier.max_sales ? "KSh " + Number(tier.max_sales).toLocaleString() : "Unlimited"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: T.textMute }}>Loading tier info…</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}