"use server";

import { prisma } from "@/lib/db/client";
import { PropChallengeSchema, type PropChallengeFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

const DEFAULT_USER_ID = "local";

export async function getPropChallenges() {
  return prisma.propChallenge.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: {
      trades: {
        where: { status: "CLOSED" },
        select: { id: true, realizedPnl: true, entryTime: true, exitTime: true },
        orderBy: { entryTime: "asc" },
      },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function createPropChallenge(raw: PropChallengeFormData) {
  const data = PropChallengeSchema.parse(raw);
  await prisma.propChallenge.create({
    data: {
      userId: DEFAULT_USER_ID,
      firmName: data.firmName,
      phase: data.phase,
      accountSize: data.accountSize,
      dailyLossLimit: data.dailyLossLimit,
      maxLossLimit: data.maxLossLimit,
      profitTarget: data.profitTarget,
      minTradingDays: data.minTradingDays,
      startDate: new Date(data.startDate),
      status: data.status,
    },
  });
  revalidatePath("/prop");
  return { success: true };
}

export async function updatePropChallengeStatus(id: string, status: "ACTIVE" | "PASSED" | "FAILED") {
  await prisma.propChallenge.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/prop");
  return { success: true };
}

export async function deletePropChallenge(id: string) {
  await prisma.propChallenge.delete({ where: { id } });
  revalidatePath("/prop");
  return { success: true };
}
