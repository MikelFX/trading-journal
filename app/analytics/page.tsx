export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import { computeCoreStats, computeSegmentStats, computeRuleCompliance } from "@/lib/stats/engine";
import type { TradeWithRelations } from "@/lib/db/types";

export default async function AnalyticsPage() {
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
  const bySetup = computeSegmentStats(statTrades, (t) => t.setupId ? trades.find((tr: TradeWithRelations) => tr.id === t.id)?.setup?.name ?? t.setupId : null);
  const bySession = computeSegmentStats(statTrades, (t) => t.session);
  const bySymbol = computeSegmentStats(statTrades, (t) => t.symbol);
  const rules = computeRuleCompliance(statTrades);

  function pct(n: number) { return `${(n * 100).toFixed(1)} %`; }
  function r(n: number) { return n.toFixed(2); }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>Analytika</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
          Breakdowny, distribuce a dodržování pravidel
        </p>
      </div>

      {stats.totalTrades === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
          Zatím žádná data k analýze.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* R-distribution */}
          <Section title="R-multiple distribuce">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, padding: "0 4px" }}>
              {stats.rMultipleDistribution.map(({ bucket, count }) => {
                const max = Math.max(...stats.rMultipleDistribution.map((b) => b.count));
                const h = (count / max) * 100;
                const pos = parseFloat(bucket) >= 0;
                return (
                  <div key={bucket} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                    <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{count}</span>
                    <div style={{ width: "100%", height: `${h}%`, background: pos ? "var(--color-profit)" : "var(--color-loss)", borderRadius: "3px 3px 0 0", opacity: 0.8 }} />
                    <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>{bucket}R</span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Segmenty podle setupu */}
          <SegmentTable title="Výkon podle setupu" segments={bySetup} currency={currency} />
          <SegmentTable title="Výkon podle session" segments={bySession} currency={currency} />
          <SegmentTable title="Výkon podle symbolu" segments={bySymbol} currency={currency} />

          {/* Dodržování pravidel */}
          <Section title="Dodržování pravidel">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Pravidlo", "Dodrženo", "Celkem", "Míra", "P/L při dodržení", "P/L při porušení"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500, letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.rule} style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>{rule.rule}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13 }}>{rule.followed}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--color-text-muted)" }}>{rule.total}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: rule.rate >= 0.7 ? "var(--color-profit)" : rule.rate >= 0.5 ? "var(--color-accent)" : "var(--color-loss)" }}>
                        {pct(rule.rate)}
                      </span>
                    </td>
                    <td className="tabular" style={{ padding: "10px 12px", fontSize: 13, color: rule.pnlWhenFollowed >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {rule.pnlWhenFollowed >= 0 ? "+" : ""}{rule.pnlWhenFollowed.toFixed(2)} {currency}
                    </td>
                    <td className="tabular" style={{ padding: "10px 12px", fontSize: 13, color: rule.pnlWhenBroken >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {rule.total - rule.followed > 0 ? `${rule.pnlWhenBroken >= 0 ? "+" : ""}${rule.pnlWhenBroken.toFixed(2)} ${currency}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* MAE/MFE */}
          {(stats.avgMae !== null || stats.avgMfe !== null) && (
            <Section title="MAE / MFE průměry">
              <div style={{ display: "flex", gap: 32 }}>
                {stats.avgMae !== null && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Průměrné MAE</div>
                    <div className="tabular" style={{ fontSize: 24, fontWeight: 700, color: "var(--color-loss)" }}>{r(stats.avgMae)}R</div>
                  </div>
                )}
                {stats.avgMfe !== null && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Průměrné MFE</div>
                    <div className="tabular" style={{ fontSize: 24, fontWeight: 700, color: "var(--color-profit)" }}>{r(stats.avgMfe)}R</div>
                  </div>
                )}
              </div>
            </Section>
          )}

        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)" }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>{title}</h2>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </section>
  );
}

function SegmentTable({ title, segments, currency }: { title: string; segments: { label: string; trades: number; winRate: number; expectancy: number; netPnl: number }[]; currency: string }) {
  return (
    <Section title={title}>
      {segments.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Žádná data.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["Segment", "Obchodů", "Win Rate", "Expectancy (R)", "Net P/L"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500, letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {segments.sort((a, b) => b.netPnl - a.netPnl).map((s) => (
              <tr key={s.label} style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>{s.label}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--color-text-muted)" }}>{s.trades}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span className="tabular" style={{ fontSize: 13, color: s.winRate >= 0.5 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {(s.winRate * 100).toFixed(1)} %
                  </span>
                </td>
                <td className="tabular" style={{ padding: "10px 12px", fontSize: 13, color: s.expectancy > 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                  {s.expectancy >= 0 ? "+" : ""}{s.expectancy.toFixed(2)}R
                </td>
                <td className="tabular" style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: s.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                  {s.netPnl >= 0 ? "+" : ""}{s.netPnl.toFixed(2)} {currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
