export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import { CalendarView } from "@/components/ui/CalendarView";
import { PageWrapper, FadeUp } from "@/components/ui/PageWrapper";
import type { TradeWithRelations } from "@/lib/db/types";

export default async function CalendarPage() {
  const [trades, settings] = await Promise.all([getTrades(), getSettings()]);

  const tradeData = trades.map((t: TradeWithRelations) => ({
    id: t.id,
    symbol: t.symbol,
    direction: t.direction,
    realizedPnl: t.realizedPnl,
    rMultiple: t.rMultiple,
    entryTime: t.entryTime.toISOString(),
    exitTime: t.exitTime?.toISOString() ?? null,
    status: t.status,
  }));

  return (
    <PageWrapper>
      <FadeUp delay={0}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-display)" }}>Calendar</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>Kalendář profitů</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>Přehled výkonnosti po dnech</p>
        </div>
      </FadeUp>
      <FadeUp delay={0.15}>
        <CalendarView trades={tradeData} currency={settings.currency} />
      </FadeUp>
    </PageWrapper>
  );
}
