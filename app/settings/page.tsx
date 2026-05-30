export const dynamic = "force-dynamic";

import { getSetups } from "@/lib/actions/setups";
import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/ui/SettingsForm";
import { SetupsManager } from "@/components/ui/SetupsManager";
import { PageWrapper, FadeUp } from "@/components/ui/PageWrapper";

export default async function SettingsPage() {
  const [setups, settings] = await Promise.all([getSetups(), getSettings()]);

  return (
    <PageWrapper>
      <FadeUp delay={0}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-display)" }}>Config</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>Nastavení</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>Pravidla obchodování, setupy a konfigurace</p>
        </div>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <FadeUp delay={0.1}><SettingsForm initial={settings} /></FadeUp>
        <FadeUp delay={0.2}><SetupsManager initialSetups={setups} /></FadeUp>
      </div>
    </PageWrapper>
  );
}
