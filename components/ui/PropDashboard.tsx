"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPropChallenge, updatePropChallengeStatus, deletePropChallenge } from "@/lib/actions/propChallenge";
import type { PropChallengeFormData } from "@/lib/schemas";
import { FadeUp } from "@/components/ui/PageWrapper";

type ChallengeData = {
  id: string;
  firmName: string;
  phase: string | null;
  accountSize: number;
  dailyLossLimit: number;
  maxLossLimit: number;
  profitTarget: number | null;
  minTradingDays: number | null;
  startDate: string;
  status: "ACTIVE" | "PASSED" | "FAILED";
  totalPnl: number;
  todayPnl: number;
  maxDrawdown: number;
  tradingDays: number;
};

function ProgressBar({
  label,
  value,
  max,
  color,
  inverted = false,
  format,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  inverted?: boolean;
  format?: (v: number) => string;
}) {
  const pct = Math.min(Math.abs(value / max) * 100, 100);
  const fmt = format ?? ((v: number) => v.toFixed(2));
  const isWarning = pct >= 80;
  const barColor = isWarning ? "var(--color-loss)" : color;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: isWarning ? "var(--color-loss)" : "var(--color-text-muted)",
        }}
      >
        <span>{label}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
          {fmt(Math.abs(value))} / {fmt(max)}
          {isWarning && " ⚠"}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--color-border)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: "100%",
            background: isWarning
              ? "linear-gradient(90deg, var(--color-loss), #ff4444)"
              : `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
            borderRadius: 4,
            boxShadow: isWarning ? "0 0 8px rgba(255,50,50,0.4)" : `0 0 8px ${barColor}40`,
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "right" }}>
        {pct.toFixed(1)} % využito
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "ACTIVE" | "PASSED" | "FAILED" }) {
  const cfg = {
    ACTIVE: { label: "ACTIVE", color: "var(--color-accent)", bg: "rgba(0,200,255,0.1)" },
    PASSED: { label: "PASSED", color: "var(--color-profit)", bg: "rgba(0,220,100,0.1)" },
    FAILED: { label: "FAILED", color: "var(--color-loss)", bg: "rgba(255,50,50,0.1)" },
  }[status];

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
        borderRadius: 4,
        padding: "2px 8px",
        fontFamily: "var(--font-display)",
      }}
    >
      {cfg.label}
    </span>
  );
}

function ChallengeCard({ c, index }: { c: ChallengeData; index: number }) {
  const [isPending, start] = useTransition();

  const dailyUsed = Math.abs(Math.min(c.todayPnl, 0));
  const drawdownUsed = c.maxDrawdown;
  const profitMade = Math.max(c.totalPnl, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top glow for active */}
      {c.status === "ACTIVE" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              marginBottom: 4,
            }}
          >
            {c.firmName}
            {c.phase && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "var(--color-text-muted)",
                  marginLeft: 8,
                }}
              >
                {c.phase}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {new Date(c.startDate).toLocaleDateString("cs-CZ")} ·{" "}
            <span style={{ fontFamily: "var(--font-display)" }}>
              {c.tradingDays}
            </span>{" "}
            dnů obchodování
            {c.minTradingDays && ` / ${c.minTradingDays} min`}
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Účet",
            value: `$${c.accountSize.toLocaleString()}`,
            color: "var(--color-text-muted)",
          },
          {
            label: "Dnešní P/L",
            value: (c.todayPnl >= 0 ? "+" : "") + c.todayPnl.toFixed(2),
            color:
              c.todayPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)",
          },
          {
            label: "Celkový P/L",
            value: (c.totalPnl >= 0 ? "+" : "") + c.totalPnl.toFixed(2),
            color:
              c.totalPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "var(--color-bg)",
              borderRadius: "var(--radius)",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>
              {label}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color,
                fontFamily: "var(--font-display)",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ProgressBar
          label="Denní ztráta"
          value={dailyUsed}
          max={c.dailyLossLimit}
          color="var(--color-accent)"
          format={(v) => `$${v.toFixed(2)}`}
        />
        <ProgressBar
          label="Max drawdown"
          value={drawdownUsed}
          max={c.maxLossLimit}
          color="var(--color-accent)"
          format={(v) => `$${v.toFixed(2)}`}
        />
        {c.profitTarget != null && (
          <ProgressBar
            label="Profit target"
            value={profitMade}
            max={c.profitTarget}
            color="var(--color-profit)"
            format={(v) => `$${v.toFixed(2)}`}
          />
        )}
      </div>

      {/* Actions */}
      {c.status === "ACTIVE" && (
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button
            disabled={isPending}
            onClick={() => start(async () => { await updatePropChallengeStatus(c.id, "PASSED"); })}
            style={{
              padding: "7px 14px",
              background: "rgba(0,220,100,0.1)",
              border: "1px solid var(--color-profit)",
              borderRadius: "var(--radius)",
              color: "var(--color-profit)",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ✓ Splněno
          </button>
          <button
            disabled={isPending}
            onClick={() => start(async () => { await updatePropChallengeStatus(c.id, "FAILED"); })}
            style={{
              padding: "7px 14px",
              background: "rgba(255,50,50,0.08)",
              border: "1px solid var(--color-loss)",
              borderRadius: "var(--radius)",
              color: "var(--color-loss)",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ✗ Prasklo
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (confirm("Smazat challenge?")) {
                start(async () => { await deletePropChallenge(c.id); });
              }
            }}
            style={{
              padding: "7px 14px",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              color: "var(--color-text-muted)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Smazat
          </button>
        </div>
      )}
    </motion.div>
  );
}

const DEFAULT_FORM: PropChallengeFormData = {
  firmName: "",
  phase: "",
  accountSize: 100000,
  dailyLossLimit: 5000,
  maxLossLimit: 10000,
  profitTarget: undefined,
  minTradingDays: undefined,
  startDate: new Date().toISOString().slice(0, 16),
  status: "ACTIVE",
};

function AddChallengeForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function set(key: string, value: string | number | undefined) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await createPropChallenge({
          ...form,
          startDate: new Date(form.startDate).toISOString(),
        });
        setForm(DEFAULT_FORM);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chyba při ukládání");
      }
    });
  }

  const inputStyle = {
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    color: "var(--color-text)",
    padding: "9px 12px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    fontFamily: "var(--font-display)",
  };

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        style={{
          padding: "10px 20px",
          background: open ? "var(--color-surface-2)" : "linear-gradient(135deg, var(--color-accent), #0070ff)",
          color: open ? "var(--color-text-muted)" : "#000",
          border: "none",
          borderRadius: "var(--radius)",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          marginBottom: open ? 16 : 0,
        }}
      >
        {open ? "✕ Zrušit" : "+ Přidat challenge"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {error && (
              <div style={{ color: "var(--color-loss)", fontSize: 13, padding: "8px 12px", background: "var(--color-loss-dim)", borderRadius: "var(--radius)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "Firma (FTMO, MFF...)", key: "firmName", type: "text", required: true },
                { label: "Fáze (Phase 1, Funded...)", key: "phase", type: "text" },
                { label: "Velikost účtu ($)", key: "accountSize", type: "number" },
                { label: "Denní loss limit ($)", key: "dailyLossLimit", type: "number" },
                { label: "Max loss limit ($)", key: "maxLossLimit", type: "number" },
                { label: "Profit target ($)", key: "profitTarget", type: "number" },
                { label: "Min. obchodní dny", key: "minTradingDays", type: "number" },
                { label: "Datum začátku", key: "startDate", type: "datetime-local" },
              ].map(({ label, key, type, required }) => (
                <label key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {label}
                  </span>
                  <input
                    type={type}
                    required={required}
                    step={type === "number" ? "any" : undefined}
                    value={type === "number"
                      ? ((form as Record<string, unknown>)[key] as number | undefined) ?? ""
                      : ((form as Record<string, unknown>)[key] as string) ?? ""}
                    onChange={(e) => {
                      if (type === "number") {
                        set(key, e.target.value ? parseFloat(e.target.value) : undefined);
                      } else {
                        set(key, e.target.value);
                      }
                    }}
                    style={inputStyle}
                  />
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "11px 24px",
                background: isPending ? "var(--color-border)" : "var(--color-accent)",
                color: isPending ? "var(--color-text-muted)" : "#000",
                border: "none",
                borderRadius: "var(--radius)",
                fontWeight: 700,
                fontSize: 13,
                cursor: isPending ? "not-allowed" : "pointer",
                alignSelf: "flex-start",
              }}
            >
              {isPending ? "Ukládám..." : "Uložit challenge"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PropDashboard({ challenges }: { challenges: ChallengeData[] }) {
  const active = challenges.filter((c) => c.status === "ACTIVE");
  const archived = challenges.filter((c) => c.status !== "ACTIVE");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <AddChallengeForm />

      {active.length === 0 && archived.length === 0 && (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "var(--color-text-muted)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 14,
          }}
        >
          Žádná aktivní challenge. Přidej svoji první.
        </div>
      )}

      {active.length > 0 && (
        <FadeUp delay={0.1}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 14, fontFamily: "var(--font-display)" }}>
              Aktivní
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {active.map((c, i) => (
                <ChallengeCard key={c.id} c={c} index={i} />
              ))}
            </div>
          </div>
        </FadeUp>
      )}

      {archived.length > 0 && (
        <FadeUp delay={0.2}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 14, fontFamily: "var(--font-display)" }}>
              Archiv
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: 0.65 }}>
              {archived.map((c, i) => (
                <ChallengeCard key={c.id} c={c} index={i} />
              ))}
            </div>
          </div>
        </FadeUp>
      )}
    </div>
  );
}
