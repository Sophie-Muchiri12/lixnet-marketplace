// FILE PATH: resources/js/Layouts/AgentLayout.jsx

import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    ShoppingBag,
    User,
    TrendingUp,
    MessageSquare,
    Receipt,
    Award,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Bell,
} from "lucide-react";

const navItems = [
    {
        label: "Dashboard",
        href: "/agent/dashboard",
        icon: LayoutDashboard,
        routeName: "agent.dashboard",
    },
    {
        label: "Products",
        href: "/agent/products",
        icon: ShoppingBag,
        routeName: "agent.products",
    },
    {
        label: "My Profile",
        href: "/agent/profile",
        icon: User,
        routeName: "agent.profile",
    },
    {
        label: "Sales & Commissions",
        href: "/agent/sales",
        icon: TrendingUp,
        routeName: "agent.sales",
    },
    {
        label: "Messages",
        href: "/agent/messages",
        icon: MessageSquare,
        routeName: "agent.messages",
    },
    {
        label: "Billing",
        href: "/agent/billing",
        icon: Receipt,
        routeName: "agent.billing",
    },
    {
        label: "Certifications",
        href: "/agent/certifications",
        icon: Award,
        routeName: "agent.certifications",
    },
];

export default function AgentLayout({ children, title = "Agent Portal" }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url, auth } = usePage().props;

    const isActive = (href) => url.startsWith(href);

    const agent = auth?.agent;
    const user = auth?.user;

    return (
        <div className="agent-layout">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                :root {
                    --sidebar-width: 256px;
                    --bg: #f0f2f5;
                    --surface: #ffffff;
                    --sidebar-bg: #0f1923;
                    --sidebar-accent: #1a8a5a;
                    --sidebar-text: #94a3b8;
                    --sidebar-text-active: #ffffff;
                    --sidebar-item-active: rgba(26, 138, 90, 0.18);
                    --sidebar-item-hover: rgba(255,255,255,0.06);
                    --accent: #1a8a5a;
                    --accent-light: #e8f7f0;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --border: #e5e7eb;
                    --radius: 12px;
                    --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06);
                }

                .agent-layout {
                    font-family: 'DM Sans', sans-serif;
                    background: var(--bg);
                    min-height: 100vh;
                    display: flex;
                }

                /* Sidebar */
                .sidebar {
                    width: var(--sidebar-width);
                    background: var(--sidebar-bg);
                    position: fixed;
                    top: 0; left: 0; bottom: 0;
                    display: flex;
                    flex-direction: column;
                    z-index: 100;
                    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
                }

                .sidebar-logo {
                    padding: 24px 20px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }

                .logo-mark {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .logo-icon {
                    width: 36px; height: 36px;
                    background: var(--accent);
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-icon svg { color: white; }

                .logo-text {
                    display: flex;
                    flex-direction: column;
                }

                .logo-name {
                    font-size: 15px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -0.3px;
                }

                .logo-sub {
                    font-size: 10px;
                    font-weight: 500;
                    color: var(--accent);
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }

                /* Nav */
                .sidebar-nav {
                    flex: 1;
                    padding: 16px 12px;
                    overflow-y: auto;
                }

                .nav-section-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    color: rgba(148,163,184,0.5);
                    padding: 0 8px;
                    margin-bottom: 8px;
                    margin-top: 16px;
                }
                .nav-section-label:first-child { margin-top: 0; }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 10px;
                    border-radius: 8px;
                    color: var(--sidebar-text);
                    text-decoration: none;
                    font-size: 13.5px;
                    font-weight: 500;
                    transition: all 0.18s ease;
                    margin-bottom: 2px;
                    position: relative;
                }

                .nav-item:hover {
                    background: var(--sidebar-item-hover);
                    color: #fff;
                }

                .nav-item.active {
                    background: var(--sidebar-item-active);
                    color: var(--sidebar-text-active);
                }

                .nav-item.active::before {
                    content: '';
                    position: absolute;
                    left: 0; top: 50%;
                    transform: translateY(-50%);
                    width: 3px; height: 18px;
                    background: var(--accent);
                    border-radius: 0 3px 3px 0;
                }

                .nav-item svg { flex-shrink: 0; }

                .nav-item-label { flex: 1; }

                .nav-chevron {
                    opacity: 0;
                    transition: opacity 0.15s;
                }
                .nav-item.active .nav-chevron,
                .nav-item:hover .nav-chevron { opacity: 1; }

                /* Agent card */
                .sidebar-agent-card {
                    margin: 12px;
                    padding: 14px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.07);
                }

                .agent-card-inner {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .agent-avatar {
                    width: 36px; height: 36px;
                    background: linear-gradient(135deg, var(--accent), #0d6b45);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                    color: white;
                    flex-shrink: 0;
                }

                .agent-info { flex: 1; min-width: 0; }

                .agent-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #fff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .agent-code {
                    font-size: 10px;
                    color: var(--accent);
                    font-family: 'DM Mono', monospace;
                    margin-top: 1px;
                }

                .sidebar-logout {
                    margin: 0 12px 16px;
                }

                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 9px 10px;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    color: rgba(148,163,184,0.7);
                    font-size: 13px;
                    font-weight: 500;
                    font-family: 'DM Sans', sans-serif;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.18s;
                }

                .logout-btn:hover {
                    background: rgba(239,68,68,0.12);
                    color: #f87171;
                }

                /* Main content */
                .main-wrapper {
                    margin-left: var(--sidebar-width);
                    flex: 1;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                /* Topbar */
                .topbar {
                    background: var(--surface);
                    border-bottom: 1px solid var(--border);
                    padding: 0 28px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }

                .topbar-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .page-title {
                    font-size: 17px;
                    font-weight: 600;
                    color: var(--text-primary);
                    letter-spacing: -0.3px;
                }

                .topbar-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .topbar-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 10px;
                    background: var(--accent-light);
                    border-radius: 20px;
                    font-size: 11.5px;
                    font-weight: 600;
                    color: var(--accent);
                    letter-spacing: 0.3px;
                }

                .topbar-badge-dot {
                    width: 6px; height: 6px;
                    background: var(--accent);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.85); }
                }

                .notif-btn {
                    width: 36px; height: 36px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: transparent;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text-secondary);
                    transition: all 0.15s;
                }

                .notif-btn:hover {
                    background: var(--bg);
                    color: var(--text-primary);
                }

                .mobile-toggle {
                    display: none;
                    width: 36px; height: 36px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: transparent;
                    cursor: pointer;
                    align-items: center; justify-content: center;
                    color: var(--text-secondary);
                }

                /* Page content */
                .page-content {
                    flex: 1;
                    padding: 28px;
                }

                /* Overlay */
                .sidebar-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 99;
                }

                @media (max-width: 768px) {
                    .sidebar {
                        transform: translateX(-100%);
                    }
                    .sidebar.open {
                        transform: translateX(0);
                    }
                    .main-wrapper {
                        margin-left: 0;
                    }
                    .mobile-toggle {
                        display: flex;
                    }
                    .sidebar-overlay.open {
                        display: block;
                    }
                    .page-content {
                        padding: 20px 16px;
                    }
                }
            `}</style>

            {/* Sidebar Overlay (mobile) */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-mark">
                        <div className="logo-icon">
                            <ShoppingBag size={18} />
                        </div>
                        <div className="logo-text">
                            <span className="logo-name">Lixnet</span>
                            <span className="logo-sub">Agent Portal</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <div className="nav-section-label">Main Menu</div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item ${active ? "active" : ""}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon size={16} />
                                <span className="nav-item-label">{item.label}</span>
                                <ChevronRight size={12} className="nav-chevron" />
                            </Link>
                        );
                    })}
                </nav>

                {/* Agent info card */}
                <div className="sidebar-agent-card">
                    <div className="agent-card-inner">
                        <div className="agent-avatar">
                            {(user?.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="agent-info">
                            <div className="agent-name">{user?.name || "Agent"}</div>
                            <div className="agent-code">
                                {agent?.agent_code || "AGT-XXXXXXXX"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div className="sidebar-logout">
                    <Link href="/logout" method="post" as="button" className="logout-btn">
                        <LogOut size={15} />
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="main-wrapper">
                {/* Topbar */}
                <header className="topbar">
                    <div className="topbar-left">
                        <button
                            className="mobile-toggle"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={18} />
                        </button>
                        <span className="page-title">{title}</span>
                    </div>
                    <div className="topbar-right">
                        <div className="topbar-badge">
                            <span className="topbar-badge-dot" />
                            Active Agent
                        </div>
                        <button className="notif-btn">
                            <Bell size={16} />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
}