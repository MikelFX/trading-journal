"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  label: string;
  value: number;
  format?: "currency" | "percent" | "ratio" | "count";
  currency?: string;
  positive?: boolean;
  subtitle?: string;
  index?: number;
};

function formatValue(v: number, format: Props["format"], currency: string): string {
  switch (format) {
    case "currency":
      return `${v >= 0 ? "+" : ""}${v.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    case "percent":
      return `${(v * 100).toFixed(1)} %`;
    case "ratio":
      return v.toFixed(2);
    case "count":
      return v.toFixed(0);
    default:
      return v.toFixed(2);
  }
}

export function KpiCard({ label, value, format = "ratio", currency = "USD", positive, subtitle, index = 0 }: Props) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const duration = 1100;

  useEffect(() => {
    startRef.current = null;
    const to = value;
    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayed(to * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(step);
    }, index * 80);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, index]);

  const isPositive = positive !== undefined ? positive : value >= 0;
  const isColored = format === "currency" || format === "percent" || positive !== undefined;
  const valueColor = isColored
    ? isPositive ? "var(--color-profit)" : "var(--color-loss)"
    : "var(--color-text)";

  const glowColor = isColored
    ? isPositive ? "rgba(0,229,160,0.15)" : "rgba(255,77,109,0.15)"
    : "rgba(0,200,255,0.08)";

  const borderGlow = isColored
    ? isPositive ? "rgba(0,229,160,0.25)" : "rgba(255,77,109,0.25)"
    : "rgba(0,200,255,0.15)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -5,
        boxShadow: `0 0 50px ${glowColor}, 0 12px 40px rgba(0,0,0,0.5)`,
        borderColor: borderGlow,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* Top glow accent bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: index * 0.08 + 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: isColored
            ? isPositive
              ? "linear-gradient(90deg, transparent, var(--color-profit), transparent)"
              : "linear-gradient(90deg, transparent, var(--color-loss), transparent)"
            : "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
          transformOrigin: "left",
        }}
      />

      <div style={{
        fontSize: 11,
        color: "var(--color-text-muted)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 500,
      }}>
        {label}
      </div>

      <motion.div
        className="tabular"
        style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: valueColor }}
      >
        {formatValue(displayed, format, currency)}
      </motion.div>

      {subtitle && (
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{subtitle}</div>
      )}

      {/* Background glow blob */}
      <div style={{
        position: "absolute",
        bottom: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: glowColor,
        filter: "blur(20px)",
        pointerEvents: "none",
      }} />
    </motion.div>
  );
}
