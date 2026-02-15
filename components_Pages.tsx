// ══════════════════════════════════════════════════════
//  ClimateHealth AI — All Page Components
// ══════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import type { ClimateInput, PredictionResponse, CompareResponse } from "../types";
import { DISEASE_CATEGORIES, REGIONS, TREND_DATA, SEASONAL_HEATMAP, getRiskColor, getRiskLabel, getConfidenceScore, generate14DayForecast } from "../utils/riskCalculations";
import RiskGauge from "./RiskGauge";
import { SparkLine, ClimateInputField, DiseaseCard, RecommendationBlock, ProgressBar, LoadingSpinner, StatCard, SectionTitle, Card } from "./UI";
import { LineChart, BarChart, RiskHeatmap, ChartLegend } from "./Charts";

// ── Shared styles ──────────────────────────────────────
const S = {
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } as React.CSSProperties,
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" } as React.CSSProperties,
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" } as React.CSSProperties,
  col:   { display: "flex", flexDirection: "column", gap: "16px" } as React.CSSProperties,
  label: { fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" } as React.CSSProperties,
  select: {
    width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", padding: "10px 14px", color: "#f1f5f9", fontSize: "14px", outline: "none",
  } as React.CSSProperties,
  btnPrimary: {
    background: "linear-gradient(135deg, #0ea5e9, #14b8a6)", border: "none",
    color: "#fff", fontWeight: 700, fontSize: "15px", padding: "14px 24px",
    borderRadius: "12px", cursor: "pointer", width: "100%",
    boxShadow: "0 4px 20px rgba(14,165,233,0.35)", transition: "transform 0.15s, box-shadow 0.15s",
  } as React.CSSProperties,
  btnSecondary: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f1f5f9", fontWeight: 600, fontSize: "13px", padding: "10px 16px",
    borderRadius: "10px", cursor: "pointer", transition: "background 0.2s",
  } as React.CSSProperties,
  badge: (color: string) => ({
    display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
    background: color + "22", color, border: `1px solid ${color}44`,
  }) as React.CSSProperties,
  emptyState: {
    textAlign: "center" as const, padding: "56px 24px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
  },
};

// ═══════════════════════════════════════════════════════
//  1. DASHBOARD PAGE
// ═══════════════════════════════════════════════════════

interface DashboardPageProps {
  climate: ClimateInput;
  prediction: PredictionResponse | null;
  region: string;
  onRegionChange: (r: string) => void;
  onClimateChange: (field: keyof ClimateInput, val: number) => void;
  onRunPrediction: () => void;
  isLoading: boolean;
  onNavigate: (tab: string) => void;
}

export function DashboardPage({ climate, prediction, region, onRegionChange, onClimateChange, onRunPrediction, isLoading, onNavigate }: DashboardPageProps) {
  const riskScore = prediction?.overall_risk_score ?? 0;
  const riskColor = getRiskColor(riskScore);

  const kpiCards = [
    { icon: "🌡️", label: "Temperature", value: `${climate.temperature}°C`, sub: climate.temperature > 35 ? "Extreme heat" : "Moderate",  color: "#f97316", spark: [26,28,30,31,climate.temperature] },
    { icon: "💧", label: "Humidity",    value: `${climate.humidity}%`,       sub: climate.humidity > 75 ? "High — disease risk" : "Normal", color: "#3b82f6", spark: [62,65,70,74,climate.humidity] },
    { icon: "🌧️", label: "Rainfall",   value: `${climate.rainfall} mm`,     sub: "7-day accumulation",                                     color: "#14b8a6", spark: [80,110,140,160,climate.rainfall] },
    { icon: "💨", label: "Air Quality", value: String(climate.aqi),          sub: climate.aqi > 150 ? "Unhealthy" : climate.aqi > 100 ? "Moderate" : "Good", color: climate.aqi > 150 ? "#ef4444" : climate.aqi > 100 ? "#eab308" : "#22c55e", spark: [75,85,95,105,climate.aqi] },
  ];

  return (
    <div style={S.col}>
      {/* KPI Row */}
      <div style={S.grid4}>
        {kpiCards.map((c, i) => (
          <StatCard key={i} icon={c.icon} label={c.label} value={c.value} subLabel={c.sub} color={c.color} sparkData={c.spark} />
        ))}
      </div>

      {/* Middle Row */}
      <div style={S.grid3}>
        {/* Gauge */}
        <Card accent style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <SectionTitle>🎯 Overall Risk Score</SectionTitle>
          <RiskGauge score={riskScore} size={185} />
          {prediction ? (
            <div style={{ textAlign: "center", marginTop: "4px" }}>
              <span style={S.badge(riskColor)}>Confidence: {getConfidenceScore(riskScore)}%</span>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>{region}</div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Run prediction to see results</div>
          )}
        </Card>

        {/* Disease snapshot */}
        <Card>
          <SectionTitle>🦠 Disease Risk Snapshot</SectionTitle>
          {prediction ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {DISEASE_CATEGORIES.map((d) => {
                const score = Math.round(prediction.disease_risks.find((r) => r.disease === d.label)?.risk_score ?? 0);
                const col = getRiskColor(score);
                return (
                  <div key={d.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{d.icon} {d.label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: col }}>{score}%</span>
                    </div>
                    <ProgressBar value={score} color={col} height={6} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", marginTop: "20px" }}>
              Run prediction to see breakdown
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <SectionTitle>⚡ Quick Actions</SectionTitle>
          <div style={S.col}>
            <div>
              <div style={S.label}>Region</div>
              <select value={region} onChange={(e) => onRegionChange(e.target.value)} style={S.select}>
                {REGIONS.map((r) => <option key={r.name} value={r.name} style={{ background: "#0a1628" }}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>UV Index: <span style={{ color: "#0ea5e9" }}>{climate.uv_index}</span></div>
              <input type="range" min={1} max={12} value={climate.uv_index} onChange={(e) => onClimateChange("uv_index", +e.target.value)} style={{ width: "100%", accentColor: "#0ea5e9", cursor: "pointer" }} />
            </div>
            <button onClick={() => onNavigate("input")} style={S.btnSecondary}>✏️ Edit All Climate Data</button>
            <button onClick={onRunPrediction} disabled={isLoading} style={{ ...S.btnPrimary, fontSize: "14px", padding: "12px" }}>
              {isLoading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><LoadingSpinner />Running Model…</span> : "🚀 Run Prediction"}
            </button>
          </div>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <SectionTitle>📈 7-Month Disease Trend</SectionTitle>
          <ChartLegend items={[{ color: "#ef4444", label: "Dengue" }, { color: "#3b82f6", label: "Malaria" }, { color: "#8b5cf6", label: "Respiratory" }]} />
        </div>
        <LineChart data={TREND_DATA} series={[{ key: "dengue", color: "#ef4444", label: "Dengue" }, { key: "malaria", color: "#3b82f6", label: "Malaria" }, { key: "respiratory", color: "#8b5cf6", label: "Respiratory" }]} height={175} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  2. CLIMATE INPUT PAGE
// ═══════════════════════════════════════════════════════

interface ClimateInputPageProps {
  climate: ClimateInput;
  compareClimate: ClimateInput;
  region: string;
  compareRegion: string;
  comparing: boolean;
  prediction: PredictionResponse | null;
  isLoading: boolean;
  isFetching: boolean;
  onClimateChange: (field: keyof ClimateInput, val: number) => void;
  onCompareClimateChange: (field: keyof ClimateInput, val: number) => void;
  onRegionChange: (r: string) => void;
  onCompareRegionChange: (r: string) => void;
  onComparingChange: (v: boolean) => void;
  onFetchLive: () => void;
  onRunPrediction: () => void;
}

export function ClimateInputPage({ climate, compareClimate, region, compareRegion, comparing, prediction, isLoading, isFetching, onClimateChange, onCompareClimateChange, onRegionChange, onCompareRegionChange, onComparingChange, onFetchLive, onRunPrediction }: ClimateInputPageProps) {
  const fields = [
    { key: "temperature" as keyof ClimateInput, label: "Temperature", icon: "🌡️", min: 10, max: 50, unit: "°C",  color: "#f97316" },
    { key: "humidity"    as keyof ClimateInput, label: "Humidity",    icon: "💧", min: 10, max: 100, unit: "%",  color: "#3b82f6" },
    { key: "rainfall"    as keyof ClimateInput, label: "7-Day Rainfall", icon: "🌧️", min: 0, max: 400, unit: "mm", color: "#14b8a6" },
    { key: "aqi"         as keyof ClimateInput, label: "Air Quality Index", icon: "💨", min: 0, max: 300, unit: "", color: "#8b5cf6" },
    { key: "uv_index"    as keyof ClimateInput, label: "UV Index",    icon: "☀️", min: 1, max: 12,  unit: "",   color: "#eab308" },
  ];

  return (
    <div style={S.grid2}>
      {/* LEFT */}
      <div style={S.col}>
        <Card>
          <SectionTitle>📍 Location & Data Source</SectionTitle>
          <div style={S.col}>
            <div>
              <div style={S.label}>Region / City</div>
              <select value={region} onChange={(e) => onRegionChange(e.target.value)} style={S.select}>
                {REGIONS.map((r) => <option key={r.name} value={r.name} style={{ background: "#0a1628" }}>{r.name}, {r.state}</option>)}
              </select>
            </div>
            <button onClick={onFetchLive} disabled={isFetching} style={{ ...S.btnSecondary, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {isFetching ? <><LoadingSpinner size={14} color="#0ea5e9" /> Fetching live data…</> : "🌐 Auto-Fetch Live Climate Data"}
            </button>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", padding: "8px 12px", background: "rgba(14,165,233,0.06)", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.15)" }}>
              💡 Auto-fetch uses Open-Meteo API (free, no API key) to populate real-time climate data
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>🌡️ Climate Parameters</SectionTitle>
          <div style={S.col}>
            {fields.map((f) => (
              <ClimateInputField key={f.key} label={f.label} icon={f.icon} min={f.min} max={f.max}
                value={climate[f.key] as number} unit={f.unit} accentColor={f.color}
                onChange={(val) => onClimateChange(f.key, val)} />
            ))}
          </div>
        </Card>
      </div>

      {/* RIGHT */}
      <div style={S.col}>
        <Card>
          <SectionTitle>🔍 Region Comparison</SectionTitle>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "12px" }}>
            <input type="checkbox" checked={comparing} onChange={(e) => onComparingChange(e.target.checked)} style={{ accentColor: "#0ea5e9", width: "16px", height: "16px" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>Compare with another region</span>
          </label>
          {comparing && (
            <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={S.label}>Compare Region</div>
                <select value={compareRegion} onChange={(e) => onCompareRegionChange(e.target.value)} style={S.select}>
                  {REGIONS.filter((r) => r.name !== region).map((r) => <option key={r.name} value={r.name} style={{ background: "#0a1628" }}>{r.name}</option>)}
                </select>
              </div>
              {fields.slice(0, 3).map((f) => (
                <ClimateInputField key={f.key} label={`Compare ${f.label}`} icon={f.icon} min={f.min} max={f.max}
                  value={compareClimate[f.key] as number} unit={f.unit} accentColor="#a78bfa"
                  onChange={(val) => onCompareClimateChange(f.key, val)} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>📁 Bulk Dataset Upload</SectionTitle>
          <div style={{ border: "2px dashed rgba(255,255,255,0.12)", borderRadius: "12px", padding: "28px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(14,165,233,0.5)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Drop CSV / Excel dataset here</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>or click to browse files</div>
            <div style={{ marginTop: "10px", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>WHO format · NASA POWER format · Custom CSV</div>
          </div>
        </Card>

        <Card accent style={{ textAlign: "center", padding: "24px" }}>
          {prediction && (
            <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(34,197,94,0.1)", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600 }}>✅ Last: {getRiskLabel(prediction.overall_risk_score)} Risk ({prediction.overall_risk_score.toFixed(0)}/100)</div>
            </div>
          )}
          <button onClick={onRunPrediction} disabled={isLoading} style={{ ...S.btnPrimary, fontSize: "16px", padding: "16px" }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.target as HTMLButtonElement).style.boxShadow = "0 8px 30px rgba(14,165,233,0.5)"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = ""; (e.target as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(14,165,233,0.35)"; }}>
            {isLoading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <LoadingSpinner /> Running XGBoost Model…
              </span>
            ) : "🚀 Run Disease Risk Prediction"}
          </button>
          {isLoading && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "10px" }}>Analysing 47 climate–disease correlations…</div>}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  3. RISK ANALYSIS PAGE
// ═══════════════════════════════════════════════════════

interface RiskAnalysisPageProps {
  prediction: PredictionResponse | null;
  compareResult: CompareResponse | null;
  region: string;
  compareRegion: string;
  comparing: boolean;
  primaryRiskFactor: string;
  onNavigate: (tab: string) => void;
}

export function RiskAnalysisPage({ prediction, compareResult, region, compareRegion, comparing, primaryRiskFactor, onNavigate }: RiskAnalysisPageProps) {
  if (!prediction) {
    return (
      <div style={S.emptyState}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔬</div>
        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>No Prediction Yet</div>
        <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "24px" }}>Configure climate data and run the AI model to see risk analysis</div>
        <button onClick={() => onNavigate("input")} style={{ ...S.btnPrimary, width: "auto", padding: "12px 28px" }}>Go to Climate Input →</button>
      </div>
    );
  }

  const riskScore = prediction.overall_risk_score;
  const riskColor = getRiskColor(riskScore);
  const confidence = getConfidenceScore(riskScore);
  const forecast = generate14DayForecast(riskScore);

  return (
    <div style={S.col}>
      {/* Main risk + compare */}
      <div style={comparing && compareResult ? S.grid2 : { display: "block" }}>
        <Card accent>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <SectionTitle>🎯 {region} — Risk Analysis</SectionTitle>
            <span style={S.badge(riskColor)}>{getRiskLabel(riskScore)}</span>
          </div>
          <div style={S.grid2}>
            <RiskGauge score={riskScore} size={175} />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
              {[
                { label: "Risk Score",       val: <span style={{ fontSize: "28px", fontWeight: 800, color: riskColor }}>{riskScore.toFixed(0)}<span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>/100</span></span> },
                { label: "Model Confidence", val: <><ProgressBar value={confidence} color="#22c55e" height={8} /><span style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>{confidence}%</span></> },
                { label: "Primary Factor",   val: <span style={{ fontSize: "12px", color: "#f1f5f9" }}>{primaryRiskFactor}</span> },
              ].map((item, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                  <div style={S.label}>{item.label}</div>
                  <div style={{ marginTop: "4px" }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {comparing && compareResult && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <SectionTitle>⚖️ {compareRegion} — Comparison</SectionTitle>
              <span style={S.badge(getRiskColor(compareResult.region_b.overall_score))}>{compareResult.region_b.overall_label}</span>
            </div>
            <div style={S.grid2}>
              <RiskGauge score={compareResult.region_b.overall_score} size={175} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                  <div style={S.label}>Comparison Score</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: getRiskColor(compareResult.region_b.overall_score) }}>{compareResult.region_b.overall_score.toFixed(0)}<span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>/100</span></div>
                </div>
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                  <div style={S.label}>Score Difference</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: riskScore > compareResult.region_b.overall_score ? "#ef4444" : "#22c55e" }}>
                    {riskScore > compareResult.region_b.overall_score ? "+" : ""}{(riskScore - compareResult.region_b.overall_score).toFixed(0)}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{region} is {riskScore > compareResult.region_b.overall_score ? "higher" : "lower"} risk</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Disease cards */}
      <div>
        <SectionTitle>🦠 Disease Category Risk Breakdown</SectionTitle>
        <div style={S.grid4}>
          {DISEASE_CATEGORIES.map((d) => {
            const risk = prediction.disease_risks.find((r) => r.disease === d.label);
            return <DiseaseCard key={d.id} icon={d.icon} label={d.label} examples={d.examples} score={Math.round(risk?.risk_score ?? 0)} color={d.color} />;
          })}
        </div>
      </div>

      {/* 14-day forecast */}
      <Card>
        <SectionTitle>📅 14-Day Risk Forecast</SectionTitle>
        <BarChart data={forecast.map((f) => ({ label: f.label, value: f.risk_score, color: getRiskColor(f.risk_score) }))} height={160} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  4. RECOMMENDATIONS PAGE
// ═══════════════════════════════════════════════════════

interface RecommendationsPageProps {
  prediction: PredictionResponse | null;
  region: string;
  onNavigate: (tab: string) => void;
}

export function RecommendationsPage({ prediction, region, onNavigate }: RecommendationsPageProps) {
  if (!prediction) {
    return (
      <div style={S.emptyState}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>💊</div>
        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Run Prediction First</div>
        <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "24px" }}>Recommendations are generated from your specific climate conditions and risk profile</div>
        <button onClick={() => onNavigate("input")} style={{ ...S.btnPrimary, width: "auto", padding: "12px 28px" }}>Configure & Run Prediction →</button>
      </div>
    );
  }

  const riskColor = getRiskColor(prediction.overall_risk_score);

  return (
    <div style={S.col}>
      <Card accent style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "16px" }}>AI-Generated Health Recommendations · {region}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {prediction.model_version}
          </div>
        </div>
        <span style={S.badge(riskColor)}>Risk: {prediction.overall_risk_score.toFixed(0)}/100 · {prediction.overall_risk_label}</span>
      </Card>

      {prediction.recommendations.map((rec, i) => (
        <RecommendationBlock key={i} recommendation={rec} />
      ))}

      <Card style={{ textAlign: "center", padding: "24px" }}>
        <div style={{ fontWeight: 600, marginBottom: "6px" }}>📄 Export Health Risk Report</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>Download for district health officers, ASHA workers, or research purposes</div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          {["📄 Download PDF", "📋 Copy as Text", "📧 Email to Team", "💾 Save to Drive"].map((btn) => (
            <button key={btn} style={S.btnSecondary}>{btn}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  5. ANALYTICS PAGE
// ═══════════════════════════════════════════════════════

interface AnalyticsPageProps {
  prediction: PredictionResponse | null;
}

export function AnalyticsPage({ prediction }: AnalyticsPageProps) {
  return (
    <div style={S.col}>
      <div style={S.grid2}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <SectionTitle>📈 Climate Trend</SectionTitle>
            <ChartLegend items={[{ color: "#f97316", label: "Temperature" }, { color: "#3b82f6", label: "Humidity" }]} />
          </div>
          <LineChart data={TREND_DATA} series={[{ key: "temp", color: "#f97316", label: "Temperature" }, { key: "humidity", color: "#3b82f6", label: "Humidity" }]} height={165} />
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <SectionTitle>🦠 Disease Trends</SectionTitle>
            <ChartLegend items={[{ color: "#ef4444", label: "Dengue" }, { color: "#3b82f6", label: "Malaria" }, { color: "#8b5cf6", label: "Respiratory" }]} />
          </div>
          <LineChart data={TREND_DATA} series={[{ key: "dengue", color: "#ef4444", label: "Dengue" }, { key: "malaria", color: "#3b82f6", label: "Malaria" }, { key: "respiratory", color: "#8b5cf6", label: "Respiratory" }]} height={165} />
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <SectionTitle>🗓️ Seasonal Risk Heatmap</SectionTitle>
          <ChartLegend items={[{ color: "#22c55e", label: "Low (<25)" }, { color: "#eab308", label: "Mod (25–50)" }, { color: "#f97316", label: "High (50–75)" }, { color: "#ef4444", label: "Critical (75+)" }]} />
        </div>
        <RiskHeatmap heatmapData={SEASONAL_HEATMAP} />
      </Card>

      <div style={S.grid3}>
        {/* Highest Risk Regions */}
        <Card>
          <SectionTitle>🏆 Highest Risk Regions</SectionTitle>
          {[
            { region: "Delhi NCR", score: 78, change: "+4", state: "Delhi" },
            { region: "Kolkata",   score: 74, change: "+2", state: "West Bengal" },
            { region: "Mumbai",    score: 72, change: "-1", state: "Maharashtra" },
            { region: "Hyderabad", score: 68, change: "+3", state: "Telangana" },
            { region: "Visakhapatnam", score: 62, change: "0", state: "AP" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.4)", width: "18px" }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{r.region}</div>
                <div style={{ marginTop: "4px" }}><ProgressBar value={r.score} color={getRiskColor(r.score)} height={4} /></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: getRiskColor(r.score) }}>{r.score}</div>
                <div style={{ fontSize: "10px", color: r.change.startsWith("+") ? "#ef4444" : r.change === "0" ? "rgba(255,255,255,0.4)" : "#22c55e" }}>{r.change}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Historical */}
        <Card>
          <SectionTitle>📊 Historical Comparison</SectionTitle>
          <BarChart data={[
            { label: "2020", value: 42, color: "#3b82f6" },
            { label: "2021", value: 55, color: "#3b82f6" },
            { label: "2022", value: 61, color: "#f97316" },
            { label: "2023", value: 58, color: "#eab308" },
            { label: "2024", value: 68, color: "#ef4444" },
          ]} height={160} />
        </Card>

        {/* Model Performance */}
        <Card>
          <SectionTitle>🎯 Model Accuracy</SectionTitle>
          {[
            { label: "Dengue Prediction",    accuracy: 89 },
            { label: "Malaria Risk",         accuracy: 84 },
            { label: "Respiratory",          accuracy: 82 },
            { label: "Heat Illness",         accuracy: 91 },
            { label: "Water-Borne",          accuracy: 86 },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{m.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>{m.accuracy}%</span>
              </div>
              <ProgressBar value={m.accuracy} color="#22c55e" height={6} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
