"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTrade, updateTrade } from "@/lib/actions/trades";
import type { TradeFormData } from "@/lib/schemas";

type Setup = { id: string; name: string; color: string | null };

type Props = {
  setups: Setup[];
  currency: string;
  initialData?: Partial<TradeFormData> & { id?: string };
};

const SESSIONS = ["ASIA", "LONDON", "NEWYORK"] as const;
const EMOTIONS = ["CALM", "FOMO", "REVENGE", "TILT", "UNCERTAIN"] as const;
const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "D", "W"] as const;

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <input
        {...props}
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          color: "var(--color-text)",
          padding: "9px 12px",
          fontSize: 14,
          fontFamily: "var(--font-display)",
          outline: "none",
          width: "100%",
          ...props.style,
        }}
      />
    </label>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <select
        {...props}
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          color: "var(--color-text)",
          padding: "9px 12px",
          fontSize: 14,
          outline: "none",
          width: "100%",
          cursor: "pointer",
        }}
      >
        {children}
      </select>
    </label>
  );
}

export function TradeForm({ setups, currency, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const now = new Date().toISOString().slice(0, 16);

  const [form, setForm] = useState({
    symbol: initialData?.symbol ?? "",
    direction: initialData?.direction ?? "LONG",
    status: initialData?.status ?? "CLOSED",
    entryPrice: initialData?.entryPrice?.toString() ?? "",
    exitPrice: initialData?.exitPrice?.toString() ?? "",
    stopLoss: initialData?.stopLoss?.toString() ?? "",
    takeProfit: initialData?.takeProfit?.toString() ?? "",
    positionSize: initialData?.positionSize?.toString() ?? "",
    entryTime: initialData?.entryTime?.slice(0, 16) ?? now,
    exitTime: initialData?.exitTime?.slice(0, 16) ?? "",
    riskAmount: initialData?.riskAmount?.toString() ?? "",
    riskPercent: initialData?.riskPercent?.toString() ?? "",
    fees: initialData?.fees?.toString() ?? "0",
    setupId: initialData?.setupId ?? "",
    tags: initialData?.tags?.join(", ") ?? "",
    entryTimeframe: initialData?.entryTimeframe ?? "",
    session: initialData?.session ?? "",
    mae: initialData?.mae?.toString() ?? "",
    mfe: initialData?.mfe?.toString() ?? "",
    movedStop: initialData?.movedStop ?? false,
    emotionState: initialData?.emotionState ?? "",
    notes: initialData?.notes ?? "",
  });

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: TradeFormData = {
      symbol: form.symbol,
      direction: form.direction as "LONG" | "SHORT",
      status: form.status as "OPEN" | "CLOSED" | "CANCELLED",
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : undefined,
      stopLoss: parseFloat(form.stopLoss),
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : undefined,
      positionSize: parseFloat(form.positionSize),
      entryTime: new Date(form.entryTime).toISOString(),
      exitTime: form.exitTime ? new Date(form.exitTime).toISOString() : undefined,
      riskAmount: parseFloat(form.riskAmount),
      riskPercent: form.riskPercent ? parseFloat(form.riskPercent) : undefined,
      fees: parseFloat(form.fees) || 0,
      setupId: form.setupId || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      entryTimeframe: form.entryTimeframe || undefined,
      session: (form.session as "ASIA" | "LONDON" | "NEWYORK") || undefined,
      mae: form.mae ? parseFloat(form.mae) : undefined,
      mfe: form.mfe ? parseFloat(form.mfe) : undefined,
      movedStop: form.movedStop,
      emotionState: (form.emotionState as "CALM" | "FOMO" | "REVENGE" | "TILT" | "UNCERTAIN") || undefined,
      notes: form.notes || undefined,
    };

    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updateTrade(initialData.id, payload);
          router.push(`/trades/${initialData.id}`);
        } else {
          const result = await createTrade(payload);
          router.push(`/trades/${result.tradeId}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chyba při ukládání");
      }
    });
  }

  const fieldStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {error && (
        <div style={{ background: "var(--color-loss-dim)", border: "1px solid var(--color-loss)", borderRadius: "var(--radius)", padding: "12px 16px", color: "var(--color-loss)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Základní info */}
      <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 16 }}>
          Identifikace
        </h2>
        <div style={fieldStyle}>
          <Input label="Symbol" value={form.symbol} onChange={(e) => set("symbol", e.target.value)} placeholder="EURUSD" required />
          <Select label="Směr" value={form.direction} onChange={(e) => set("direction", e.target.value)}>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="CLOSED">CLOSED</option>
            <option value="OPEN">OPEN</option>
            <option value="CANCELLED">CANCELLED</option>
          </Select>
          <Select label="Setup" value={form.setupId} onChange={(e) => set("setupId", e.target.value)}>
            <option value="">— žádný —</option>
            {setups.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
      </section>

      {/* Exekuce */}
      <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 16 }}>
          Exekuce
        </h2>
        <div style={fieldStyle}>
          <Input label="Vstupní cena" type="number" step="any" value={form.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} required />
          <Input label="Výstupní cena" type="number" step="any" value={form.exitPrice} onChange={(e) => set("exitPrice", e.target.value)} />
          <Input label="Stop Loss" type="number" step="any" value={form.stopLoss} onChange={(e) => set("stopLoss", e.target.value)} required />
          <Input label="Take Profit" type="number" step="any" value={form.takeProfit} onChange={(e) => set("takeProfit", e.target.value)} />
          <Input label="Velikost pozice" type="number" step="any" value={form.positionSize} onChange={(e) => set("positionSize", e.target.value)} required />
          <Input label={`Fees (${currency})`} type="number" step="any" value={form.fees} onChange={(e) => set("fees", e.target.value)} />
          <Input label="Datum vstupu" type="datetime-local" value={form.entryTime} onChange={(e) => set("entryTime", e.target.value)} required />
          <Input label="Datum výstupu" type="datetime-local" value={form.exitTime} onChange={(e) => set("exitTime", e.target.value)} />
        </div>
      </section>

      {/* Risk */}
      <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 16 }}>
          Risk
        </h2>
        <div style={fieldStyle}>
          <Input label={`Riskovaná částka (${currency})`} type="number" step="any" value={form.riskAmount} onChange={(e) => set("riskAmount", e.target.value)} required />
          <Input label="Risk % z účtu" type="number" step="any" value={form.riskPercent} onChange={(e) => set("riskPercent", e.target.value)} />
          <Input label="MAE (v R)" type="number" step="any" value={form.mae} onChange={(e) => set("mae", e.target.value)} />
          <Input label="MFE (v R)" type="number" step="any" value={form.mfe} onChange={(e) => set("mfe", e.target.value)} />
        </div>
      </section>

      {/* Kontext */}
      <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 16 }}>
          Kontext
        </h2>
        <div style={fieldStyle}>
          <Select label="Session" value={form.session} onChange={(e) => set("session", e.target.value)}>
            <option value="">— žádná —</option>
            {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Timeframe" value={form.entryTimeframe} onChange={(e) => set("entryTimeframe", e.target.value)}>
            <option value="">— žádný —</option>
            {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Emoce" value={form.emotionState} onChange={(e) => set("emotionState", e.target.value)}>
            <option value="">— neuvedeno —</option>
            {EMOTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Input label="Tagy (čárkou oddělené)" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="trend, breakout, news" />
        </div>

        {/* Checkboxy */}
        <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-muted)" }}>
            <input type="checkbox" checked={form.movedStop} onChange={(e) => set("movedStop", e.target.checked)} />
            Posunoval jsem SL
          </label>
        </div>

        {/* Notes */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Poznámky</span>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={4}
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                color: "var(--color-text)",
                padding: "9px 12px",
                fontSize: 14,
                outline: "none",
                width: "100%",
                resize: "vertical",
              }}
            />
          </label>
        </div>
      </section>

      {/* Submit */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "12px 32px",
            background: isPending ? "var(--color-border)" : "var(--color-accent)",
            color: "var(--color-bg)",
            borderRadius: "var(--radius)",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Ukládám..." : initialData?.id ? "Uložit změny" : "Uložit obchod"}
        </button>
      </div>
    </form>
  );
}
