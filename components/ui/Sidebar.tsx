"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NAV = [
  { href: "/",          label: "Dashboard",   icon: "▦" },
  { href: "/calendar",  label: "Kalendář",    icon: "◫" },
  { href: "/trades",    label: "Obchody",     icon: "≡" },
  { href: "/analytics", label: "Analytika",   icon: "◈" },
  { href: "/coach",     label: "AI Kouč",     icon: "✦" },
  { href: "/prop",      label: "Prop-firm",   icon: "◉" },
  { href: "/settings",  label: "Nastavení",   icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 240,
        height: "100vh",
        background: "rgba(8, 12, 22, 0.95)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "28px 0",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          padding: "0 20px 28px",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: 12,
        }}
      >
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 11,
          letterSpacing: "0.2em",
          color: "var(--color-accent)",
          textTransform: "uppercase",
          marginBottom: 4,
        }}>
          Trading
        </div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 700,
          color: "var(--color-text)",
          letterSpacing: "0.06em",
          textShadow: "0 0 20px rgba(0,200,255,0.3)",
        }}>
          Journal
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <div className="pulse" style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--color-profit)",
          }} />
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>LIVE</span>
        </div>
      </motion.div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {NAV.map(({ href, label, icon }, i) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: "var(--radius)",
                  marginBottom: 3,
                  color: active ? "var(--color-text)" : "var(--color-text-muted)",
                  background: active ? "rgba(0,200,255,0.08)" : "transparent",
                  borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  position: "relative",
                  boxShadow: active ? "inset 0 0 20px rgba(0,200,255,0.05)" : "none",
                }}
              >
                <span style={{
                  fontSize: 15,
                  width: 20,
                  textAlign: "center",
                  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                  filter: active ? "drop-shadow(0 0 6px var(--color-accent))" : "none",
                  transition: "all 0.2s ease",
                }}>
                  {icon}
                </span>
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    style={{
                      position: "absolute",
                      right: 12,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "var(--color-accent)",
                      boxShadow: "0 0 8px var(--color-accent)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* New trade button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{ padding: "16px 12px 0" }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/trades/new"
            style={{
              display: "block",
              textAlign: "center",
              padding: "11px 16px",
              background: "linear-gradient(135deg, var(--color-accent), #0070ff)",
              color: "#000",
              borderRadius: "var(--radius)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.05em",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,200,255,0.3)",
            }}
          >
            + Nový obchod
          </Link>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}
