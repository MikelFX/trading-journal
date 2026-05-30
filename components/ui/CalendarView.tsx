"use client";

import { useState } from "react";
import Link from "next/link";

type TradeData = {
  id: string;
  symbol: string;
  direction: string;
  realizedPnl: number | null;
  rMultiple: number | null;
  entryTime: string;
  exitTime: string | null;
  status: string;
};

const DAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const MONTHS = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

function groupByDay(trades: TradeData[]): Map<string, TradeData[]> {
  const map = new Map<string, TradeData[]>();
  for (const t of trades) {
    const key = t.entryTime.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

function getDayColor(pnl: number, maxAbs: number): string {
  if (maxAbs === 0) return "var(--color-surface-2)";
  const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
  if (pnl > 0) {
    const alpha = 0.15 + intensity * 0.65;
    return `rgba(0, 214, 143, ${alpha})`;
  } else {
    const alpha = 0.15 + intensity * 0.65;
    return `rgba(255, 61, 113, ${alpha})`;
  }
}

export function CalendarView({ trades, currency }: { trades: TradeData[]; currency: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = groupByDay(trades);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();

  // Compute daily PnL and find max abs for color scaling
  const dailyPnl = new Map<string, number>();
  for (const [day, ts] of byDay) {
    if (!day.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) continue;
    const pnl = ts.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
    dailyPnl.set(day, pnl);
  }
  const maxAbs = Math.max(...Array.from(dailyPnl.values()).map(Math.abs), 1);

  // Weekly summaries
  const weeks: { pnl: number; trades: number; wins: number }[] = [];
  let weekPnl = 0, weekTrades = 0, weekWins = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTs = byDay.get(key) ?? [];
    weekPnl += dayTs.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
    weekTrades += dayTs.length;
    weekWins += dayTs.filter((t) => (t.realizedPnl ?? 0) > 0).length;
    const dow = (new Date(year, month, d).getDay() + 6) % 7;
    if (dow === 6 || d === daysInMonth) {
      weeks.push({ pnl: weekPnl, trades: weekTrades, wins: weekWins });
      weekPnl = 0; weekTrades = 0; weekWins = 0;
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const selectedTrades = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <button onClick={prevMonth} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-text)", padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>‹</button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, minWidth: 180, textAlign: "center" }}>
          {MONTHS[month]} {year}
        </h2>
        <button onClick={nextMonth} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-text)", padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>›</button>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {/* Calendar grid */}
        <div style={{ flex: 1 }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, padding: "4px 0", letterSpacing: "0.06em" }}>{d}</div>
            ))}
          </div>
          {/* Days */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {/* Empty cells */}
            {Array.from({ length: startDow }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayTs = byDay.get(key) ?? [];
              const pnl = dailyPnl.get(key);
              const color = pnl !== undefined ? getDayColor(pnl, maxAbs) : "var(--color-surface)";
              const isSelected = selectedDay === key;
              const isToday = key === now.toISOString().slice(0, 10);

              return (
                <div
                  key={key}
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  style={{
                    background: color,
                    border: `1px solid ${isSelected ? "var(--color-accent)" : isToday ? "var(--color-accent-dim)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius)",
                    padding: "8px 6px",
                    minHeight: 64,
                    cursor: dayTs.length > 0 ? "pointer" : "default",
                    position: "relative",
                    transition: "transform 0.1s ease",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "var(--color-accent)" : "var(--color-text-muted)", marginBottom: 4 }}>{day}</div>
                  {dayTs.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontFamily: "var(--font-display)", fontWeight: 700, color: (pnl ?? 0) >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                        {(pnl ?? 0) >= 0 ? "+" : ""}{(pnl ?? 0).toFixed(0)}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{dayTs.length} obchod{dayTs.length > 4 ? "ů" : dayTs.length > 1 ? "y" : ""}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly summaries */}
        <div style={{ width: 140, display: "flex", flexDirection: "column", gap: 4, marginTop: 24 }}>
          {weeks.map((w, i) => (
            <div key={i} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "8px 12px", minHeight: 64, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
              <div style={{ fontSize: 10, color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>TÝDEN {i + 1}</div>
              <div className="tabular" style={{ fontSize: 13, fontWeight: 700, color: w.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                {w.pnl >= 0 ? "+" : ""}{w.pnl.toFixed(0)} {currency}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{w.trades} obch. · {w.trades > 0 ? ((w.wins / w.trades) * 100).toFixed(0) : 0} %</div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day trades */}
      {selectedDay && selectedTrades.length > 0 && (
        <div style={{ marginTop: 20, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", fontSize: 13, fontWeight: 600 }}>
            {selectedDay} — {selectedTrades.length} obchod{selectedTrades.length > 4 ? "ů" : selectedTrades.length > 1 ? "y" : ""}
          </div>
          {selectedTrades.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 16px", borderBottom: "1px solid rgba(30,41,59,0.5)", fontSize: 13 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{t.symbol}</span>
              <span style={{ color: t.direction === "LONG" ? "var(--color-profit)" : "var(--color-loss)", fontSize: 11, fontWeight: 700 }}>{t.direction}</span>
              {t.rMultiple !== null && (
                <span className="tabular" style={{ color: t.rMultiple >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                  {t.rMultiple >= 0 ? "+" : ""}{t.rMultiple.toFixed(2)}R
                </span>
              )}
              {t.realizedPnl !== null && (
                <span className="tabular" style={{ color: t.realizedPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", marginLeft: "auto" }}>
                  {t.realizedPnl >= 0 ? "+" : ""}{t.realizedPnl.toFixed(2)} {currency}
                </span>
              )}
              <Link href={`/trades/${t.id}`} style={{ color: "var(--color-accent)", textDecoration: "none", fontSize: 12 }}>→</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
