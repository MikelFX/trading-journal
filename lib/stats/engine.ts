export type TradeStat = {
  id: string;
  realizedPnl: number | null;
  rMultiple: number | null;
  riskAmount: number;
  entryTime: Date;
  exitTime: Date | null;
  status: string;
  setupId: string | null;
  tags: string[];
  session: string | null;
  entryTimeframe: string | null;
  symbol: string;
  followedRiskRule: boolean | null;
  followedRRTarget: boolean | null;
  withinDailyLimit: boolean | null;
  movedStop: boolean;
  mae: number | null;
  mfe: number | null;
  emotionState: string | null;
};

export type CoreStats = {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  biggestWin: number;
  biggestLoss: number;
  longestWinStreak: number;
  longestLossStreak: number;
  avgMae: number | null;
  avgMfe: number | null;
  maxDrawdown: number;
  equityCurve: { time: string; value: number }[];
  rMultipleDistribution: { bucket: string; count: number }[];
};

export function computeCoreStats(trades: TradeStat[]): CoreStats {
  const closed = trades.filter((t) => t.status === "CLOSED" && t.realizedPnl !== null);

  const wins = closed.filter((t) => (t.realizedPnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.realizedPnl ?? 0) <= 0);

  const grossProfit = wins.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.realizedPnl ?? 0), 0));
  const netPnl = grossProfit - grossLoss;

  const winRate = closed.length > 0 ? wins.length / closed.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const rMultiples = closed.map((t) => t.rMultiple ?? 0);
  const expectancy = rMultiples.length > 0 ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : 0;

  const winPnls = wins.map((t) => t.realizedPnl ?? 0);
  const lossPnls = losses.map((t) => t.realizedPnl ?? 0);
  const avgWin = winPnls.length > 0 ? winPnls.reduce((s, v) => s + v, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length > 0 ? lossPnls.reduce((s, v) => s + v, 0) / lossPnls.length : 0;
  const biggestWin = winPnls.length > 0 ? Math.max(...winPnls) : 0;
  const biggestLoss = lossPnls.length > 0 ? Math.min(...lossPnls) : 0;

  const { longestWin, longestLoss } = computeStreaks(closed);

  const maes = closed.filter((t) => t.mae !== null).map((t) => t.mae as number);
  const mfes = closed.filter((t) => t.mfe !== null).map((t) => t.mfe as number);
  const avgMae = maes.length > 0 ? maes.reduce((s, v) => s + v, 0) / maes.length : null;
  const avgMfe = mfes.length > 0 ? mfes.reduce((s, v) => s + v, 0) / mfes.length : null;

  const sorted = [...closed].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
  const equityCurve = buildEquityCurve(sorted);
  const maxDrawdown = computeMaxDrawdown(equityCurve.map((p) => p.value));
  const rMultipleDistribution = buildRDistribution(rMultiples);

  return {
    totalTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    netPnl,
    grossProfit,
    grossLoss,
    profitFactor,
    expectancy,
    avgWin,
    avgLoss,
    biggestWin,
    biggestLoss,
    longestWinStreak: longestWin,
    longestLossStreak: longestLoss,
    avgMae,
    avgMfe,
    maxDrawdown,
    equityCurve,
    rMultipleDistribution,
  };
}

function computeStreaks(trades: TradeStat[]): { longestWin: number; longestLoss: number } {
  let longestWin = 0;
  let longestLoss = 0;
  let currentWin = 0;
  let currentLoss = 0;

  for (const t of trades) {
    if ((t.realizedPnl ?? 0) > 0) {
      currentWin++;
      currentLoss = 0;
      if (currentWin > longestWin) longestWin = currentWin;
    } else {
      currentLoss++;
      currentWin = 0;
      if (currentLoss > longestLoss) longestLoss = currentLoss;
    }
  }

  return { longestWin, longestLoss };
}

function buildEquityCurve(sorted: TradeStat[]): { time: string; value: number }[] {
  let cumulative = 0;
  return sorted.map((t) => {
    cumulative += t.realizedPnl ?? 0;
    return {
      time: (t.exitTime ?? t.entryTime).toISOString().slice(0, 10),
      value: Math.round(cumulative * 100) / 100,
    };
  });
}

function computeMaxDrawdown(equity: number[]): number {
  let peak = -Infinity;
  let maxDD = 0;
  for (const val of equity) {
    if (val > peak) peak = val;
    const dd = peak - val;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

function buildRDistribution(rMultiples: number[]): { bucket: string; count: number }[] {
  const buckets: Record<string, number> = {};
  for (const r of rMultiples) {
    const key = (Math.round(r * 2) / 2).toFixed(1);
    buckets[key] = (buckets[key] ?? 0) + 1;
  }
  return Object.entries(buckets)
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([bucket, count]) => ({ bucket, count }));
}

export type SegmentStats = {
  label: string;
  trades: number;
  winRate: number;
  expectancy: number;
  netPnl: number;
};

export function computeSegmentStats(
  trades: TradeStat[],
  getKey: (t: TradeStat) => string | null
): SegmentStats[] {
  const groups: Record<string, TradeStat[]> = {};
  for (const t of trades) {
    const key = getKey(t) ?? "—";
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  return Object.entries(groups).map(([label, ts]) => {
    const stats = computeCoreStats(ts);
    return {
      label,
      trades: stats.totalTrades,
      winRate: stats.winRate,
      expectancy: stats.expectancy,
      netPnl: stats.netPnl,
    };
  });
}

export type RuleCompliance = {
  rule: string;
  followed: number;
  total: number;
  rate: number;
  pnlWhenFollowed: number;
  pnlWhenBroken: number;
};

export function computeRuleCompliance(trades: TradeStat[]): RuleCompliance[] {
  const closed = trades.filter((t) => t.status === "CLOSED");

  function ruleStats(getter: (t: TradeStat) => boolean | null, label: string): RuleCompliance {
    const withData = closed.filter((t) => getter(t) !== null);
    const followed = withData.filter((t) => getter(t) === true);
    const broken = withData.filter((t) => getter(t) === false);
    const pnlFollowed = followed.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
    const pnlBroken = broken.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
    return {
      rule: label,
      followed: followed.length,
      total: withData.length,
      rate: withData.length > 0 ? followed.length / withData.length : 0,
      pnlWhenFollowed: pnlFollowed,
      pnlWhenBroken: pnlBroken,
    };
  }

  return [
    ruleStats((t) => t.followedRiskRule, "Max risk %"),
    ruleStats((t) => t.followedRRTarget, "Cílové RR"),
    ruleStats((t) => t.withinDailyLimit, "Denní limit"),
    ruleStats((t) => (t.movedStop ? false : true), "Neposunoval SL"),
  ];
}
