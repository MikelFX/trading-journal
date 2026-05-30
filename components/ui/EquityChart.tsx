"use client";

import { useEffect, useRef } from "react";

type Point = { time: string; value: number };

function deduplicateDates(data: Point[]): Point[] {
  const map = new Map<string, number>();
  for (const p of data) map.set(p.time, p.value);
  return Array.from(map.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function EquityChart({
  data,
  height = 280,
}: {
  data: Point[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const clean = deduplicateDates(data);
    if (clean.length === 0) return;

    let chart: ReturnType<typeof import("lightweight-charts")["createChart"]> | null = null;

    import("lightweight-charts").then(({ createChart, AreaSeries }) => {
      if (!containerRef.current) return;

      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { color: "transparent" },
          textColor: "#4a6080",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#1a2438" },
          horzLines: { color: "#1a2438" },
        },
        rightPriceScale: { borderColor: "#1a2438" },
        timeScale: { borderColor: "#1a2438", timeVisible: true },
        crosshair: {
          vertLine: { color: "#00c8ff40", width: 1, style: 3 },
          horzLine: { color: "#00c8ff40", width: 1, style: 3 },
        },
        handleScroll: false,
        handleScale: false,
      });

      const finalValue = clean[clean.length - 1].value;
      const isProfit = finalValue >= 0;

      const series = chart.addSeries(AreaSeries as never, {
        lineColor: isProfit ? "#00e5a0" : "#ff4d6d",
        topColor: isProfit ? "rgba(0,229,160,0.25)" : "rgba(255,77,109,0.25)",
        bottomColor: "rgba(0,0,0,0)",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: isProfit ? "#00e5a0" : "#ff4d6d",
        crosshairMarkerBackgroundColor: isProfit ? "#00e5a020" : "#ff4d6d20",
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      });

      // Draw-on animation
      const total = clean.length;
      const duration = Math.min(1400, total * 30);
      const intervalMs = Math.max(8, duration / total);
      let i = 1;

      const timer = setInterval(() => {
        if (!chart) return;
        series.setData(clean.slice(0, i));
        i++;
        if (i > total) clearInterval(timer);
      }, intervalMs);

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
          chart.timeScale().fitContent();
        }
      };
      window.addEventListener("resize", handleResize);

      (containerRef.current as HTMLDivElement & { _cleanup?: () => void })._cleanup = () => {
        clearInterval(timer);
        window.removeEventListener("resize", handleResize);
        chart?.remove();
      };
    });

    return () => {
      const el = containerRef.current as (HTMLDivElement & { _cleanup?: () => void }) | null;
      el?._cleanup?.();
    };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          fontSize: 13,
        }}
      >
        Žádná data k zobrazení
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height }}
    />
  );
}
