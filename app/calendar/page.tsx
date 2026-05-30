export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import { CalendarView } from "@/components/ui/CalendarView";
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
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>Kalendář profitů</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
          Přehled výkonnosti po dnech
        </p>
      </div>
      <CalendarView trades={tradeData} currency={settings.currency} />
    </div>
  );
}
