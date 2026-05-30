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
            {trade.symbol}{" "}
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

      {/* AI Note */}
      {trade.aiNote && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid rgba(0,200,255,0.2)",
          borderRadius: "var(--radius-lg)",
          padding: 20,
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--color-accent), transparent)" }} />
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 10, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: 6 }}>
            <span>✦</span> AI Poznámka — Haiku
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--color-text)" }}>{trade.aiNote}</p>
        </div>
      )}
      {!trade.aiNote && trade.status === "CLOSED" && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          color: "var(--color-text-muted)",
        }}>
          <span style={{ animation: "spin 2s linear infinite", display: "inline-block" }}>◌</span>
          AI poznámka se generuje na pozadí...
        </div>
      )}

      <TradeForm setups={setups} currency={settings.currency} initialData={initialData} />
    </div>
  );
}
