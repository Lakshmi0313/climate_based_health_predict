// ══════════════════════════════════════════════════════
//  ClimateHealth AI — Shared UI Components
// ══════════════════════════════════════════════════════

import type { DiseaseRisk, Recommendation } from "../types";
import { getRiskColor, getRiskLabel } from "../utils/riskCalculations";

// ── SparkLine ──────────────────────────────────────────

interface SparkLineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function SparkLine({ data, color = "#3b82f6", width = 120, height = 40 }: SparkLineProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const lastPt = pts.split(" ").at(-1)!.split(",");

  return (
    <svg width={width} height={height} style={{ overflow: "visible", flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} />
    </svg>
  );
}

// ── ClimateInputField ──────────────────────────────────

interface ClimateInputFieldProps {
  label: string;
  icon: string;
  min: number;
  max: number;
  value: number;
  unit: string;
  accentColor?: string;
  onChange: (value: number) => void;
}

export function ClimateInputField({
  label, icon, min, max, value, unit, accentColor = "#0ea5e9", onChange,
}: ClimateInputFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
          {icon} {label}
        </label>
        <span style={{ fontSize: "14px", fontWeight: 700, color: accentColor }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor, cursor: "pointer", margin: "2px 0" }}
        />
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: "70px", padding: "8px", textAlign: "center",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── DiseaseCard ────────────────────────────────────────

interface DiseaseCardProps {
  icon: string;
  label: string;
  examples: string;
  score: number;
  color: string;
}

export function DiseaseCard({ icon, label, examples, score, color }: DiseaseCardProps) {
  const riskColor = getRiskColor(score);
  const riskLabel = getRiskLabel(score);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${riskColor}33`,
        borderRadius: "14px", padding: "16px", cursor: "default",
        transition: "border-color 0.2s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = riskColor + "77";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = riskColor + "33";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ fontSize: "22px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px", color: "#f1f5f9" }}>{label}</div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "10px", lineHeight: 1.4 }}>{examples}</div>

      {/* Progress bar */}
      <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.07)", marginBottom: "8px" }}>
        <div style={{
          height: "6px", borderRadius: "3px",
          background: `linear-gradient(90deg, ${riskColor}, ${riskColor}99)`,
          width: `${score}%`,
          boxShadow: `0 0 8px ${riskColor}55`,
          transition: "width 0.9s ease",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
          background: riskColor + "22", color: riskColor, border: `1px solid ${riskColor}44`,
        }}>
          {riskLabel}
        </span>
        <span style={{ fontSize: "18px", fontWeight: 800, color: riskColor }}>{score}%</span>
      </div>
    </div>
  );
}

// ── RecommendationBlock ────────────────────────────────

interface RecommendationBlockProps {
  recommendation: Recommendation;
}

export function RecommendationBlock({ recommendation: rec }: RecommendationBlockProps) {
  const typeConfig = {
    critical: { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.3)",  accent: "#ef4444", tag: "🔴 CRITICAL" },
    warning:  { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)", accent: "#f97316", tag: "🟠 WARNING"  },
    info:     { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)", accent: "#3b82f6", tag: "🔵 ADVISORY" },
    success:  { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.3)",  accent: "#22c55e", tag: "🟢 ROUTINE"  },
  }[rec.type];

  return (
    <div style={{ background: typeConfig.bg, border: `1px solid ${typeConfig.border}`, borderRadius: "16px", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <span style={{ fontSize: "24px" }}>{rec.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", color: typeConfig.accent }}>{rec.disease}</div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            {typeConfig.tag}
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: typeConfig.accent + "22", color: typeConfig.accent, border: `1px solid ${typeConfig.accent}44` }}>
          Risk: {rec.risk_score}%
        </div>
      </div>

      {/* Actions grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {rec.actions.map((action, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: "10px",
            padding: "10px 14px", background: "rgba(255,255,255,0.04)",
            borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ color: typeConfig.accent, fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>
            <span style={{ fontSize: "13px", lineHeight: 1.5, color: "#e2e8f0" }}>{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AlertBanner ────────────────────────────────────────

interface AlertBannerProps {
  score: number;
  region: string;
  onDismiss: () => void;
}

export function AlertBanner({ score, region, onDismiss }: AlertBannerProps) {
  return (
    <div style={{
      position: "fixed", top: "64px", left: 0, right: 0, zIndex: 200,
      background: "linear-gradient(90deg, rgba(239,68,68,0.92), rgba(249,115,22,0.92))",
      backdropFilter: "blur(12px)",
      padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid rgba(239,68,68,0.4)",
      animation: "slideDown 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "20px" }}>⚠️</span>
        <strong style={{ color: "#fff", fontSize: "14px" }}>HIGH RISK ALERT — {region}</strong>
        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px" }}>
          Risk score {score}/100 · Immediate preventive action recommended
        </span>
      </div>
      <button
        onClick={onDismiss}
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "20px", opacity: 0.8 }}
      >
        ✕
      </button>
      <style>{`@keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

// ── ProgressBar ────────────────────────────────────────

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = "#0ea5e9", height = 8 }: ProgressBarProps) {
  return (
    <div style={{ height, borderRadius: height / 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: height / 2, width: `${value}%`,
        background: `linear-gradient(90deg, ${color}, ${color}99)`,
        boxShadow: `0 0 8px ${color}55`,
        transition: "width 0.9s ease",
      }} />
    </div>
  );
}

// ── LoadingSpinner ─────────────────────────────────────

export function LoadingSpinner({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <>
      <span style={{
        display: "inline-block", width: size, height: size,
        border: `2px solid rgba(255,255,255,0.3)`,
        borderTopColor: color, borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        flexShrink: 0,
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── StatCard ───────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subLabel: string;
  color: string;
  sparkData?: number[];
}

export function StatCard({ icon, label, value, subLabel, color, sparkData }: StatCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px", padding: "18px",
        backdropFilter: "blur(10px)", transition: "border-color 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = color + "66"}
      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>
            {icon} {label}
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{subLabel}</div>
        </div>
        {sparkData && <SparkLine data={sparkData} color={color} />}
      </div>
    </div>
  );
}

// ── SectionTitle ───────────────────────────────────────

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
      {children}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────

export function Card({ children, accent = false, style = {} }: { children: React.ReactNode; accent?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: accent ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.04)",
      border: accent ? "1px solid rgba(14,165,233,0.25)" : "1px solid rgba(255,255,255,0.08)",
      borderRadius: "16px", padding: "20px",
      backdropFilter: "blur(10px)",
      ...style,
    }}>
      {children}
    </div>
  );
}
