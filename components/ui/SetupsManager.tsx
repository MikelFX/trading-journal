"use client";

import { useState, useTransition } from "react";
import { createSetup, deleteSetup } from "@/lib/actions/setups";

type Setup = { id: string; name: string; description: string | null; color: string | null };

const PALETTE = ["#00d68f", "#00b4d8", "#ff3d71", "#ffaa00", "#a78bfa", "#fb923c", "#34d399", "#f472b6"];

export function SetupsManager({ initialSetups }: { initialSetups: Setup[] }) {
  const [setups, setSetups] = useState(initialSetups);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", description: "", color: PALETTE[0] });
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await createSetup({ name: form.name.trim(), description: form.description || undefined, color: form.color });
        setSetups((prev) => [...prev, { id: result.setupId, name: form.name.trim(), description: form.description || null, color: form.color }]);
        setForm({ name: "", description: "", color: PALETTE[0] });
      } catch {
        setError("Setup s tímto názvem již existuje.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Smazat setup? Obchody s tímto setupem ho ztratí.")) return;
    startTransition(async () => {
      await deleteSetup(id);
      setSetups((prev) => prev.filter((s) => s.id !== id));
    });
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    color: "var(--color-text)",
    padding: "8px 12px",
    fontSize: 14,
    outline: "none",
    flex: 1,
  };

  return (
    <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 20 }}>
        Setupy ({setups.length})
      </h2>

      {/* Existing setups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {setups.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Žádné setupy. Přidej první níže.</p>
        )}
        {setups.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: s.color ?? "var(--color-accent)", flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{s.name}</span>
            {s.description && <span style={{ fontSize: 12, color: "var(--color-text-muted)", flex: 2 }}>{s.description}</span>}
            <button
              onClick={() => handleDelete(s.id)}
              style={{ background: "none", border: "none", color: "var(--color-text-dim)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input style={inputStyle} placeholder="Název setupu" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input style={{ ...inputStyle, flex: 2 }} placeholder="Popis (volitelné)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Barva:</span>
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((p) => ({ ...p, color: c }))}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: c,
                border: form.color === c ? "2px solid white" : "2px solid transparent",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
        {error && <p style={{ fontSize: 13, color: "var(--color-loss)" }}>{error}</p>}
        <button
          type="submit"
          disabled={isPending || !form.name.trim()}
          style={{
            alignSelf: "flex-start",
            padding: "9px 20px",
            background: "var(--color-accent-dim)",
            border: "1px solid var(--color-accent)",
            borderRadius: "var(--radius)",
            color: "var(--color-accent)",
            fontWeight: 600,
            fontSize: 13,
            cursor: isPending || !form.name.trim() ? "not-allowed" : "pointer",
          }}
        >
          + Přidat setup
        </button>
      </form>
    </section>
  );
}
