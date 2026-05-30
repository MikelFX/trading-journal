"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/lib/actions/settings";

type Settings = {
  accountSize: number | null;
  maxRiskPercent: number;
  targetRR: number;
  maxTradesPerDay: number;
  currency: string;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    accountSize: initial.accountSize?.toString() ?? "",
    maxRiskPercent: initial.maxRiskPercent.toString(),
    targetRR: initial.targetRR.toString(),
    maxTradesPerDay: initial.maxTradesPerDay.toString(),
    currency: initial.currency,
  });

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateSettings({
        accountSize: form.accountSize ? parseFloat(form.accountSize) : undefined,
        maxRiskPercent: parseFloat(form.maxRiskPercent),
        targetRR: parseFloat(form.targetRR),
        maxTradesPerDay: parseInt(form.maxTradesPerDay),
        currency: form.currency,
      });
      setSaved(true);
    });
  }

  const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" };
  const inputStyle: React.CSSProperties = {
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    color: "var(--color-text)",
    padding: "9px 12px",
    fontSize: 14,
    fontFamily: "var(--font-display)",
    outline: "none",
  };

  return (
    <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 20 }}>
        Pravidla a účet
      </h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Velikost účtu</span>
            <input style={inputStyle} type="number" step="any" value={form.accountSize} onChange={(e) => set("accountSize", e.target.value)} placeholder="10000" />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Měna</span>
            <input style={inputStyle} value={form.currency} onChange={(e) => set("currency", e.target.value)} placeholder="USD" maxLength={3} />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Max risk % na obchod</span>
            <input style={inputStyle} type="number" step="0.1" value={form.maxRiskPercent} onChange={(e) => set("maxRiskPercent", e.target.value)} />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Cílové RR</span>
            <input style={inputStyle} type="number" step="0.1" value={form.targetRR} onChange={(e) => set("targetRR", e.target.value)} />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Max obchodů za den</span>
            <input style={inputStyle} type="number" step="1" value={form.maxTradesPerDay} onChange={(e) => set("maxTradesPerDay", e.target.value)} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "10px 24px",
              background: "var(--color-accent)",
              color: "var(--color-bg)",
              borderRadius: "var(--radius)",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? "Ukládám..." : "Uložit"}
          </button>
          {saved && <span style={{ fontSize: 13, color: "var(--color-profit)" }}>Uloženo ✓</span>}
        </div>
      </form>
    </section>
  );
}
