"use server";

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FAST_MODEL = process.env.CLAUDE_MODEL_FAST ?? "claude-haiku-4-5-20251001";
const DEEP_MODEL = process.env.CLAUDE_MODEL_DEEP ?? "claude-sonnet-4-6";

const COACH_SYSTEM = `Jsi zkušený trading kouč. Analyzuješ obchodní deník tradera.

PRAVIDLA:
- Pracuj VÝHRADNĚ s dodanými čísly a statistikami v JSON.
- NIKDY nevymýšlej statistiky ani čísla, která nejsou v datech.
- Buď konkrétní, přímý a konstruktivní.
- Každé tvrzení podlož konkrétní metrikou z dat.
- Piš česky.

FORMÁT VÝSTUPU: Vrať čisté JSON (bez markdown fences) s těmito klíči:
{
  "strengths": ["..."],
  "leaks": ["..."],
  "recommendations": ["..."],
  "flaggedTradeIds": ["tradeId1", "tradeId2"]
}`;

export type AiCoachResult = {
  strengths: string[];
  leaks: string[];
  recommendations: string[];
  flaggedTradeIds: string[];
};

function parseCoachJson(text: string): AiCoachResult {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      leaks: Array.isArray(parsed.leaks) ? parsed.leaks : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      flaggedTradeIds: Array.isArray(parsed.flaggedTradeIds) ? parsed.flaggedTradeIds : [],
    };
  } catch {
    return { strengths: [], leaks: [], recommendations: [text], flaggedTradeIds: [] };
  }
}

export async function weeklyReview(contextJson: string): Promise<AiCoachResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY chybí v .env");

  const msg = await client.messages.create({
    model: DEEP_MODEL,
    max_tokens: 2000,
    system: [
      {
        type: "text" as const,
        text: COACH_SYSTEM,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Statistiky mého obchodního deníku (týdenní review):\n\n${contextJson}\n\nVrať JSON analýzu.`,
      },
    ],
  });

  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Neočekávaný typ odpovědi od Claude");
  return parseCoachJson(block.text);
}

export async function perTradeAnalysis(tradeJson: string, rulesJson: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY chybí v .env");

  const msg = await client.messages.create({
    model: FAST_MODEL,
    max_tokens: 400,
    system: [
      {
        type: "text" as const,
        text: `Jsi trading kouč. Napiš 2–3 věty o tomto obchodu česky. Flagni porušení pravidel nebo behaviorální vzory (revenge, mimo plán, přesunutý SL). Buď stručný a přímý.`,
        cache_control: { type: "ephemeral" as const },
      },
      {
        type: "text" as const,
        text: `Pravidla tradera:\n${rulesJson}`,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [
      { role: "user", content: `Obchod:\n${tradeJson}` },
    ],
  });

  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Neočekávaný typ odpovědi od Claude");
  return block.text;
}

export async function chatWithCoach(
  contextJson: string,
  history: { role: "user" | "assistant"; content: string }[],
  question: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY chybí v .env");

  const msg = await client.messages.create({
    model: DEEP_MODEL,
    max_tokens: 1000,
    system: [
      {
        type: "text" as const,
        text: COACH_SYSTEM + "\n\nOdpovídej přátelsky, stručně a konkrétně. Kdy lze, odkazuj na konkrétní metriky z dat.",
        cache_control: { type: "ephemeral" as const },
      },
      {
        type: "text" as const,
        text: `Aktuální statistiky tradera:\n${contextJson}`,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: question },
    ],
  });

  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Neočekávaný typ odpovědi od Claude");
  return block.text;
}

export async function analyzeWithAI(contextJson: string): Promise<string> {
  const result = await weeklyReview(contextJson);
  const parts = [
    result.strengths.length ? "**Silné stránky:**\n" + result.strengths.map((s) => `• ${s}`).join("\n") : "",
    result.leaks.length ? "\n**Úniky:**\n" + result.leaks.map((l) => `• ${l}`).join("\n") : "",
    result.recommendations.length ? "\n**Doporučení:**\n" + result.recommendations.map((r) => `• ${r}`).join("\n") : "",
  ].filter(Boolean);
  return parts.join("\n");
}
