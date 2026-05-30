"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      {/* Trigger card */}
      <motion.div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
        }}
        whileHover={{ borderColor: "var(--color-border-bright)" }}
      >
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20, lineHeight: 1.8 }}>
          AI dostane tvoje spočítané statistiky a poskytne interpretaci.
          Žádné číslo nevymyslí — komentuje pouze reálná data.
        </p>

        <motion.button
          onClick={handleAnalyze}
          disabled={isPending}
          whileHover={!isPending ? {
            scale: 1.02,
            boxShadow: "0 0 40px rgba(0,200,255,0.4), 0 8px 32px rgba(0,0,0,0.4)",
          } : {}}
          whileTap={!isPending ? { scale: 0.97 } : {}}
          style={{
            padding: "13px 32px",
            background: isPending
              ? "var(--color-surface-2)"
              : "linear-gradient(135deg, #00c8ff 0%, #0050ff 50%, #7c00ff 100%)",
            color: isPending ? "var(--color-text-muted)" : "white",
            border: "none",
            borderRadius: "var(--radius)",
            fontWeight: 700,
            fontSize: 14,
            cursor: isPending ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            boxShadow: isPending ? "none" : "0 4px 24px rgba(0,80,255,0.3)",
            transition: "background 0.3s ease",
          }}
        >
          {isPending ? (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-block", fontSize: 16 }}
              >
                ◌
              </motion.span>
              Analyzuji...
            </span>
          ) : "✦ Spustit AI analýzu"}
        </motion.button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: "var(--color-loss-dim)",
              border: "1px solid var(--color-loss)",
              borderRadius: "var(--radius)",
              padding: "12px 16px",
              color: "var(--color-loss)",
              fontSize: 13,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: 28,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top glow */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent, var(--color-accent), #7c00ff, transparent)",
            }} />

            {/* Ambient glow */}
            <div style={{
              position: "absolute",
              top: -40, right: -40,
              width: 200, height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,200,255,0.06), transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--color-accent)",
              textTransform: "uppercase",
              marginBottom: 20,
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{ filter: "drop-shadow(0 0 6px var(--color-accent))" }}>✦</span>
              AI Analýza — Claude
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.85, color: "var(--color-text)", whiteSpace: "pre-wrap" }}>
              {result}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
