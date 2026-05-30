"use server";

import { prisma } from "@/lib/db/client";
import { TradeFormSchema, type TradeFormData } from "@/lib/schemas";
import type { TradeWithRelations } from "@/lib/db/types";
import { revalidatePath } from "next/cache";

const DEFAULT_USER_ID = "local";

function computeDerivedFields(data: TradeFormData) {
  let realizedPnl: number | undefined;
  let rMultiple: number | undefined;
  let followedRiskRule: boolean | undefined;
  let followedRRTarget: boolean | undefined;

  if (data.exitPrice !== undefined && data.status === "CLOSED") {
    const direction = data.direction === "LONG" ? 1 : -1;
    const priceDiff = (data.exitPrice - data.entryPrice) * direction;
    realizedPnl = priceDiff * data.positionSize - data.fees;
    if (data.riskAmount > 0) {
      rMultiple = realizedPnl / data.riskAmount;
    }
  }

  return { realizedPnl, rMultiple, followedRiskRule, followedRRTarget };
}

export async function createTrade(raw: TradeFormData) {
  const data = TradeFormSchema.parse(raw);
  const derived = computeDerivedFields(data);

  const settings = await prisma.userSettings.findUnique({
    where: { userId: DEFAULT_USER_ID },
  });

  const followedRiskRule =
    settings?.maxRiskPercent && data.riskPercent !== undefined
      ? data.riskPercent <= settings.maxRiskPercent
      : undefined;

  const followedRRTarget =
    settings?.targetRR && derived.rMultiple !== undefined
      ? derived.rMultiple >= settings.targetRR
      : undefined;

  const tradesThisDay = await prisma.trade.count({
    where: {
      userId: DEFAULT_USER_ID,
      entryTime: {
        gte: new Date(new Date(data.entryTime).setHours(0, 0, 0, 0)),
        lt: new Date(new Date(data.entryTime).setHours(24, 0, 0, 0)),
      },
    },
  });

  const withinDailyLimit = settings?.maxTradesPerDay
    ? tradesThisDay < settings.maxTradesPerDay
    : undefined;

  const trade = await prisma.trade.create({
    data: {
      userId: DEFAULT_USER_ID,
      symbol: data.symbol.toUpperCase(),
      direction: data.direction,
      status: data.status,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice,
      stopLoss: data.stopLoss,
      takeProfit: data.takeProfit,
      positionSize: data.positionSize,
      entryTime: new Date(data.entryTime),
      exitTime: data.exitTime ? new Date(data.exitTime) : undefined,
      riskAmount: data.riskAmount,
      riskPercent: data.riskPercent,
      realizedPnl: derived.realizedPnl,
      fees: data.fees,
      rMultiple: derived.rMultiple,
      setupId: data.setupId,
      tags: data.tags,
      entryTimeframe: data.entryTimeframe,
      session: data.session,
      mae: data.mae,
      mfe: data.mfe,
      followedRiskRule,
      followedRRTarget,
      withinDailyLimit,
      movedStop: data.movedStop,
      emotionState: data.emotionState,
      notes: data.notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/calendar");
  revalidatePath("/analytics");

  return { success: true, tradeId: trade.id };
}

export async function updateTrade(id: string, raw: TradeFormData) {
  const data = TradeFormSchema.parse(raw);
  const derived = computeDerivedFields(data);

  const settings = await prisma.userSettings.findUnique({
    where: { userId: DEFAULT_USER_ID },
  });

  const followedRiskRule =
    settings?.maxRiskPercent && data.riskPercent !== undefined
      ? data.riskPercent <= settings.maxRiskPercent
      : undefined;

  const followedRRTarget =
    settings?.targetRR && derived.rMultiple !== undefined
      ? derived.rMultiple >= settings.targetRR
      : undefined;

  await prisma.trade.update({
    where: { id },
    data: {
      symbol: data.symbol.toUpperCase(),
      direction: data.direction,
      status: data.status,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice,
      stopLoss: data.stopLoss,
      takeProfit: data.takeProfit,
      positionSize: data.positionSize,
      entryTime: new Date(data.entryTime),
      exitTime: data.exitTime ? new Date(data.exitTime) : null,
      riskAmount: data.riskAmount,
      riskPercent: data.riskPercent,
      realizedPnl: derived.realizedPnl,
      fees: data.fees,
      rMultiple: derived.rMultiple,
      setupId: data.setupId ?? null,
      tags: data.tags,
      entryTimeframe: data.entryTimeframe,
      session: data.session,
      mae: data.mae,
      mfe: data.mfe,
      followedRiskRule,
      followedRRTarget,
      movedStop: data.movedStop,
      emotionState: data.emotionState,
      notes: data.notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath(`/trades/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");

  return { success: true };
}

export async function deleteTrade(id: string) {
  await prisma.trade.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  return { success: true };
}

export async function getTrades(filters?: {
  setupId?: string;
  tags?: string[];
  symbol?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<TradeWithRelations[]> {
  return prisma.trade.findMany({
    where: {
      userId: DEFAULT_USER_ID,
      ...(filters?.setupId ? { setupId: filters.setupId } : {}),
      ...(filters?.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
      ...(filters?.symbol ? { symbol: filters.symbol.toUpperCase() } : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            entryTime: {
              ...(filters?.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters?.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    },
    include: { setup: true, screenshots: true },
    orderBy: { entryTime: "desc" },
  });
}

export async function getTradeById(id: string): Promise<TradeWithRelations | null> {
  return prisma.trade.findUnique({
    where: { id },
    include: { setup: true, screenshots: true },
  });
}
