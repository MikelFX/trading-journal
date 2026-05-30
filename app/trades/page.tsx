export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions/trades";
import { getSettings } from "@/lib/actions/settings";
import type { TradeWithRelations } from "@/lib/db/types";
import Link from "next/link";

export default async function TradesPage() {
  const [trades, settings] = await Promise.all([getTrades(), getSettings()]);
  const currency = settings.currency;

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>Obchody</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
            {trades.length} záznamů
          </p>
        </div>
        <Link
          href="/trades/new"
          style={{
            padding: "10px 20px",
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            borderRadius: "var(--radius)",
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          + Nový obchod
        </Link>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {trades.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
            Žádné obchody.{" "}
            <Link href="/trades/new" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
              Přidat první →
            </Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Datum", "Symbol", "Směr", "Setup", "Velikost", "Vstup", "Výstup", "R", "P/L", "Emoce", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t: TradeWithRelations) => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                  <td className="tabular" style={{ padding: "11px 14px", color: "var(--color-text-muted)", fontSize: 12 }}>
                    {t.entryTime.toLocaleDateString("cs-CZ")}
                  </td>
                  <td style={{ padding: "11px 14px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
                    {t.symbol}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.direction === "LONG" ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {t.direction}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--color-text-muted)" }}>
                    {t.setup ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {t.setup.color && (
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.setup.color, display: "inline-block" }} />
                        )}
                        {t.setup.name}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="tabular" style={{ padding: "11px 14px", fontSize: 12, color: "var(--color-text-muted)" }}>
                    {t.positionSize}
                  </td>
                  <td className="tabular" style={{ padding: "11px 14px", fontSize: 12 }}>
                    {t.entryPrice.toFixed(5)}
                  </td>
                  <td className="tabular" style={{ padding: "11px 14px", fontSize: 12, color: "var(--color-text-muted)" }}>
                    {t.exitPrice?.toFixed(5) ?? "—"}
                  </td>
                  <td className="tabular" style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: t.rMultiple !== null ? (t.rMultiple >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-text-muted)" }}>
                    {t.rMultiple !== null ? `${t.rMultiple >= 0 ? "+" : ""}${t.rMultiple.toFixed(2)}R` : "—"}
                  </td>
                  <td className="tabular" style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: t.realizedPnl !== null ? (t.realizedPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-text-muted)" }}>
                    {t.realizedPnl !== null
                      ? `${t.realizedPnl >= 0 ? "+" : ""}${t.realizedPnl.toFixed(2)}`
                      : "—"}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--color-text-muted)" }}>
                    {t.emotionState ?? "—"}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <Link href={`/trades/${t.id}`} style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none" }}>
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
