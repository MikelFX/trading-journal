"use server";

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeWithAI(contextJson: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY není nastavena v .env souboru.");
  }

  const systemPrompt = `Jsi zkušený trading kouč. Analyzuješ obchodní deník tradera.

PRAVIDLA:
- Uvažuj VÝHRADNĚ nad dodanými čísly a statistikami v JSON.
- NIKDY nevymýšlej statistiky ani čísla, která nejsou v datech.
- Buď konkrétní, přímý a konstruktivní.
- Každé tvrzení podlož konkrétní metrikou z dat.
- Piš česky.
- Strukturuj odpověď do sekcí: Silné stránky, Úniky/slabiny, Doporučení.`;

  const message = await client.messages.create({
    model: process.env.AI_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Zde jsou statistiky mého obchodního deníku:\n\n${contextJson}\n\nPoskytni mi detailní analýzu mého obchodování.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Neočekávaný typ odpovědi od Claude.");
  return block.text;
}
