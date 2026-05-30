export const dynamic = "force-dynamic";

import { getPropChallenges } from "@/lib/actions/propChallenge";
import { PageWrapper, FadeUp } from "@/components/ui/PageWrapper";
import { PropDashboard } from "@/components/ui/PropDashboard";

export default async function PropPage() {
  const challenges = await getPropChallenges();

  const challengeData = challenges.map((c) => {
    const closedTrades = c.trades.filter((t) => t.realizedPnl !== null);
    const totalPnl = closedTrades.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPnl = closedTrades
      .filter((t) => {
        const d = new Date(t.exitTime ?? t.entryTime);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      })
      .reduce((s, t) => s + (t.realizedPnl ?? 0), 0);

    const tradingDays = new Set(
      closedTrades.map((t) => {
        const d = new Date(t.exitTime ?? t.entryTime);
        return d.toISOString().slice(0, 10);
      })
    ).size;

    let maxDrawdown = 0;
    let peak = 0;
    let running = 0;
    for (const t of closedTrades) {
      running += t.realizedPnl ?? 0;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    return {
      id: c.id,
      firmName: c.firmName,
      phase: c.phase,
      accountSize: c.accountSize,
      dailyLossLimit: c.dailyLossLimit,
      maxLossLimit: c.maxLossLimit,
      profitTarget: c.profitTarget ?? null,
      minTradingDays: c.minTradingDays ?? null,
      startDate: c.startDate.toISOString(),
      status: c.status as "ACTIVE" | "PASSED" | "FAILED",
      totalPnl,
      todayPnl,
      maxDrawdown,
      tradingDays,
    };
  });

  return (
    <PageWrapper>
      <FadeUp delay={0}>
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.15em",
              color: "var(--color-accent)",
              textTransform: "uppercase",
              marginBottom: 8,
              fontFamily: "var(--font-display)",
            }}
          >
            Elite
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>
            Prop-firm
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
            Real-time tracking challenge pravidel — alerty před prasknutím limitu
          </p>
        </div>
      </FadeUp>

      <PropDashboard challenges={challengeData} />
    </PageWrapper>
  );
}
