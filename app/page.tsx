export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import { computeCoreStats } from "@/lib/stats/engine";
import { KpiCard } from "@/components/ui/KpiCard";
import type { TradeWithRelations } from "@/lib/db/types";
import Link from "next/link";

export default async function DashboardPage() {
  const [trades, settings] = await Promise.all([getTrades(), getSettings()]);
  const currency = settings.currency;

  const statTrades = trades.map((t: TradeWithRelations) => ({
    id: t.id,
    realizedPnl: t.realizedPnl,
    rMultiple: t.rMultiple,
    riskAmount: t.riskAmount,
    entryTime: t.entryTime,
    exitTime: t.exitTime,
    status: t.status,
    setupId: t.setupId,
    tags: t.tags,
    session: t.session,
    entryTimeframe: t.entryTimeframe,
    symbol: t.symbol,
    followedRiskRule: t.followedRiskRule,
    followedRRTarget: t.followedRRTarget,
    withinDailyLimit: t.withinDailyLimit,
    movedStop: t.movedStop,
    mae: t.mae,
    mfe: t.mfe,
    emotionState: t.emotionState,
  }));

  const stats = computeCoreStats(statTrades);
  const recent = trades.slice(0, 5);

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
          {stats.totalTrades === 0 ? "Zatím žádné obchody." : `${stats.totalTrades} uzavřených obchodů`}
        </p>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        <KpiCard label="Net P/L" value={stats.netPnl} format="currency" currency={currency} />
        <KpiCard label="Win Rate" value={stats.winRate} format="percent" positive={stats.winRate >= 0.5} />
        <KpiCard label="Profit Factor" value={stats.profitFactor} format="ratio" positive={stats.profitFactor >= 1} />
        <KpiCard label="Expectancy (R)" value={stats.expectancy} format="ratio" positive={stats.expectancy > 0} />
        <KpiCard label="Max Drawdown" value={-stats.maxDrawdown} format="currency" currency={currency} positive={false} />
        <KpiCard
          label="Série výher / proher"
          value={stats.longestWinStreak}
          format="count"
          subtitle={`Max ztráty: ${stats.longestLossStreak}`}
        />
      </div>

      {/* Recent trades */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
            Poslední obchody
          </h2>
          <Link href="/trades" style={{ fontSize: 13, color: "var(--color-accent)", textDecoration: "none" }}>
            Zobrazit vše →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
            Žádné obchody.{" "}
            <Link href="/trades/new" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
              Přidat první →
            </Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Symbol", "Směr", "Setup", "Vstup", "R", "P/L"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500, letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((t: TradeWithRelations) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                    <Link href={`/trades/${t.id}`} style={{ color: "var(--color-text)", textDecoration: "none" }}>
                      {t.symbol}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: t.direction === "LONG" ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {t.direction}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontSize: 13 }}>
                    {t.setup?.name ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontFamily: "var(--font-display)", fontSize: 13 }}>
                    {t.entryTime.toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="tabular" style={{ padding: "12px 16px", color: t.rMultiple !== null ? (t.rMultiple >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-text-muted)" }}>
                    {t.rMultiple !== null ? `${t.rMultiple >= 0 ? "+" : ""}${t.rMultiple.toFixed(2)}R` : "—"}
                  </td>
                  <td className="tabular" style={{ padding: "12px 16px", color: t.realizedPnl !== null ? (t.realizedPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-text-muted)" }}>
                    {t.realizedPnl !== null
                      ? `${t.realizedPnl >= 0 ? "+" : ""}${t.realizedPnl.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} ${currency}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
