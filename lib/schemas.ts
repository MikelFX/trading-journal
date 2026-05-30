import { z } from "zod";

export const DirectionSchema = z.enum(["LONG", "SHORT"]);
export const TradeStatusSchema = z.enum(["OPEN", "CLOSED", "CANCELLED"]);
export const SessionSchema = z.enum(["ASIA", "LONDON", "NEWYORK"]);
export const EmotionStateSchema = z.enum(["CALM", "FOMO", "REVENGE", "TILT", "UNCERTAIN"]);

export const TradeFormSchema = z.object({
  symbol: z.string().min(1, "Symbol je povinný").max(20),
  direction: DirectionSchema,
  status: TradeStatusSchema.default("CLOSED"),

  entryPrice: z.number().positive("Vstupní cena musí být kladná"),
  exitPrice: z.number().positive().optional(),
  stopLoss: z.number().positive("Stop loss musí být kladný"),
  takeProfit: z.number().positive().optional(),
  positionSize: z.number().positive("Velikost pozice musí být kladná"),
  entryTime: z.string().datetime(),
  exitTime: z.string().datetime().optional(),

  riskAmount: z.number().positive("Riskovaná částka musí být kladná"),
  riskPercent: z.number().min(0).max(100).optional(),
  fees: z.number().min(0).default(0),

  setupId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  entryTimeframe: z.string().optional(),
  session: SessionSchema.optional(),

  mae: z.number().optional(),
  mfe: z.number().optional(),

  movedStop: z.boolean().default(false),
  emotionState: EmotionStateSchema.optional(),
  notes: z.string().optional(),
});

export type TradeFormData = z.infer<typeof TradeFormSchema>;

export const SetupFormSchema = z.object({
  name: z.string().min(1, "Název setupu je povinný").max(50),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Neplatná barva").optional(),
});

export type SetupFormData = z.infer<typeof SetupFormSchema>;

export const UserSettingsSchema = z.object({
  accountSize: z.number().positive().optional(),
  maxRiskPercent: z.number().min(0.1).max(100).default(1),
  targetRR: z.number().min(0.1).default(2),
  maxTradesPerDay: z.number().int().min(1).default(3),
  currency: z.string().length(3).default("USD"),
});

export type UserSettingsData = z.infer<typeof UserSettingsSchema>;

export const PropChallengeSchema = z.object({
  firmName: z.string().min(1, "Název firmy je povinný").max(100),
  phase: z.string().max(50).optional(),
  accountSize: z.number().positive("Velikost účtu musí být kladná"),
  dailyLossLimit: z.number().positive("Denní limit musí být kladný"),
  maxLossLimit: z.number().positive("Max ztráta musí být kladná"),
  profitTarget: z.number().positive().optional(),
  minTradingDays: z.number().int().positive().optional(),
  startDate: z.string().datetime(),
  status: z.enum(["ACTIVE", "PASSED", "FAILED"]).default("ACTIVE"),
});

export type PropChallengeFormData = z.infer<typeof PropChallengeSchema>;
