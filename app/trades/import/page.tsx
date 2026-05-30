import { CsvImporter } from "@/components/ui/CsvImporter";
import { PageWrapper, FadeUp, BlurReveal } from "@/components/ui/PageWrapper";
import Link from "next/link";

export default function ImportPage() {
  return (
    <PageWrapper>
      <FadeUp delay={0}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>
            <Link href="/trades" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
              Obchody
            </Link>
            {" / "}Import
          </div>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-display)" }}>
            Import
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>
            CSV Import
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
            Importuj historická data z brokera — automatické mapování sloupců
          </p>
        </div>
      </FadeUp>

      <BlurReveal delay={0.15}>
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 20px",
          marginBottom: 20,
          fontSize: 12,
          color: "var(--color-text-muted)",
          lineHeight: 1.8,
        }}>
          <strong style={{ color: "var(--color-text)" }}>Podporované sloupce:</strong>{" "}
          symbol, direction/side, entry_price/open_price, exit_price/close_price, stop_loss/sl,
          position_size/volume/lots, entry_time/open_time, exit_time/close_time,
          risk_amount/risk, risk_percent, fees/commission, notes/comment
          <br />
          <span style={{ color: "var(--color-accent)" }}>Hvězdičkou označené</span> jsou povinné.
          Slouce se mapují automaticky podle názvu — můžeš je upravit manuálně.
        </div>
      </BlurReveal>

      <BlurReveal delay={0.2}>
        <CsvImporter />
      </BlurReveal>
    </PageWrapper>
  );
}
