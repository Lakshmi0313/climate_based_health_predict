// ══════════════════════════════════════════════════════
//  ClimateHealth AI — RiskGauge Component
// ══════════════════════════════════════════════════════

import { getRiskColor, getRiskLabel } from "../utils/riskCalculations";

interface RiskGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function RiskGauge({ score, size = 200, showLabel = true }: RiskGaugeProps) {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -200;
  const endAngle = 20;
  const totalArc = endAngle - startAngle;
  const fillArc = (score / 100) * totalArc;
  const color = getRiskColor(score);
  const needleAngle = startAngle + fillArc;
  const needleEnd = polarToXY(cx, cy, r * 0.75, needleAngle);

  return (
    <svg
      width={size}
      height={size * 0.75}
      style={{ display: "block", margin: "0 auto", overflow: "visible" }}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`gauge-grad-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="35%" stopColor="#eab308" />
          <stop offset="65%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background track */}
      <path
        d={describeArc(cx, cy, r, startAngle, endAngle)}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={size * 0.065}
        strokeLinecap="round"
      />

      {/* Colored fill */}
      {score > 0 && (
        <path
          d={describeArc(cx, cy, r, startAngle, startAngle + fillArc)}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.065}
          strokeLinecap="round"
          filter="url(#glow)"
          style={{
            transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      )}

      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map((tick) => {
        const angle = startAngle + (tick / 100) * totalArc;
        const outer = polarToXY(cx, cy, r + size * 0.045, angle);
        const inner = polarToXY(cx, cy, r - size * 0.045, angle);
        return (
          <line
            key={tick}
            x1={outer.x} y1={outer.y}
            x2={inner.x} y2={inner.y}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={needleEnd.x} y2={needleEnd.y}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ transition: "all 1s ease", filter: `drop-shadow(0 0 4px ${color})` }}
      />
      <circle cx={cx} cy={cy} r={size * 0.04} fill={color} />
      <circle cx={cx} cy={cy} r={size * 0.025} fill="rgba(6,13,26,0.9)" />

      {/* Zone labels */}
      <text x={cx * 0.22} y={cy * 1.14} fill="#22c55e" fontSize={size * 0.062} textAnchor="middle" fontFamily="Arial">LOW</text>
      <text x={cx}         y={cy * 1.38} fill="#eab308" fontSize={size * 0.058} textAnchor="middle" fontFamily="Arial">MOD</text>
      <text x={cx * 1.78} y={cy * 1.14} fill="#ef4444" fontSize={size * 0.058} textAnchor="middle" fontFamily="Arial">CRIT</text>

      {/* Score */}
      <text
        x={cx} y={cy * 0.88}
        fill={color}
        fontSize={size * 0.20}
        fontWeight="800"
        textAnchor="middle"
        fontFamily="Arial"
        style={{ transition: "fill 0.8s ease" }}
      >
        {score}
      </text>

      {/* Label */}
      {showLabel && (
        <text
          x={cx} y={cy * 1.08}
          fill="rgba(255,255,255,0.65)"
          fontSize={size * 0.072}
          textAnchor="middle"
          fontFamily="Arial"
        >
          {getRiskLabel(score)}
        </text>
      )}
    </svg>
  );
}
