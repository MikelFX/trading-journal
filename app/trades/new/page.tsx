export const dynamic = "force-dynamic";

import { getSetups } from "@/lib/actions/setups";
import { getSettings } from "@/lib/actions/settings";
import { TradeForm } from "@/components/ui/TradeForm";

export default async function NewTradePage() {
  const [setups, settings] = await Promise.all([getSetups(), getSettings()]);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>Nový obchod</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
          Zapiš obchod ručně
        </p>
      </div>
      <TradeForm setups={setups} currency={settings.currency} />
    </div>
  );
}
