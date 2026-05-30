"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTrade } from "@/lib/actions/trades";

export function DeleteTradeButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Opravdu smazat tento obchod?")) return;
    startTransition(async () => {
      await deleteTrade(id);
      router.push("/trades");
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      style={{
        padding: "8px 16px",
        background: "var(--color-loss-dim)",
        border: "1px solid var(--color-loss)",
        borderRadius: "var(--radius)",
        color: "var(--color-loss)",
        fontSize: 13,
        fontWeight: 600,
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? "Mazání..." : "Smazat"}
    </button>
  );
}
