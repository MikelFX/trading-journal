export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import { PageWrapper, FadeUp, StaggerChildren, StaggerItem } from "@/components/ui/PageWrapper";
import type { TradeWithRelations } from "@/lib/db/types";
import Link from "next/link";

export default async function TradesPage() {
  const [trades, settings] = await Promise.all([getTrades(), getSettings()]);
  const currency = settings.currency;

  return (
    <PageWrapper>
      <FadeUp delay={0}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-display)" }}>
              Deník
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>Obchody</h1>
            <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>{trades.length} záznamů</p>
          </div>
          <Link
            href="/trades/new"
            style={{
              padding: "11px 24px",
              background: "linear-gradient(135deg, var(--color-accent), #0070ff)",
              color: "#000",
              borderRadius: "var(--radius)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,200,255,0.25)",
            }}
          >
            + Nový obchod
          </Link>
        </div>
      </FadeUp>

      <FadeUp delay={0.15}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {trades.length === 0 ? (
            <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
              Žádné obchody.{" "}
              <Link href="/trades/new" style={{ color: "var(--color-accent)", textDecoration: "none" }}>Přidat první →</Link>
            </div>
          ) : (
            <StaggerChildren>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(0,200,255,0.02)" }}>
                    {["Datum", "Symbol", "Směr", "Setup", "Vstup", "Výstup", "R", "P/L", "Emoce", ""].map((h) => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, color: "var(--color-text-muted)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t: TradeWithRelations) => (
                    <StaggerItem key={t.id}>
                      <tr className="tr-hover" style={{ borderBottom: "1px solid rgba(26,36,56,0.5)", display: "table-row" }}>
                        <td className="tabular" style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontSize: 12 }}>
                          {t.entryTime.toLocaleDateString("cs-CZ")}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>{t.symbol}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                            color: t.direction === "LONG" ? "var(--color-profit)" : "var(--color-loss)",
                            background: t.direction === "LONG" ? "var(--color-profit-dim)" : "var(--color-loss-dim)",
                            padding: "3px 7px", borderRadius: 4,
                          }}>
                            {t.direction}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--color-text-muted)" }}>
                          {t.setup ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              {t.setup.color && <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.setup.color, display: "inline-block", boxShadow: `0 0 6px ${t.setup.color}` }} />}
                              {t.setup.name}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="tabular" style={{ padding: "12px 16px", fontSize: 12 }}>{t.entryPrice.toFixed(5)}</td>
                        <td className="tabular" style={{ padding: "12px 16px", fontSize: 12, color: "var(--color-text-muted)" }}>{t.exitPrice?.toFixed(5) ?? "—"}</td>
                        <td className="tabular" style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: t.rMultiple !== null ? (t.rMultiple >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-text-muted)" }}>
                          {t.rMultiple !== null ? `${t.rMultiple >= 0 ? "+" : ""}${t.rMultiple.toFixed(2)}R` : "—"}
                        </td>
                        <td className="tabular" style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: t.realizedPnl !== null ? (t.realizedPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-text-muted)" }}>
                          {t.realizedPnl !== null ? `${t.realizedPnl >= 0 ? "+" : ""}${t.realizedPnl.toFixed(2)}` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--color-text-muted)" }}>{t.emotionState ?? "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <Link href={`/trades/${t.id}`} style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none" }}>→</Link>
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
