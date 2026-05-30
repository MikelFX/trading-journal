export const dynamic = "force-dynamic";

import { getTradeById } from "@/lib/actions/trades";
import { getSetups } from "@/lib/actions/setups";
import { getSettings } from "@/lib/actions/settings";
import { TradeForm } from "@/components/ui/TradeForm";
import { DeleteTradeButton } from "@/components/ui/DeleteTradeButton";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trade, setups, settings] = await Promise.all([getTradeById(id), getSetups(), getSettings()]);

  if (!trade) notFound();

  const initialData = {
    id: trade.id,
    symbol: trade.symbol,
    direction: trade.direction as "LONG" | "SHORT",
    status: trade.status as "OPEN" | "CLOSED" | "CANCELLED",
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice ?? undefined,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit ?? undefined,
    positionSize: trade.positionSize,
    entryTime: trade.entryTime.toISOString(),
    exitTime: trade.exitTime?.toISOString(),
    riskAmount: trade.riskAmount,
    riskPercent: trade.riskPercent ?? undefined,
    fees: trade.fees,
    setupId: trade.setupId ?? undefined,
    tags: trade.tags,
    entryTimeframe: trade.entryTimeframe ?? undefined,
    session: trade.session ?? undefined,
    mae: trade.mae ?? undefined,
    mfe: trade.mfe ?? undefined,
    movedStop: trade.movedStop,
    emotionState: trade.emotionState ?? undefined,
    notes: trade.notes ?? undefined,
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>
            <Link href="/trades" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Obchody</Link>
            {" / "}{trade.symbol}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>
            {trade.symbol}
            {" "}
            <span style={{ color: trade.direction === "LONG" ? "var(--color-profit)" : "var(--color-loss)", fontSize: 16 }}>
              {trade.direction}
            </span>
          </h1>
          <div style={{ marginTop: 6, display: "flex", gap: 16, fontSize: 13, color: "var(--color-text-muted)" }}>
            {trade.rMultiple !== null && (
              <span className="tabular" style={{ color: trade.rMultiple >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 700 }}>
                {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
              </span>
            )}
            {trade.realizedPnl !== null && (
              <span className="tabular" style={{ color: trade.realizedPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                {trade.realizedPnl >= 0 ? "+" : ""}{trade.realizedPnl.toFixed(2)} {settings.currency}
              </span>
            )}
          </div>
        </div>
        <DeleteTradeButton id={trade.id} />
      </div>

      <TradeForm setups={setups} currency={settings.currency} initialData={initialData} />
    </div>
  );
}
