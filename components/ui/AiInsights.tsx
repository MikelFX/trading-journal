"use client";

import { useState, useTransition } from "react";
import { analyzeWithAI } from "@/lib/actions/ai";

export function AiInsights({ contextJson }: { contextJson: string }) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAnalyze() {
    setError(null);
    startTransition(async () => {
      try {
        const text = await analyzeWithAI(contextJson);
        setResult(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chyba při analýze");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16, lineHeight: 1.7 }}>
          AI dostane tvoje spočítané statistiky (bez přístupu k datům) a poskytne interpretaci.
          Žádné číslo nevymyslí — pouze komentuje, co vidí v číslech.
        </p>
        <button
          onClick={handleAnalyze}
          disabled={isPending}
          style={{
            padding: "11px 28px",
            background: isPending ? "var(--color-border)" : "linear-gradient(135deg, var(--color-accent), #0080ff)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius)",
            fontWeight: 700,
            fontSize: 14,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Analyzuji..." : "✦ Spustit AI analýzu"}
        </button>
      </div>

      {error && (
        <div style={{ background: "var(--color-loss-dim)", border: "1px solid var(--color-loss)", borderRadius: "var(--radius)", padding: "12px 16px", color: "var(--color-loss)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 16, fontWeight: 600 }}>
            ✦ AI Analýza
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--color-text)", whiteSpace: "pre-wrap" }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
