export const dynamic = "force-dynamic";

import { getSetups } from "@/lib/actions/setups";
import { getSettings } from "@/lib/actions/settings";
import { TradeForm } from "@/components/ui/TradeForm";
import { PageWrapper, FadeUp } from "@/components/ui/PageWrapper";

export default async function NewTradePage() {
  const [setups, settings] = await Promise.all([getSetups(), getSettings()]);

  return (
    <PageWrapper>
      <FadeUp delay={0}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-display)" }}>
            Deník
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>Nový obchod</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>Zapiš obchod ručně</p>
        </div>
      </FadeUp>
      <FadeUp delay={0.15}>
        <TradeForm setups={setups} currency={settings.currency} />
      </FadeUp>
    </PageWrapper>
  );
}
