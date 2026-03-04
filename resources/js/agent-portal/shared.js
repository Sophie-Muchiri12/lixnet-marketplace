// ─── Design Tokens ────────────────────────────────────────────────────────────
export const T = {
  bg:"#f5f6fa", surface:"#ffffff", surfaceAlt:"#f9fafb", border:"#e8eaef",
  text:"#1a1d23", textSub:"#6b7280", textMute:"#9ca3af",
  primary:"#059669", primaryBg:"#ecfdf5", primaryBd:"#a7f3d0",
  amber:"#d97706",  amberBg:"#fffbeb",  amberBd:"#fcd34d",
  violet:"#7c3aed", violetBg:"#f5f3ff", violetBd:"#ddd6fe",
  rose:"#e11d48",   roseBg:"#fff1f2",   roseBd:"#fecdd3",
  blue:"#2563eb",   blueBg:"#eff6ff",   blueBd:"#bfdbfe",
  shadow:"0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)",
  shadowMd:"0 4px 16px rgba(0,0,0,0.08),0 2px 6px rgba(0,0,0,0.04)",
  radius:"12px", radiusSm:"8px", radiusLg:"16px",
};

export const TIER = {
  bronze:{ label:"Bronze", color:"#92400e", bg:"#fef3c7", bd:"#f59e0b", bar:"#f59e0b", icon:"🥉" },
  silver:{ label:"Silver", color:"#374151", bg:"#f3f4f6", bd:"#9ca3af", bar:"#6b7280", icon:"🥈" },
  gold:  { label:"Gold",   color:"#78350f", bg:"#fef9c3", bd:"#eab308", bar:"#eab308", icon:"🥇" },
};

export const STATUS_STYLE = {
  completed:{ bg:"#ecfdf5", text:"#059669", bd:"#a7f3d0", dot:"#10b981" },
  paid:     { bg:"#ecfdf5", text:"#059669", bd:"#a7f3d0", dot:"#10b981" },
  active:   { bg:"#ecfdf5", text:"#059669", bd:"#a7f3d0", dot:"#10b981" },
  pending:  { bg:"#fffbeb", text:"#d97706", bd:"#fcd34d", dot:"#f59e0b" },
  cancelled:{ bg:"#fff1f2", text:"#e11d48", bd:"#fecdd3", dot:"#f43f5e" },
};

// ─── Mock Data ─────────────────────────────────────────────────────────────────
export const MOCK = {
  agent:{
    agent_code:"AGT-RTDXQP8V", is_active:true,
    tier:{ name:"silver", commission_rate:20 },
    bank_name:"Equity Bank", account_holder_name:"Sophia Muthoni",
    account_number:"****4821", branch_code:"026", swift_code:"EQBLKENA",
    user:{ name:"Sophia Muthoni", email:"muthonisophie12@gmail.com", phone:"0718049238", company:"Lixnet Agency" },
  },
  dashboard:{
    stats:{ total_sales:38450, total_earnings:7690, customers_count:24, commission_rate:20 },
    tier_info:{ name:"silver", commission_rate:20, current_sales:38450, sales_to_next_tier:11550 },
    quarterly_data:[
      {quarter:"Q1",sales:8200},{quarter:"Q2",sales:11300},
      {quarter:"Q3",sales:12600},{quarter:"Q4",sales:6350},
    ],
    recent_sales:[
      {id:1,order_reference:"ORD-2024-001",full_name:"James Kariuki",  total_amount:3500,status:"completed",created_at:"Dec 01, 2024"},
      {id:2,order_reference:"ORD-2024-002",full_name:"Amina Hassan",   total_amount:1200,status:"pending",  created_at:"Dec 03, 2024"},
      {id:3,order_reference:"ORD-2024-003",full_name:"Peter Odhiambo", total_amount:5800,status:"completed",created_at:"Dec 05, 2024"},
      {id:4,order_reference:"ORD-2024-004",full_name:"Grace Wanjiku",  total_amount:900, status:"cancelled",created_at:"Dec 07, 2024"},
    ],
  },
  products:[
    {id:1,title:"Lixnet ERP Pro",             desc:"Full enterprise resource planning suite for SMEs",  price:45000,cat:"Software", sub:true, rating:4.8,rc:132,tiers:{Free:{price:0},Basic:{price:45000},Premium:{price:90000}}},
    {id:2,title:"HR Management System",        desc:"Complete HR & payroll solution",                   price:28000,cat:"Software", sub:false,rating:4.6,rc:89},
    {id:3,title:"Cloud POS Terminal",          desc:"Point of sale system with real-time analytics",    price:15000,cat:"Hardware", sub:false,rating:4.5,rc:56},
    {id:4,title:"Cyber Security Suite",        desc:"Advanced threat protection for businesses",        price:60000,cat:"Security", sub:true, rating:4.9,rc:44,tiers:{Basic:{price:30000},Premium:{price:60000}}},
    {id:5,title:"Business Analytics Dashboard",desc:"Real-time data visualization platform",           price:22000,cat:"Analytics",sub:true, rating:4.7,rc:71,tiers:{Starter:{price:10000},Pro:{price:22000}}},
    {id:6,title:"Network Infrastructure Kit",  desc:"Enterprise-grade networking hardware bundle",      price:85000,cat:"Hardware", sub:false,rating:4.4,rc:23},
  ],
  commissions:[
    {id:1,period:"Q1 2024 (Jan–Mar)",total_sales:8200, total_commission:1640,tier:"bronze",rate:10,status:"paid"},
    {id:2,period:"Q2 2024 (Apr–Jun)",total_sales:11300,total_commission:2260,tier:"silver",rate:20,status:"paid"},
    {id:3,period:"Q3 2024 (Jul–Sep)",total_sales:12600,total_commission:2520,tier:"silver",rate:20,status:"paid"},
    {id:4,period:"Q4 2024 (Oct–Dec)",total_sales:6350, total_commission:1270,tier:"silver",rate:20,status:"pending"},
  ],
  billing:[
    {id:1,reference:"PAY-2024-Q1",period:"Q1 2024 (Jan–Mar)",amount:1640,status:"paid",   paid_at:"Apr 05, 2024",method:"Bank Transfer"},
    {id:2,reference:"PAY-2024-Q2",period:"Q2 2024 (Apr–Jun)",amount:2260,status:"paid",   paid_at:"Jul 03, 2024",method:"Bank Transfer"},
    {id:3,reference:"PAY-2024-Q3",period:"Q3 2024 (Jul–Sep)",amount:2520,status:"paid",   paid_at:"Oct 04, 2024",method:"Bank Transfer"},
    {id:4,reference:"PAY-2024-Q4",period:"Q4 2024 (Oct–Dec)",amount:1270,status:"pending",paid_at:null,          method:"—"},
  ],
  messages:[
    {id:1,init:"A",text:"Welcome to the Lixnet agent portal! Your application has been approved.",time:"Jan 15, 09:00",admin:true},
    {id:2,init:"S",text:"Thank you! When do I get my agent code details?",time:"Jan 15, 09:12",admin:false},
    {id:3,init:"A",text:"Your code is AGT-RTDXQP8V. Rates: 10% Bronze, 20% Silver, 30% Gold.",time:"Jan 15, 09:30",admin:true},
    {id:4,init:"A",text:"Your Q3 commission of KSh 2,520 has been processed to your Equity Bank account.",time:"Oct 4, 14:22",admin:true},
  ],
  certs:[
    {id:1,title:"Lixnet Certified Sales Agent",  issued:"Jan 15, 2024",expires:"Jan 15, 2025",code:"CERT-LCSA-2024-0142",desc:"Official certification confirming your approved Lixnet agent status.",lifetime:false},
    {id:2,title:"Product Knowledge Certification",issued:"Feb 01, 2024",expires:"Feb 01, 2025",code:"CERT-PKC-2024-0058",desc:"Demonstrates proficiency across the full Lixnet product catalogue.",lifetime:false},
    {id:3,title:"Silver Tier Achievement",        issued:"May 10, 2024",expires:null,           code:"CERT-STA-2024-0011",desc:"Awarded for reaching Silver Tier with KSh 25,000+ in cumulative sales.",lifetime:true},
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmt  = (n) => `KSh ${Number(n).toLocaleString()}`;
export const pct  = (v, t) => Math.min(100, Math.round((v / t) * 100));
export const MONO = { fontFamily:"'JetBrains Mono',monospace" };

// ─── Nav Config ───────────────────────────────────────────────────────────────
export const NAV = [
  { id:"dashboard",   label:"Dashboard",     icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  { id:"products",    label:"Products",       icon:"M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0" },
  { id:"profile",     label:"My Profile",     icon:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z" },
  { id:"commissions", label:"Commissions",    icon:"M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { id:"messages",    label:"Messages",       icon:"M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", badge:1 },
  { id:"billing",     label:"Billing",        icon:"M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { id:"certs",       label:"Certifications", icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
];