"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Point = {
  mae: number;
  mfe: number;
  rMultiple: number;
  symbol: string;
  id: string;
};

function CustomDot(props: {
  cx?: number;
  cy?: number;
  payload?: Point;
  r?: number;
}) {
  const { cx = 0, cy = 0, payload } = props;
  const profit = (payload?.rMultiple ?? 0) >= 0;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={profit ? "rgba(0,229,160,0.7)" : "rgba(255,77,109,0.7)"}
      stroke={profit ? "#00e5a0" : "#ff4d6d"}
      strokeWidth={1}
    />
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        lineHeight: 1.8,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, fontFamily: "var(--font-display)" }}>
        {d.symbol}
      </div>
      <div style={{ color: "var(--color-text-muted)" }}>MAE: <span style={{ color: "var(--color-loss)" }}>{d.mae.toFixed(2)}R</span></div>
      <div style={{ color: "var(--color-text-muted)" }}>MFE: <span style={{ color: "var(--color-profit)" }}>{d.mfe.toFixed(2)}R</span></div>
      <div style={{ color: d.rMultiple >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 700 }}>
        {d.rMultiple >= 0 ? "+" : ""}{d.rMultiple.toFixed(2)}R
      </div>
    </div>
  );
}

export function MaeMfeScatter({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return (
      <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
        Přidej MAE/MFE k obchodům pro zobrazení scatter grafu.
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 12, display: "flex", gap: 16 }}>
        <span>osa X = MAE (nepříznivý pohyb)</span>
        <span>osa Y = MFE (příznivý pohyb)</span>
        <span style={{ color: "var(--color-profit)" }}>● profit</span>
        <span style={{ color: "var(--color-loss)" }}>● loss</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#1a2438" strokeDasharray="4 4" />
          <XAxis
            type="number"
            dataKey="mae"
            name="MAE"
            tick={{ fill: "#4a6080", fontSize: 11 }}
            axisLine={{ stroke: "#1a2438" }}
            tickLine={false}
            tickFormatter={(v) => `${v}R`}
            domain={["auto", "auto"]}
          />
          <YAxis
            type="number"
            dataKey="mfe"
            name="MFE"
            tick={{ fill: "#4a6080", fontSize: 11 }}
            axisLine={{ stroke: "#1a2438" }}
            tickLine={false}
            tickFormatter={(v) => `${v}R`}
          />
          <ReferenceLine x={0} stroke="#253450" />
          <ReferenceLine y={0} stroke="#253450" />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#00c8ff20" }} />
          <Scatter
            data={points}
            shape={<CustomDot />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
