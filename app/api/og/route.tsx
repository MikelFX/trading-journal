export const runtime = "nodejs";

import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db/client";
import { computeCoreStats } from "@/lib/stats/engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "stats";

  const trades = await prisma.trade.findMany({
    where: { userId: "local", status: "CLOSED" },
    select: {
      id: true, realizedPnl: true, rMultiple: true, riskAmount: true,
      entryTime: true, exitTime: true, status: true, setupId: true,
      tags: true, session: true, entryTimeframe: true, symbol: true,
      followedRiskRule: true, followedRRTarget: true, withinDailyLimit: true,
      movedStop: true, mae: true, mfe: true, emotionState: true,
    },
  });

  const stats = computeCoreStats(
    trades.map((t) => ({
      ...t,
      entryTime: new Date(t.entryTime),
      exitTime: t.exitTime ? new Date(t.exitTime) : null,
      session: t.session as string | null,
      emotionState: t.emotionState as string | null,
    }))
  );

  const pnlColor = stats.netPnl >= 0 ? "#00e5a0" : "#ff4d6d";
  const pfColor = stats.profitFactor >= 1 ? "#00e5a0" : "#ff4d6d";

  const fmt = (v: number, decimals = 2) =>
    (v >= 0 ? "+" : "") + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#060a12",
          display: "flex",
          flexDirection: "column",
          padding: "48px 56px",
          fontFamily: "monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Top glow */}
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 300,
          background: "radial-gradient(ellipse, rgba(0,200,255,0.08) 0%, transparent 70%)",
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#00c8ff", textTransform: "uppercase" }}>
              TRADING
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.05em" }}>
              Journal
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{ fontSize: 11, color: "#4a6080", letterSpacing: "0.1em" }}>
              {stats.totalTrades} TRADES
            </div>
            <div style={{ fontSize: 11, color: "#253450", letterSpacing: "0.06em" }}>
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Main KPI row */}
        <div style={{ display: "flex", gap: 24, marginBottom: 32, position: "relative" }}>
          {[
            { label: "Net P/L", value: fmt(stats.netPnl), color: pnlColor },
            { label: "Win Rate", value: (stats.winRate * 100).toFixed(1) + "%", color: stats.winRate >= 0.5 ? "#00e5a0" : "#ff4d6d" },
            { label: "Profit Factor", value: stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2), color: pfColor },
            { label: "Expectancy", value: (stats.expectancy >= 0 ? "+" : "") + stats.expectancy.toFixed(2) + "R", color: stats.expectancy > 0 ? "#00e5a0" : "#ff4d6d" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: "rgba(10,16,32,0.8)",
                border: "1px solid #1a2438",
                borderRadius: 12,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 10, color: "#4a6080", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color, letterSpacing: "0.02em" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div style={{ display: "flex", gap: 32, position: "relative" }}>
          {[
            { label: "Max Drawdown", value: "-" + stats.maxDrawdown.toFixed(2), color: "#ff4d6d" },
            { label: "Best Win", value: fmt(stats.biggestWin), color: "#00e5a0" },
            { label: "Win Streak", value: stats.longestWinStreak.toString(), color: "#00c8ff" },
            { label: "Loss Streak", value: stats.longestLossStreak.toString(), color: "#ff4d6d" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 10, color: "#4a6080", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Watermark */}
        <div style={{
          position: "absolute", bottom: 28, right: 56,
          fontSize: 10, color: "#1a2438", letterSpacing: "0.15em", textTransform: "uppercase",
        }}>
          trading-journal.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
