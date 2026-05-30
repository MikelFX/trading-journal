export const dynamic = "force-dynamic";

import { getSetups } from "@/lib/actions/setups";
import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/ui/SettingsForm";
import { SetupsManager } from "@/components/ui/SetupsManager";

export default async function SettingsPage() {
  const [setups, settings] = await Promise.all([getSetups(), getSettings()]);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>Nastavení</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 13 }}>
          Pravidla obchodování, setupy a konfigurace
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <SettingsForm initial={settings} />
        <SetupsManager initialSetups={setups} />
      </div>
    </div>
  );
}
