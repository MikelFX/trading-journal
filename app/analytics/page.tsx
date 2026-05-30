export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import { computeCoreStats, computeSegmentStats, computeRuleCompliance } from "@/lib/stats/engine";
import { PageWrapper, FadeUp, BlurReveal, StaggerChildren, StaggerItem } from "@/components/ui/PageWrapper";
import { EquityChart } from "@/components/ui/EquityChart";
import { MaeMfeScatter } from "@/components/ui/MaeMfeScatter";
import type { TradeWithRelations } from "@/lib/db/types";

export default async function AnalyticsPage() {
  const [trades, settings] = await Promise.all([getTrades(), getSettings()]);
  const currency = settings.currency;

  const statTrades = trades.map((t: TradeWithRelations) => ({
    id: t.id, realizedPnl: t.realizedPnl, rMultiple: t.rMultiple, riskAmount: t.riskAmount,
    entryTime: t.entryTime, exitTime: t.exitTime, status: t.status, setupId: t.setupId,
    tags: t.tags, session: t.session, entryTimeframe: t.entryTimeframe, symbol: t.symbol,
    followedRiskRule: t.followedRiskRule, followedRRTarget: t.followedRRTarget,
    withinDailyLimit: t.withinDailyLimit, movedStop: t.movedStop,
    mae: t.mae, mfe: t.mfe, emotionState: t.emotionState,
  }));

  const stats = computeCoreStats(statTrades);
  const bySetup = computeSegmentStats(statTrades, (t) => t.setupId ? trades.find((tr: TradeWithRelations) => tr.id === t.id)?.setup?.name ?? t.setupId : null);
  const bySession = computeSegmentStats(statTrades, (t) => t.session);
  const bySymbol = computeSegmentStats(statTrades, (t) => t.symbol);
  const byDayOfWeek = computeSegmentStats(statTrades, (t) => {
    const days = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    return days[new Date(t.entryTime).getDay()];
  });
  const rules = computeRuleCompliance(statTrades);

  const scatterPoints = statTrades
    .filter((t) => t.mae !== null && t.mfe !== null && t.status === "CLOSED")
    .map((t) => ({
      mae: t.mae as number,
      mfe: t.mfe as number,
      rMultiple: t.rMultiple ?? 0,
      symbol: t.symbol,
      id: t.id,
    }));

  return (
    <PageWrapper>
      <FadeUp delay={0}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-display)" }}>Analytics</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>Analytika</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>Breakdowny, distribuce a dodržování pravidel</p>
        </div>
      </FadeUp>

      {stats.totalTrades === 0 ? (
        <BlurReveal delay={0.2}>
          <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            Zatím žádná data k analýze.
          </div>
        </BlurReveal>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Equity curve */}
          <BlurReveal delay={0.05}>
            <Section title="Equity křivka">
              <EquityChart data={stats.equityCurve} height={300} />
            </Section>
          </BlurReveal>

          {/* R-distribution */}
          <BlurReveal delay={0.1}>
            <Section title="R-multiple distribuce">
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, padding: "0 4px" }}>
                {stats.rMultipleDistribution.map(({ bucket, count }, i) => {
                  const max = Math.max(...stats.rMultipleDistribution.map((b) => b.count));
                  const h = (count / max) * 100;
                  const pos = parseFloat(bucket) >= 0;
                  return (
                    <div key={bucket} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>{count}</span>
                      <div
                        style={{
                          width: "100%",
                          height: `${h}%`,
                          background: pos
                            ? "linear-gradient(180deg, var(--color-profit), rgba(0,229,160,0.4))"
                            : "linear-gradient(180deg, var(--color-loss), rgba(255,77,109,0.4))",
                          borderRadius: "4px 4px 0 0",
                          boxShadow: pos ? "0 0 10px var(--color-profit-glow)" : "0 0 10px var(--color-loss-glow)",
                          transition: `height 0.6s ease ${i * 0.04}s`,
                        }}
                      />
                      <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>{bucket}R</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          </BlurReveal>

          {/* MAE/MFE scatter */}
          {scatterPoints.length > 0 && (
            <BlurReveal delay={0.15}>
              <Section title="MAE / MFE Scatter">
                <MaeMfeScatter points={scatterPoints} />
              </Section>
            </BlurReveal>
          )}

          {/* Segment tables */}
          {[
            { title: "Výkon podle setupu", data: bySetup },
            { title: "Výkon podle session", data: bySession },
            { title: "Výkon podle symbolu", data: bySymbol },
            { title: "Výkon podle dne v týdnu", data: byDayOfWeek },
          ].map(({ title, data }, i) => (
            <BlurReveal key={title} delay={0.2 + i * 0.07}>
              <SegmentTable title={title} segments={data} currency={currency} />
            </BlurReveal>
          ))}

          {/* Rules compliance */}
          <BlurReveal delay={0.5}>
            <Section title="Dodržování pravidel">
              <StaggerChildren>
                {rules.map((rule) => (
                  <StaggerItem key={rule.rule}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 80px 1fr 1fr", gap: 0, padding: "11px 0", borderBottom: "1px solid rgba(26,36,56,0.5)", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{rule.rule}</span>
                      <span style={{ fontSize: 13 }}>{rule.followed}</span>
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{rule.total}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: rule.rate >= 0.7 ? "var(--color-profit)" : rule.rate >= 0.5 ? "var(--color-accent)" : "var(--color-loss)" }}>
                        {(rule.rate * 100).toFixed(1)} %
                      </span>
                      <span className="tabular" style={{ fontSize: 13, color: rule.pnlWhenFollowed >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                        {rule.pnlWhenFollowed >= 0 ? "+" : ""}{rule.pnlWhenFollowed.toFixed(2)} {currency}
                      </span>
                      <span className="tabular" style={{ fontSize: 13, color: rule.pnlWhenBroken >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                        {rule.total - rule.followed > 0 ? `${rule.pnlWhenBroken >= 0 ? "+" : ""}${rule.pnlWhenBroken.toFixed(2)} ${currency}` : "—"}
                      </span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerChildren>
            </Section>
          </BlurReveal>

          {/* MAE/MFE averages */}
          {(stats.avgMae !== null || stats.avgMfe !== null) && (
            <BlurReveal delay={0.6}>
              <Section title="MAE / MFE průměry">
                <div style={{ display: "flex", gap: 48 }}>
                  {stats.avgMae !== null && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>Průměrné MAE</div>
                      <div className="tabular" style={{ fontSize: 32, fontWeight: 700, color: "var(--color-loss)", textShadow: "0 0 20px var(--color-loss-glow)" }}>{stats.avgMae.toFixed(2)}R</div>
                    </div>
                  )}
                  {stats.avgMfe !== null && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>Průměrné MFE</div>
                      <div className="tabular" style={{ fontSize: 32, fontWeight: 700, color: "var(--color-profit)", textShadow: "0 0 20px var(--color-profit-glow)" }}>{stats.avgMfe.toFixed(2)}R</div>
                    </div>
                  )}
                </div>
              </Section>
            </BlurReveal>
          )}
        </div>
      )}
    </PageWrapper>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--color-border)", background: "rgba(0,200,255,0.02)" }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>{title}</h2>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </section>
  );
}

function SegmentTable({ title, segments, currency }: { title: string; segments: { label: string; trades: number; winRate: number; expectancy: number; netPnl: number }[]; currency: string }) {
  return (
    <Section title={title}>
      {segments.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Žádná data.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Segment", "Obchodů", "Win Rate", "Expectancy", "Net P/L"].map((h) => (
                  <th key={h} style={{ padding: "8px 0", textAlign: "left", fontSize: 10, color: "var(--color-text-muted)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {segments.sort((a, b) => b.netPnl - a.netPnl).map((s) => (
                <tr key={s.label} className="tr-hover" style={{ borderBottom: "1px solid rgba(26,36,56,0.5)" }}>
                  <td style={{ padding: "10px 0", fontWeight: 600, fontSize: 13 }}>{s.label}</td>
                  <td style={{ padding: "10px 0", fontSize: 13, color: "var(--color-text-muted)" }}>{s.trades}</td>
                  <td style={{ padding: "10px 0" }}>
                    <span className="tabular" style={{ fontSize: 13, color: s.winRate >= 0.5 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {(s.winRate * 100).toFixed(1)} %
                    </span>
                  </td>
                  <td className="tabular" style={{ padding: "10px 0", fontSize: 13, color: s.expectancy > 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {s.expectancy >= 0 ? "+" : ""}{s.expectancy.toFixed(2)}R
                  </td>
                  <td className="tabular" style={{ padding: "10px 0", fontSize: 13, fontWeight: 600, color: s.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {s.netPnl >= 0 ? "+" : ""}{s.netPnl.toFixed(2)} {currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
