export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import { computeCoreStats } from "@/lib/stats/engine";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageWrapper, FadeUp, StaggerChildren, StaggerItem } from "@/components/ui/PageWrapper";
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
  const recent = trades.slice(0, 6);

  return (
    <PageWrapper>
      {/* Header */}
      <FadeUp delay={0}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-display)" }}>
            Overview
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "0.03em" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
            {stats.totalTrades === 0 ? "Zatím žádné obchody." : `${stats.totalTrades} uzavřených obchodů · aktualizováno právě teď`}
          </p>
        </div>
      </FadeUp>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16, marginBottom: 36 }}>
        <KpiCard index={0} label="Net P/L" value={stats.netPnl} format="currency" currency={currency} />
        <KpiCard index={1} label="Win Rate" value={stats.winRate} format="percent" positive={stats.winRate >= 0.5} />
        <KpiCard index={2} label="Profit Factor" value={stats.profitFactor} format="ratio" positive={stats.profitFactor >= 1} />
        <KpiCard index={3} label="Expectancy (R)" value={stats.expectancy} format="ratio" positive={stats.expectancy > 0} />
        <KpiCard index={4} label="Max Drawdown" value={-stats.maxDrawdown} format="currency" currency={currency} positive={false} />
        <KpiCard index={5} label="Win Streak" value={stats.longestWinStreak} format="count" subtitle={`Nejdelší série proher: ${stats.longestLossStreak}`} />
      </div>

      {/* Recent trades */}
      <FadeUp delay={0.4}>
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,200,255,0.02)",
          }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Poslední obchody
            </h2>
            <Link href="/trades" style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none", letterSpacing: "0.05em" }}>
              Zobrazit vše →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
              Žádné obchody.{" "}
              <Link href="/trades/new" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
                Přidat první →
              </Link>
            </div>
          ) : (
            <StaggerChildren>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Symbol", "Směr", "Setup", "Vstup", "R", "P/L"].map((h) => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t: TradeWithRelations) => (
                    <StaggerItem key={t.id}>
                      <tr
                        className="tr-hover"
                        style={{ borderBottom: "1px solid rgba(26,36,56,0.6)", display: "table-row" }}
                      >
                        <td style={{ padding: "13px 20px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
                          <Link href={`/trades/${t.id}`} style={{ color: "var(--color-text)", textDecoration: "none" }}>
                            {t.symbol}
                          </Link>
                        </td>
                        <td style={{ padding: "13px 20px" }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: t.direction === "LONG" ? "var(--color-profit)" : "var(--color-loss)",
                            background: t.direction === "LONG" ? "var(--color-profit-dim)" : "var(--color-loss-dim)",
                            padding: "3px 8px",
                            borderRadius: 4,
                          }}>
                            {t.direction}
                          </span>
                        </td>
                        <td style={{ padding: "13px 20px", color: "var(--color-text-muted)", fontSize: 13 }}>
                          {t.setup?.name ?? "—"}
                        </td>
                        <td style={{ padding: "13px 20px", color: "var(--color-text-muted)", fontFamily: "var(--font-display)", fontSize: 12 }}>
                          {t.entryTime.toLocaleDateString("cs-CZ")}
                        </td>
                        <td className="tabular" style={{ padding: "13px 20px", fontWeight: 600, color: t.rMultiple !== null ? (t.rMultiple >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-text-muted)" }}>
                          {t.rMultiple !== null ? `${t.rMultiple >= 0 ? "+" : ""}${t.rMultiple.toFixed(2)}R` : "—"}
                        </td>
                        <td className="tabular" style={{ padding: "13px 20px", fontWeight: 600, color: t.realizedPnl !== null ? (t.realizedPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-text-muted)" }}>
                          {t.realizedPnl !== null
                            ? `${t.realizedPnl >= 0 ? "+" : ""}${t.realizedPnl.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} ${currency}`
                            : "—"}
                        </td>
                      </tr>
                    </StaggerItem>
                  ))}
                </tbody>
              </table>
            </StaggerChildren>
          )}
        </div>
      </FadeUp>
    </PageWrapper>
  );
}
