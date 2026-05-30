"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bulkCreateTrades } from "@/lib/actions/trades";

type ParsedRow = {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  positionSize: number;
  entryTime: string;
  exitTime?: string;
  riskAmount: number;
  riskPercent?: number;
  fees?: number;
  notes?: string;
};

const REQUIRED_FIELDS = ["symbol", "direction", "entry_price", "stop_loss", "position_size", "entry_time", "risk_amount"] as const;
const OPTIONAL_FIELDS = ["exit_price", "exit_time", "fees", "risk_percent", "notes"] as const;

const FIELD_ALIASES: Record<string, string> = {
  // symbol
  "symbol": "symbol", "ticker": "symbol", "pair": "symbol", "instrument": "symbol",
  // direction
  "direction": "direction", "side": "direction", "type": "direction", "action": "direction",
  // prices
  "entry_price": "entry_price", "entryprice": "entry_price", "open_price": "entry_price", "open": "entry_price", "price_open": "entry_price",
  "exit_price": "exit_price", "exitprice": "exit_price", "close_price": "exit_price", "close": "exit_price", "price_close": "exit_price",
  "stop_loss": "stop_loss", "stoploss": "stop_loss", "sl": "stop_loss",
  "position_size": "position_size", "positionsize": "position_size", "size": "position_size", "lots": "position_size", "volume": "position_size", "quantity": "position_size",
  // times
  "entry_time": "entry_time", "entrytime": "entry_time", "open_time": "entry_time", "date_open": "entry_time", "opentime": "entry_time",
  "exit_time": "exit_time", "exittime": "exit_time", "close_time": "exit_time", "date_close": "exit_time", "closetime": "exit_time",
  // risk/fees
  "risk_amount": "risk_amount", "riskamount": "risk_amount", "risk": "risk_amount",
  "risk_percent": "risk_percent", "riskpercent": "risk_percent", "risk_pct": "risk_percent",
  "fees": "fees", "commission": "fees", "swap": "fees",
  "notes": "notes", "comment": "notes", "remarks": "notes",
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === "," && !inQuotes) {
        result.push(field.trim());
        field = "";
      } else {
        field += line[i];
      }
    }
    result.push(field.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseRow);
  return { headers, rows };
}

function mapRow(row: string[], mapping: Record<string, number>): ParsedRow | null {
  const get = (field: string) => {
    const idx = mapping[field];
    return idx !== undefined ? row[idx]?.trim() ?? "" : "";
  };

  const symbol = get("symbol").toUpperCase();
  const dirRaw = get("direction").toUpperCase();
  const direction: "LONG" | "SHORT" = dirRaw.includes("BUY") || dirRaw === "LONG" ? "LONG" : "SHORT";
  const entryPrice = parseFloat(get("entry_price"));
  const stopLoss = parseFloat(get("stop_loss"));
  const positionSize = parseFloat(get("position_size"));
  const riskAmount = parseFloat(get("risk_amount"));
  const entryTimeRaw = get("entry_time");

  if (!symbol || !entryTimeRaw || isNaN(entryPrice) || isNaN(stopLoss) || isNaN(positionSize) || isNaN(riskAmount)) return null;

  let entryTime: string;
  try {
    entryTime = new Date(entryTimeRaw).toISOString();
  } catch { return null; }

  const exitPriceRaw = get("exit_price");
  const exitTimeRaw = get("exit_time");

  return {
    symbol,
    direction,
    entryPrice,
    exitPrice: exitPriceRaw ? parseFloat(exitPriceRaw) : undefined,
    stopLoss,
    positionSize,
    entryTime,
    exitTime: exitTimeRaw ? (() => { try { return new Date(exitTimeRaw).toISOString(); } catch { return undefined; } })() : undefined,
    riskAmount,
    riskPercent: get("risk_percent") ? parseFloat(get("risk_percent")) : undefined,
    fees: get("fees") ? parseFloat(get("fees")) : undefined,
    notes: get("notes") || undefined,
  };
}

export function CsvImporter() {
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<(ParsedRow | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  function handleParse() {
    setError(null);
    setSuccess(null);
    if (!csvText.trim()) { setError("Vlož nebo nahraj CSV soubor."); return; }
    const result = parseCsvText(csvText);
    if (result.headers.length === 0) { setError("CSV neobsahuje platná data."); return; }

    const autoMapping: Record<string, number> = {};
    result.headers.forEach((h, i) => {
      const normalized = normalizeHeader(h);
      const mapped = FIELD_ALIASES[normalized];
      if (mapped) autoMapping[mapped] = i;
    });

    setParsed(result);
    setMapping(autoMapping);
    setPreview(result.rows.slice(0, 5).map((row) => mapRow(row, autoMapping)));
  }

  function handleMappingChange(field: string, colIdx: number) {
    const newMapping = { ...mapping, [field]: colIdx };
    setMapping(newMapping);
    if (parsed) setPreview(parsed.rows.slice(0, 5).map((row) => mapRow(row, newMapping)));
  }

  function handleImport() {
    if (!parsed) return;
    setError(null);
    const rows = parsed.rows.map((row) => mapRow(row, mapping)).filter((r): r is ParsedRow => r !== null);
    if (rows.length === 0) { setError("Žádné platné řádky k importu."); return; }

    start(async () => {
      try {
        const result = await bulkCreateTrades(rows);
        setSuccess(`Importováno ${result.count} obchodů.`);
        setCsvText("");
        setParsed(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chyba při importu");
      }
    });
  }

  const inputStyle = {
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    color: "var(--color-text)",
    padding: "7px 10px",
    fontSize: 12,
    outline: "none",
    width: "100%",
  };

  const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* File/paste input */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label
            style={{
              padding: "8px 16px",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              fontSize: 13,
              cursor: "pointer",
              color: "var(--color-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            Nahrát CSV
            <input type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: "none" }} />
          </label>
          <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>nebo vlož text níže</span>
        </div>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={"symbol,direction,entry_price,exit_price,stop_loss,position_size,entry_time,risk_amount\nEURUSD,LONG,1.0850,1.0920,1.0800,1.0,2024-01-15T09:00:00,100"}
          rows={5}
          style={{
            ...inputStyle,
            resize: "vertical",
            fontFamily: "var(--font-display)",
            fontSize: 11,
            lineHeight: 1.6,
          }}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleParse}
          style={{
            padding: "9px 20px",
            background: "linear-gradient(135deg, var(--color-accent), #0050ff)",
            color: "#000",
            border: "none",
            borderRadius: "var(--radius)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          Parsovat →
        </motion.button>
      </div>

      {/* Error / success */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: "10px 14px", background: "var(--color-loss-dim)", border: "1px solid var(--color-loss)", borderRadius: "var(--radius)", color: "var(--color-loss)", fontSize: 13 }}>
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: "10px 14px", background: "var(--color-profit-dim)", border: "1px solid var(--color-profit)", borderRadius: "var(--radius)", color: "var(--color-profit)", fontSize: 13 }}>
            ✓ {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mapping + preview */}
      <AnimatePresence>
        {parsed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Mapping */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 14 }}>
                Mapování sloupců
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {allFields.map((field) => (
                  <label key={field} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: REQUIRED_FIELDS.includes(field as never) ? "var(--color-accent)" : "var(--color-text-muted)", letterSpacing: "0.05em" }}>
                      {field} {REQUIRED_FIELDS.includes(field as never) ? "*" : ""}
                    </span>
                    <select
                      value={mapping[field] ?? ""}
                      onChange={(e) => handleMappingChange(field, parseInt(e.target.value))}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">— nevybráno —</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                Náhled (prvních 5 řádků)
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {["Symbol", "Směr", "Vstup", "Výstup", "SL", "Velikost", "Čas vstupu", "Risk"].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 500 }}>{h}</th>
                      ))}
                      <th style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>✓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(26,36,56,0.5)" }}>
                        {row ? (
                          <>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600 }}>{row.symbol}</td>
                            <td style={{ padding: "8px 12px", color: row.direction === "LONG" ? "var(--color-profit)" : "var(--color-loss)" }}>{row.direction}</td>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)" }}>{row.entryPrice}</td>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)" }}>{row.exitPrice ?? "—"}</td>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)" }}>{row.stopLoss}</td>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)" }}>{row.positionSize}</td>
                            <td style={{ padding: "8px 12px", color: "var(--color-text-muted)", fontFamily: "var(--font-display)", fontSize: 11 }}>
                              {new Date(row.entryTime).toLocaleString("cs-CZ")}
                            </td>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)" }}>{row.riskAmount}</td>
                            <td style={{ padding: "8px 12px", color: "var(--color-profit)" }}>✓</td>
                          </>
                        ) : (
                          <td colSpan={9} style={{ padding: "8px 12px", color: "var(--color-loss)", fontSize: 11 }}>
                            ✗ Řádek nelze parsovat
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import button */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleImport}
                disabled={isPending}
                style={{
                  padding: "11px 24px",
                  background: isPending ? "var(--color-border)" : "linear-gradient(135deg, var(--color-accent), #0050ff)",
                  color: isPending ? "var(--color-text-muted)" : "#000",
                  border: "none",
                  borderRadius: "var(--radius)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: isPending ? "not-allowed" : "pointer",
                }}
              >
                {isPending ? "Importuji..." : `Importovat ${parsed.rows.length} obchodů →`}
              </motion.button>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {parsed.rows.filter((row) => mapRow(row, mapping) !== null).length} platných řádků
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
