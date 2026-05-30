export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import { computeCoreStats, computeSegmentStats, computeRuleCompliance } from "@/lib/stats/engine";
import { AiInsights } from "@/components/ui/AiInsights";
import type { TradeWithRelations } from "@/lib/db/types";

export default async function InsightsPage() {
  const [trades, settings] = await Promise.all([getTrades(), getSettings()]);

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
  const rules = computeRuleCompliance(statTrades);

  const contextJson = JSON.stringify({ stats, bySetup, rules, totalTrades: trades.length, currency: settings.currency }, null, 2);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>AI Insights</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
          Analýza tvého obchodování nad reálnými čísly
        </p>
      </div>

      {trades.length < 3 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
          Přidej alespoň 3 obchody pro smysluplnou analýzu.
        </div>
      ) : (
        <AiInsights contextJson={contextJson} />
      )}
    </div>
  );
}
