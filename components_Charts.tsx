// ══════════════════════════════════════════════════════
//  ClimateHealth AI — Chart Components (SVG-based)
// ══════════════════════════════════════════════════════

import { getRiskColor } from "../utils/riskCalculations";

// ── LineChart ──────────────────────────────────────────

interface LineSeries {
  key: string;
  color: string;
  label: string;
}

interface LineChartProps {
  data: Record<string, any>[];
  xKey?: string;
  series: LineSeries[];
  height?: number;
}

export function LineChart({ data, xKey = "month", series, height = 180 }: LineChartProps) {
  const viewWidth = 500;
  const padL = 38, padR = 14, padT = 12, padB = 32;
  const chartW = viewWidth - padL - padR;
  const chartH = height - padT - padB;

  const allVals = series.flatMap((s) => data.map((d) => d[s.key] as number));
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;

  const getX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const getY = (v: number) => padT + chartH - ((v - minV) / range) * chartH;
  const yTicks = [minV, minV + range / 2, maxV].map((v) => Math.round(v));

  return (
    <svg viewBox={`0 0 ${viewWidth} ${height}`} style={{ width: "100%", height: "auto" }}>
      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={getY(t)} x2={viewWidth - padR} y2={getY(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={padL - 5} y={getY(t) + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end" fontFamily="Arial">{t}</text>
        </g>
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={getX(i)} y={height - 5} fill="rgba(255,255,255,0.35)"
          fontSize="9" textAnchor="middle" fontFamily="Arial">{d[xKey]}</text>
      ))}

      {/* Series */}
      {series.map((s) => {
        const pts = data.map((d, i) => `${getX(i)},${getY(d[s.key])}`).join(" ");
        return (
          <g key={s.key}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 4px ${s.color}88)` }} />
            {data.map((d, i) => (
              <circle key={i} cx={getX(i)} cy={getY(d[s.key])} r="3.5" fill={s.color}>
                <title>{`${s.label}: ${d[s.key]}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ── BarChart ───────────────────────────────────────────

interface BarData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
}

export function BarChart({ data, height = 160 }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height, padding: "8px 0" }}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / maxVal) * (height - 44));
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
              {Math.round(d.value)}
            </span>
            <div
              title={`${d.label}: ${d.value}`}
              style={{
                width: "100%", height: barH,
                background: `linear-gradient(180deg, ${d.color}cc, ${d.color}55)`,
                border: `1px solid ${d.color}44`,
                borderRadius: "5px 5px 0 0",
                transition: "height 0.8s ease",
                boxShadow: `0 0 10px ${d.color}33`,
                cursor: "default",
              }}
            />
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.2 }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── RiskHeatmap ────────────────────────────────────────

interface HeatmapData {
  months: string[];
  diseases: { label: string; data: number[] }[];
}

export function RiskHeatmap({ heatmapData }: { heatmapData: HeatmapData }) {
  const getCellStyle = (v: number) => {
    if (v < 25)  return { bg: "rgba(34,197,94,0.2)",  fg: "#22c55e", border: "rgba(34,197,94,0.3)" };
    if (v < 50)  return { bg: "rgba(234,179,8,0.2)",  fg: "#eab308", border: "rgba(234,179,8,0.3)" };
    if (v < 75)  return { bg: "rgba(249,115,22,0.2)", fg: "#f97316", border: "rgba(249,115,22,0.3)" };
    return           { bg: "rgba(239,68,68,0.25)",    fg: "#ef4444", border: "rgba(239,68,68,0.3)" };
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px", fontSize: "11px" }}>
        <thead>
          <tr>
            <th style={{ color: "rgba(255,255,255,0.5)", textAlign: "left", padding: "4px 10px", fontWeight: 500, fontSize: "11px" }}>
              Disease
            </th>
            {heatmapData.months.map((m) => (
              <th key={m} style={{ color: "rgba(255,255,255,0.5)", padding: "4px 3px", fontWeight: 500, textAlign: "center", fontSize: "10px" }}>
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmapData.diseases.map((row, di) => (
            <tr key={di}>
              <td style={{ color: "rgba(255,255,255,0.85)", padding: "4px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>
                {row.label}
              </td>
              {row.data.map((v, mi) => {
                const { bg, fg, border } = getCellStyle(v);
                return (
                  <td key={mi}
                    title={`${row.label} — ${heatmapData.months[mi]}: ${v}%`}
                    style={{
                      background: bg, borderRadius: "4px", padding: "6px 3px", textAlign: "center",
                      color: fg, fontWeight: 700, cursor: "default", border: `1px solid ${border}`,
                      transition: "transform 0.15s",
                      fontSize: "10px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── ChartLegend ────────────────────────────────────────

interface LegendItem {
  color: string;
  label: string;
}

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "14px", height: "3px", background: item.color, borderRadius: "2px", boxShadow: `0 0 6px ${item.color}` }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
