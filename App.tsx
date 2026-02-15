// ══════════════════════════════════════════════════════
//  ClimateHealth AI — App.tsx (Root Component)
// ══════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import type { ClimateInput } from "./types";
import { useClimateHealth } from "./hooks/useClimateHealth";
import { calcOverallRiskScore, getPrimaryRiskFactor, REGIONS } from "./utils/riskCalculations";
import { AlertBanner, LoadingSpinner } from "./components/UI";
import { DashboardPage, ClimateInputPage, RiskAnalysisPage, RecommendationsPage, AnalyticsPage } from "./components/Pages";

// ── Tab config ─────────────────────────────────────────
const TABS = [
  { id: "dashboard",       label: "🏠 Dashboard"       },
  { id: "input",           label: "🌡️ Climate Input"    },
  { id: "prediction",      label: "🔬 Risk Analysis"    },
  { id: "recommendations", label: "💊 Recommendations" },
  { id: "analytics",       label: "📊 Analytics"        },
] as const;
type TabId = typeof TABS[number]["id"];

// ── Default climate state ─────────────────────────────
const DEFAULT_CLIMATE: ClimateInput = { temperature: 32, humidity: 78, rainfall: 180, aqi: 112, uv_index: 7, region: "Visakhapatnam" };
const DEFAULT_COMPARE: ClimateInput = { temperature: 28, humidity: 65, rainfall: 90, aqi: 85, uv_index: 6, region: "Hyderabad" };

export default function App() {
  const [activeTab, setActiveTab]         = useState<TabId>("dashboard");
  const [appReady, setAppReady]           = useState(false);
  const [alertVisible, setAlertVisible]   = useState(false);
  const [region, setRegion]               = useState("Visakhapatnam");
  const [compareRegion, setCompareRegion] = useState("Hyderabad");
  const [comparing, setComparing]         = useState(false);
  const [climate, setClimate]             = useState<ClimateInput>(DEFAULT_CLIMATE);
  const [compareClimate, setCompareClimate] = useState<ClimateInput>(DEFAULT_COMPARE);

  const { prediction, compareResult, isLoading, isFetching, isOfflineMode, runPrediction, runComparison, fetchLiveClimate } = useClimateHealth();

  // Loading screen
  useEffect(() => { setTimeout(() => setAppReady(true), 1500); }, []);

  // Show alert when risk is high
  useEffect(() => {
    if (prediction && prediction.overall_risk_score >= 60) setAlertVisible(true);
  }, [prediction]);

  const handleClimateChange = (field: keyof ClimateInput, val: number) => {
    setClimate((prev) => ({ ...prev, [field]: val }));
  };
  const handleCompareClimateChange = (field: keyof ClimateInput, val: number) => {
    setCompareClimate((prev) => ({ ...prev, [field]: val }));
  };
  const handleRegionChange = (r: string) => {
    setRegion(r);
    setClimate((prev) => ({ ...prev, region: r }));
  };
  const handleCompareRegionChange = (r: string) => {
    setCompareRegion(r);
    setCompareClimate((prev) => ({ ...prev, region: r }));
  };

  const handleFetchLive = async () => {
    const data = await fetchLiveClimate(region);
    if (data) setClimate((prev) => ({ ...prev, ...data }));
  };

  const handleRunPrediction = async () => {
    await runPrediction({ ...climate, region });
    if (comparing) await runComparison({ ...climate, region }, { ...compareClimate, region: compareRegion });
    setActiveTab("prediction");
  };

  // ── Styles ─────────────────────────────────────────
  const css = {
    app: {
      minHeight: "100vh",
      background: "#060d1a",
      color: "#f1f5f9",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      position: "relative" as const,
    },
    bgGlow: {
      position: "fixed" as const, inset: 0, pointerEvents: "none" as const, zIndex: 0,
      background: `
        radial-gradient(ellipse 65% 55% at 8% 18%, rgba(14,165,233,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 55% 45% at 92% 72%, rgba(20,184,166,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 40% 35% at 50% 88%, rgba(59,130,246,0.04) 0%, transparent 60%)
      `,
    },
    nav: {
      position: "sticky" as const, top: 0, zIndex: 100,
      background: "rgba(6,13,26,0.94)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      padding: "0 24px", display: "flex", alignItems: "center", gap: "4px", height: "64px",
    },
    logo: {
      display: "flex", alignItems: "center", gap: "10px", marginRight: "24px",
      fontWeight: 800, fontSize: "16px", letterSpacing: "-0.3px",
      background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
      WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const,
      flexShrink: 0,
    },
    navBtn: (active: boolean) => ({
      padding: "8px 14px", borderRadius: "8px 8px 0 0", border: "none",
      background: active ? "rgba(14,165,233,0.12)" : "transparent",
      color: active ? "#0ea5e9" : "rgba(255,255,255,0.5)",
      cursor: "pointer", fontSize: "13px", fontWeight: active ? 600 : 400,
      borderBottom: active ? "2px solid #0ea5e9" : "2px solid transparent",
      transition: "all 0.2s", whiteSpace: "nowrap" as const,
    }),
    main: { position: "relative" as const, zIndex: 1, padding: "28px 24px", maxWidth: "1400px", margin: "0 auto" },
  };

  // ── Loading screen ────────────────────────────────
  if (!appReady) {
    return (
      <div style={{ ...css.app, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <div style={css.bgGlow} />
        <div style={{ fontSize: "44px", animation: "spin 2.5s linear infinite" }}>🌍</div>
        <div style={{ ...css.logo, fontSize: "22px" }}>🌿 ClimateHealth AI</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>Initialising climate–health intelligence systems…</div>
        <div style={{ width: "220px", height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #0ea5e9, #14b8a6)", borderRadius: "2px", animation: "loadBar 1.5s ease forwards" }} />
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes loadBar{from{width:0}to{width:100%}}`}</style>
      </div>
    );
  }

  return (
    <div style={css.app}>
      <div style={css.bgGlow} />

      {/* High-risk alert banner */}
      {alertVisible && prediction && (
        <AlertBanner score={Math.round(prediction.overall_risk_score)} region={region} onDismiss={() => setAlertVisible(false)} />
      )}

      {/* Navigation */}
      <nav style={css.nav}>
        <div style={css.logo}>
          <span style={{ fontSize: "22px" }}>🌿</span>
          <span>ClimateHealth AI</span>
        </div>

        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={css.navBtn(activeTab === t.id)}>
            {t.label}
          </button>
        ))}

        {/* Right side */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          {isOfflineMode && (
            <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "20px", background: "rgba(234,179,8,0.12)", color: "#eab308", border: "1px solid rgba(234,179,8,0.25)" }}>
              ⚡ Demo Mode
            </span>
          )}
          <div style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.22)" }}>
            ● Live
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", padding: "6px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            📍 {region}
          </div>
        </div>
      </nav>

      {/* Page header */}
      <div style={{ ...css.main, paddingBottom: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "21px", fontWeight: 800, letterSpacing: "-0.4px" }}>
              Integrated Climate-Driven Disease Risk Prediction System
            </h1>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>
              AI-powered preventive healthcare intelligence · {region} ·{" "}
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {prediction && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>Current Risk</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: prediction.overall_risk_score >= 75 ? "#ef4444" : prediction.overall_risk_score >= 50 ? "#f97316" : prediction.overall_risk_score >= 25 ? "#eab308" : "#22c55e" }}>
                {prediction.overall_risk_label}
              </div>
            </div>
          )}
        </div>

        {/* Active tab content */}
        {activeTab === "dashboard" && (
          <DashboardPage climate={climate} prediction={prediction} region={region}
            onRegionChange={handleRegionChange} onClimateChange={handleClimateChange}
            onRunPrediction={handleRunPrediction} isLoading={isLoading} onNavigate={setActiveTab} />
        )}
        {activeTab === "input" && (
          <ClimateInputPage climate={climate} compareClimate={compareClimate} region={region}
            compareRegion={compareRegion} comparing={comparing} prediction={prediction}
            isLoading={isLoading} isFetching={isFetching}
            onClimateChange={handleClimateChange} onCompareClimateChange={handleCompareClimateChange}
            onRegionChange={handleRegionChange} onCompareRegionChange={handleCompareRegionChange}
            onComparingChange={setComparing} onFetchLive={handleFetchLive} onRunPrediction={handleRunPrediction} />
        )}
        {activeTab === "prediction" && (
          <RiskAnalysisPage prediction={prediction} compareResult={compareResult}
            region={region} compareRegion={compareRegion} comparing={comparing}
            primaryRiskFactor={prediction ? getPrimaryRiskFactor(climate) : ""}
            onNavigate={setActiveTab} />
        )}
        {activeTab === "recommendations" && (
          <RecommendationsPage prediction={prediction} region={region} onNavigate={setActiveTab} />
        )}
        {activeTab === "analytics" && (
          <AnalyticsPage prediction={prediction} />
        )}
      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "24px", fontSize: "11px", color: "rgba(255,255,255,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "32px" }}>
        ClimateHealth AI · Integrated Climate-Driven Disease Risk Prediction ·{" "}
        XGBoost + FastAPI + React · Final Year Project ·{" "}
        <span style={{ color: "#0ea5e9" }}>Hackathon Ready</span>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input[type=range] { height: 4px; }
        select option { background: #0a1628; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
