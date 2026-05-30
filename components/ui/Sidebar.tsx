"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",          label: "Dashboard",   icon: "▦" },
  { href: "/calendar",  label: "Kalendář",    icon: "◫" },
  { href: "/trades",    label: "Obchody",     icon: "≡" },
  { href: "/analytics", label: "Analytika",   icon: "◈" },
  { href: "/insights",  label: "AI Insights", icon: "✦" },
  { href: "/settings",  label: "Nastavení",   icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 240,
        height: "100vh",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "0 20px 24px",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            letterSpacing: "0.12em",
            color: "var(--color-accent)",
            textTransform: "uppercase",
          }}
        >
          Trading
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "0.05em",
          }}
        >
          Journal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {NAV.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: "var(--radius)",
                marginBottom: 2,
                color: active ? "var(--color-text)" : "var(--color-text-muted)",
                background: active ? "rgba(0,180,216,0.08)" : "transparent",
                borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* New trade button */}
      <div style={{ padding: "16px 12px 0" }}>
        <Link
          href="/trades/new"
          style={{
            display: "block",
            textAlign: "center",
            padding: "10px 16px",
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            borderRadius: "var(--radius)",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.04em",
            textDecoration: "none",
          }}
        >
          + Nový obchod
        </Link>
      </div>
    </aside>
  );
}
