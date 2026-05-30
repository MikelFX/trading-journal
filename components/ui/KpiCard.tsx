"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  value: number;
  format?: "currency" | "percent" | "ratio" | "count";
  currency?: string;
  positive?: boolean;
  subtitle?: string;
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

export function KpiCard({ label, value, format = "ratio", currency = "USD", positive, subtitle }: Props) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const duration = 900;

  useEffect(() => {
    startRef.current = null;
    const from = 0;
    const to = value;

    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(from + (to - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const isPositive = positive !== undefined ? positive : value >= 0;
  const colorClass = format === "currency" || format === "percent" || positive !== undefined
    ? isPositive ? "profit" : "loss"
    : "";

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div
        className={`tabular ${colorClass}`}
        style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}
      >
        {formatValue(displayed, format, currency)}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{subtitle}</div>
      )}
    </div>
  );
}
