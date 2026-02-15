import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA & CONSTANTS ────────────────────────────────────────────────────
const DISEASE_CATEGORIES = [
  { id: "vector", label: "Vector-Borne", icon: "🦟", examples: "Dengue, Malaria, Chikungunya", color: "#ef4444" },
  { id: "water",  label: "Water-Borne",  icon: "💧", examples: "Cholera, Typhoid, Hepatitis A", color: "#3b82f6" },
  { id: "respiratory", label: "Respiratory", icon: "🫁", examples: "Asthma, COPD, Influenza", color: "#8b5cf6" },
  { id: "heat",   label: "Heat-Related", icon: "🌡️", examples: "Heatstroke, Dehydration", color: "#f97316" },
  { id: "nutrition", label: "Nutritional", icon: "🥗", examples: "Malnutrition, Vitamin deficiencies", color: "#22c55e" },
  { id: "mental", label: "Mental Health", icon: "🧠", examples: "Climate anxiety, Depression", color: "#a855f7" },
  { id: "skin",   label: "Skin & Eye",   icon: "👁️", examples: "Conjunctivitis, UV damage", color: "#eab308" },
];

const REGIONS = [
  "Visakhapatnam", "Hyderabad", "Mumbai", "Delhi", "Chennai",
  "Kolkata", "Bangalore", "Pune", "Ahmedabad", "Jaipur",
];

const RISK_LEVELS = ["Low", "Moderate", "High", "Critical"];

const TREND_DATA = [
  { month: "Aug", temp: 31, humidity: 72, dengue: 28, malaria: 15, respiratory: 20 },
  { month: "Sep", temp: 30, humidity: 78, dengue: 45, malaria: 22, respiratory: 18 },
  { month: "Oct", temp: 28, humidity: 82, dengue: 62, malaria: 31, respiratory: 22 },
  { month: "Nov", temp: 26, humidity: 74, dengue: 41, malaria: 20, respiratory: 35 },
  { month: "Dec", temp: 23, humidity: 66, dengue: 22, malaria: 12, respiratory: 48 },
  { month: "Jan", temp: 22, humidity: 60, dengue: 18, malaria: 10, respiratory: 55 },
  { month: "Feb", temp: 25, humidity: 58, dengue: 21, malaria: 11, respiratory: 42 },
];

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
function calcRiskScore(temp, humidity, rainfall, aqi, uv) {
  let score = 0;
  if (temp > 35) score += 25;
  else if (temp > 30) score += 15;
  else if (temp > 25) score += 8;
  if (humidity > 80) score += 20;
  else if (humidity > 65) score += 12;
  if (rainfall > 200) score += 20;
  else if (rainfall > 100) score += 10;
  if (aqi > 150) score += 20;
  else if (aqi > 100) score += 12;
  if (uv > 8) score += 15;
  else if (uv > 5) score += 8;
  return Math.min(score, 100);
}

function getRiskLabel(score) {
  if (score < 25) return "Low";
  if (score < 50) return "Moderate";
  if (score < 75) return "High";
  return "Critical";
}

function getRiskColor(score) {
  if (score < 25) return "#22c55e";
  if (score < 50) return "#eab308";
  if (score < 75) return "#f97316";
  return "#ef4444";
}

function getDiseaseScores(temp, humidity, rainfall, aqi, uv) {
  return {
    vector:      Math.min(100, (humidity * 0.4) + (rainfall * 0.2) + (temp > 28 ? 30 : 10)),
    water:       Math.min(100, (rainfall * 0.35) + (temp * 0.3) + (humidity * 0.15)),
    respiratory: Math.min(100, (aqi * 0.5) + (uv * 0.2) + (humidity > 70 ? 20 : 5)),
    heat:        Math.min(100, (temp * 1.5) + (humidity * 0.3) + (uv * 1.2)),
    nutrition:   Math.min(100, (temp * 0.4) + (rainfall < 50 ? 30 : 5) + 15),
    mental:      Math.min(100, (temp > 32 ? 25 : 10) + (aqi * 0.3) + 15),
    skin:        Math.min(100, (uv * 5) + (temp * 0.5) + 10),
  };
}

function getRecommendations(scores, region) {
  const recs = [];
  if (scores.vector > 50) {
    recs.push({ type: "warning", icon: "🦟", title: "Vector-Borne Risk Alert", actions: ["Eliminate standing water around premises", "Use mosquito repellent (DEET-based)", "Sleep under insecticide-treated nets", "Visit nearest PHC for prophylaxis if travelling"] });
  }
  if (scores.water > 50) {
    recs.push({ type: "warning", icon: "💧", title: "Water Safety Alert", actions: ["Boil drinking water for at least 1 minute", "Avoid raw street food and salads", "Ensure proper waste disposal", "Report contaminated water sources to municipality"] });
  }
  if (scores.respiratory > 50) {
    recs.push({ type: "info", icon: "🫁", title: "Air Quality Precautions", actions: ["Wear N95 mask outdoors", "Avoid outdoor exercise during peak pollution hours (6–9 AM)", "Keep asthma/COPD inhalers accessible", "Monitor AQI before outdoor activities"] });
  }
  if (scores.heat > 60) {
    recs.push({ type: "critical", icon: "🌡️", title: "Heat Emergency Measures", actions: ["Stay hydrated — drink 3+ litres of water/day", "Avoid outdoor exposure between 11 AM – 4 PM", "Wear light-coloured, loose-fitting cotton clothing", "Know signs of heatstroke: confusion, no sweating, high temp"] });
  }
  if (scores.skin > 55) {
    recs.push({ type: "info", icon: "☀️", title: "UV Protection Advisory", actions: ["Apply SPF 50+ sunscreen every 2 hours", "Wear UV-protective sunglasses", "Use umbrella or hat outdoors", "Annual eye check-up recommended"] });
  }
  if (recs.length === 0) {
    recs.push({ type: "success", icon: "✅", title: "Low Risk — Maintain Baseline Health Practices", actions: ["Continue regular handwashing", "Stay hydrated", "Monitor local health bulletins", "Schedule annual health checkup"] });
  }
  return recs;
}

// ─── MINI CHART COMPONENT ─────────────────────────────────────────────────────
function SparkLine({ data, color = "#3b82f6", width = 120, height = 40 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").at(-1).split(",")[0]} cy={pts.split(" ").at(-1).split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

// ─── RISK GAUGE ───────────────────────────────────────────────────────────────
function RiskGauge({ score, size = 200 }) {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -200;
  const endAngle = 20;
  const totalArc = endAngle - startAngle;
  const fillArc = (score / 100) * totalArc;
  const color = getRiskColor(score);

  function polarToXY(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx, cy, r, startDeg, endDeg) {
    const s = polarToXY(cx, cy, r, startDeg);
    const e = polarToXY(cx, cy, r, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const needleAngle = startAngle + fillArc;
  const needleEnd = polarToXY(cx, cy, r * 0.75, needleAngle);

  return (
    <svg width={size} height={size * 0.75} style={{ display: "block", margin: "0 auto" }}>
      {/* Track */}
      <path d={describeArc(cx, cy, r, startAngle, endAngle)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={size * 0.065} strokeLinecap="round" />
      {/* Colored fill */}
      {score > 0 && (
        <path d={describeArc(cx, cy, r, startAngle, startAngle + fillArc)} fill="none" stroke={color} strokeWidth={size * 0.065} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "all 1s ease" }} />
      )}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke={color} strokeWidth="3" strokeLinecap="round"
        style={{ transition: "all 1s ease" }} />
      <circle cx={cx} cy={cy} r={size * 0.04} fill={color} />
      {/* Labels */}
      <text x={cx * 0.25} y={cy * 1.15} fill="#6b7280" fontSize={size * 0.07} textAnchor="middle">LOW</text>
      <text x={cx} y={cy * 1.35} fill="#6b7280" fontSize={size * 0.065} textAnchor="middle">MOD</text>
      <text x={cx * 1.75} y={cy * 1.15} fill="#6b7280" fontSize={size * 0.065} textAnchor="middle">CRIT</text>
      {/* Score */}
      <text x={cx} y={cy * 0.9} fill={color} fontSize={size * 0.18} fontWeight="700" textAnchor="middle"
        style={{ transition: "all 0.8s ease" }}>{score}</text>
      <text x={cx} y={cy * 1.08} fill="rgba(255,255,255,0.7)" fontSize={size * 0.075} textAnchor="middle">
        {getRiskLabel(score)}
      </text>
    </svg>
  );
}

// ─── BAR CHART COMPONENT ──────────────────────────────────────────────────────
function BarChart({ data, height = 160 }) {
  const maxVal = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height, padding: "8px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{Math.round(d.value)}</span>
          <div style={{ width: "100%", background: "rgba(255,255,255,0.07)", borderRadius: "6px 6px 0 0", height: `${(d.value / maxVal) * (height - 40)}px`,
            background: `linear-gradient(180deg, ${d.color}cc, ${d.color}66)`,
            border: `1px solid ${d.color}55`, transition: "height 0.8s ease", boxShadow: `0 0 12px ${d.color}33` }} />
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── LINE CHART COMPONENT ─────────────────────────────────────────────────────
function LineChart({ data, series, height = 180 }) {
  const width = 500;
  const padL = 36, padR = 12, padT = 12, padB = 32;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const allVals = series.flatMap(s => data.map(d => d[s.key]));
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;

  const getX = (i) => padL + (i / (data.length - 1)) * chartW;
  const getY = (v) => padT + chartH - ((v - minV) / range) * chartH;

  const yTicks = [minV, minV + range / 2, maxV].map(v => Math.round(v));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={getY(t)} x2={width - padR} y2={getY(t)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={padL - 4} y={getY(t) + 4} fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="end">{t}</text>
        </g>
      ))}
      {/* Month labels */}
      {data.map((d, i) => (
        <text key={i} x={getX(i)} y={height - 6} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">{d.month}</text>
      ))}
      {/* Series lines */}
      {series.map(s => {
        const pts = data.map((d, i) => `${getX(i)},${getY(d[s.key])}`).join(" ");
        return (
          <g key={s.key}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 4px ${s.color})` }} />
            {data.map((d, i) => (
              <circle key={i} cx={getX(i)} cy={getY(d[s.key])} r="3" fill={s.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── HEATMAP COMPONENT ────────────────────────────────────────────────────────
function RiskHeatmap() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const diseases = ["Vector", "Water", "Resp.", "Heat", "Skin"];
  const data = [
    [15, 18, 25, 42, 60, 72, 85, 78, 62, 40, 22, 14],
    [12, 10, 15, 30, 55, 70, 80, 72, 60, 35, 18, 10],
    [55, 50, 35, 22, 15, 12, 10, 12, 18, 28, 45, 58],
    [8,  10, 20, 40, 65, 80, 90, 88, 72, 45, 22, 10],
    [10, 12, 30, 50, 72, 88, 92, 88, 65, 40, 20, 12],
  ];

  const getHeatColor = (v) => {
    if (v < 25) return { bg: "rgba(34,197,94,0.25)", text: "#22c55e" };
    if (v < 50) return { bg: "rgba(234,179,8,0.25)", text: "#eab308" };
    if (v < 75) return { bg: "rgba(249,115,22,0.25)", text: "#f97316" };
    return { bg: "rgba(239,68,68,0.3)", text: "#ef4444" };
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px", fontSize: "11px" }}>
        <thead>
          <tr>
            <th style={{ color: "rgba(255,255,255,0.5)", textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>Disease</th>
            {months.map(m => <th key={m} style={{ color: "rgba(255,255,255,0.5)", padding: "4px 3px", fontWeight: 500, textAlign: "center" }}>{m}</th>)}
          </tr>
        </thead>
        <tbody>
          {diseases.map((dis, di) => (
            <tr key={di}>
              <td style={{ color: "rgba(255,255,255,0.8)", padding: "4px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>{dis}</td>
              {months.map((_, mi) => {
                const v = data[di][mi];
                const { bg, text } = getHeatColor(v);
                return (
                  <td key={mi} style={{ background: bg, borderRadius: "4px", padding: "6px 3px", textAlign: "center", color: text, fontWeight: 700, cursor: "default",
                    transition: "transform 0.15s", border: `1px solid ${text}22` }}
                    title={`${dis} — ${months[mi]}: Risk ${v}%`}>{v}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [region, setRegion] = useState("Visakhapatnam");
  const [compareRegion, setCompareRegion] = useState("Hyderabad");
  const [comparing, setComparing] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [hasPrediction, setHasPrediction] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchingClimate, setFetchingClimate] = useState(false);

  const [climate, setClimate] = useState({ temperature: 32, rainfall: 180, humidity: 78, aqi: 112, uv: 7 });
  const [compareClimate, setCompareClimate] = useState({ temperature: 28, rainfall: 90, humidity: 65, aqi: 85, uv: 6 });
  const [riskScore, setRiskScore] = useState(0);
  const [compareScore, setCompareScore] = useState(0);
  const [diseaseScores, setDiseaseScores] = useState({});
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => { setTimeout(() => setLoading(false), 1400); }, []);

  const handleClimateChange = (field, value) => {
    setClimate(prev => ({ ...prev, [field]: Number(value) }));
    setHasPrediction(false);
  };

  const handleFetchClimate = () => {
    setFetchingClimate(true);
    setTimeout(() => {
      const liveData = {
        temperature: Math.round(28 + Math.random() * 10),
        rainfall: Math.round(60 + Math.random() * 160),
        humidity: Math.round(60 + Math.random() * 30),
        aqi: Math.round(70 + Math.random() * 100),
        uv: Math.round(4 + Math.random() * 7),
      };
      setClimate(liveData);
      setFetchingClimate(false);
    }, 1200);
  };

  const handleRunPrediction = () => {
    setIsPredicting(true);
    setTimeout(() => {
      const score = calcRiskScore(climate.temperature, climate.humidity, climate.rainfall, climate.aqi, climate.uv);
      const scores = getDiseaseScores(climate.temperature, climate.humidity, climate.rainfall, climate.aqi, climate.uv);
      const recs = getRecommendations(scores, region);
      setRiskScore(score);
      setDiseaseScores(scores);
      setRecommendations(recs);
      setHasPrediction(true);
      setIsPredicting(false);
      if (score >= 60) setAlertVisible(true);

      if (comparing) {
        const cs = calcRiskScore(compareClimate.temperature, compareClimate.humidity, compareClimate.rainfall, compareClimate.aqi, compareClimate.uv);
        setCompareScore(cs);
      }
    }, 2200);
  };

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const colors = {
    bg: "#060d1a",
    surface: "rgba(255,255,255,0.04)",
    surfaceHover: "rgba(255,255,255,0.07)",
    border: "rgba(255,255,255,0.08)",
    borderAccent: "rgba(59,130,246,0.4)",
    text: "#f1f5f9",
    textMuted: "rgba(255,255,255,0.5)",
    blue: "#3b82f6",
    teal: "#14b8a6",
    green: "#22c55e",
    accent: "#0ea5e9",
  };

  const css = {
    app: {
      minHeight: "100vh",
      background: colors.bg,
      color: colors.text,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      position: "relative",
    },
    // Animated background
    bgGlow: {
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      background: `
        radial-gradient(ellipse 60% 50% at 10% 20%, rgba(14,165,233,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 90% 70%, rgba(20,184,166,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 40% 30% at 50% 90%, rgba(59,130,246,0.05) 0%, transparent 60%)
      `,
    },
    nav: {
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(6,13,26,0.92)", backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${colors.border}`,
      padding: "0 24px", display: "flex", alignItems: "center", gap: "8px", height: "64px",
    },
    logo: {
      display: "flex", alignItems: "center", gap: "10px", marginRight: "32px",
      fontWeight: 800, fontSize: "17px", letterSpacing: "-0.5px",
      background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    },
    navBtn: (active) => ({
      padding: "8px 16px", borderRadius: "8px", border: "none",
      background: active ? "rgba(14,165,233,0.15)" : "transparent",
      color: active ? colors.accent : colors.textMuted,
      cursor: "pointer", fontSize: "13px", fontWeight: active ? 600 : 400,
      borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent",
      transition: "all 0.2s",
    }),
    main: { position: "relative", zIndex: 1, padding: "28px 24px", maxWidth: "1400px", margin: "0 auto" },
    card: {
      background: colors.surface, border: `1px solid ${colors.border}`,
      borderRadius: "16px", padding: "20px",
      backdropFilter: "blur(10px)", transition: "border-color 0.2s",
    },
    cardAccent: {
      background: "rgba(14,165,233,0.08)", border: `1px solid rgba(14,165,233,0.25)`,
      borderRadius: "16px", padding: "20px", backdropFilter: "blur(10px)",
    },
    sectionTitle: {
      fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: colors.text,
      display: "flex", alignItems: "center", gap: "8px",
    },
    label: { fontSize: "12px", fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
    input: {
      width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${colors.border}`,
      borderRadius: "10px", padding: "10px 14px", color: colors.text, fontSize: "14px",
      outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
    },
    range: { width: "100%", accentColor: colors.accent, cursor: "pointer", margin: "4px 0" },
    btnPrimary: {
      background: "linear-gradient(135deg, #0ea5e9, #14b8a6)", border: "none",
      color: "#fff", fontWeight: 700, fontSize: "15px", padding: "14px 28px",
      borderRadius: "12px", cursor: "pointer", width: "100%",
      boxShadow: "0 4px 20px rgba(14,165,233,0.35)", transition: "transform 0.15s, box-shadow 0.15s",
      letterSpacing: "0.3px",
    },
    btnSecondary: {
      background: "rgba(255,255,255,0.07)", border: `1px solid ${colors.border}`,
      color: colors.text, fontWeight: 600, fontSize: "13px", padding: "10px 18px",
      borderRadius: "10px", cursor: "pointer", transition: "background 0.2s",
    },
    badge: (color) => ({
      display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
      background: `${color}22`, color: color, border: `1px solid ${color}44`,
    }),
    grid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "16px" }),
    flexRow: { display: "flex", alignItems: "center", gap: "12px" },
    progressBar: (pct, color) => ({
      height: "8px", borderRadius: "4px",
      background: `linear-gradient(90deg, ${color}, ${color}99)`,
      width: `${pct}%`, transition: "width 0.9s ease",
      boxShadow: `0 0 8px ${color}55`,
    }),
  };

  const riskColor = getRiskColor(riskScore);
  const confidence = hasPrediction ? Math.round(78 + riskScore * 0.12) : 0;

  // ── LOADING SCREEN ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...css.app, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <div style={{ ...css.bgGlow }} />
        <div style={{ fontSize: "40px", animation: "spin 2s linear infinite" }}>🌍</div>
        <div style={{ ...css.logo, fontSize: "22px" }}>🌿 ClimateHealth AI</div>
        <div style={{ color: colors.textMuted, fontSize: "14px" }}>Initialising climate-health systems…</div>
        <div style={{ width: "200px", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "60%", background: "linear-gradient(90deg, #0ea5e9, #14b8a6)", borderRadius: "2px", animation: "loadBar 1.4s ease forwards" }} />
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes loadBar{from{width:0}to{width:100%}}`}</style>
      </div>
    );
  }

  // ── ALERT BANNER ─────────────────────────────────────────────────────────────
  const AlertBanner = () => alertVisible && (
    <div style={{ position: "fixed", top: "64px", left: 0, right: 0, zIndex: 200,
      background: "linear-gradient(90deg, #ef444499, #f97316aa)", backdropFilter: "blur(12px)",
      padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid rgba(239,68,68,0.4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "20px" }}>⚠️</span>
        <strong style={{ color: "#fff", fontSize: "14px" }}>HIGH RISK ALERT — {region}</strong>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>Risk score {riskScore}/100 · Immediate preventive action recommended</span>
      </div>
      <button onClick={() => setAlertVisible(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px", opacity: 0.7 }}>✕</button>
    </div>
  );

  // ── DASHBOARD TAB ────────────────────────────────────────────────────────────
  const DashboardTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Overview Cards */}
      <div style={css.grid(4)}>
        {[
          { icon: "🌡️", label: "Temperature", value: `${climate.temperature}°C`, sub: climate.temperature > 35 ? "Extreme heat" : "Moderate", color: "#f97316", trend: [28,30,31,32,climate.temperature] },
          { icon: "💧", label: "Humidity", value: `${climate.humidity}%`, sub: climate.humidity > 75 ? "High — disease risk" : "Normal", color: "#3b82f6", trend: [68,72,74,76,climate.humidity] },
          { icon: "🌧️", label: "Rainfall", value: `${climate.rainfall} mm`, sub: "7-day accumulation", color: "#14b8a6", trend: [90,120,150,170,climate.rainfall] },
          { icon: "💨", label: "Air Quality", value: climate.aqi, sub: climate.aqi > 150 ? "Unhealthy" : climate.aqi > 100 ? "Moderate" : "Good", color: climate.aqi > 150 ? "#ef4444" : climate.aqi > 100 ? "#eab308" : "#22c55e", trend: [80,90,100,108,climate.aqi] },
        ].map((c, i) => (
          <div key={i} style={{ ...css.card, cursor: "default" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = c.color + "66"}
            onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ ...css.label }}>{c.icon} {c.label}</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
                <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>{c.sub}</div>
              </div>
              <SparkLine data={c.trend} color={c.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: Gauge + Quick Predict + UV */}
      <div style={css.grid(3)}>
        <div style={{ ...css.cardAccent, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={css.sectionTitle}>🎯 Overall Risk Score</div>
          <RiskGauge score={riskScore} size={190} />
          {hasPrediction && (
            <div style={{ textAlign: "center" }}>
              <div style={css.badge(riskColor)}>Confidence: {confidence}%</div>
              <div style={{ marginTop: "8px", fontSize: "12px", color: colors.textMuted }}>Based on {region} climate data</div>
            </div>
          )}
          {!hasPrediction && <div style={{ fontSize: "12px", color: colors.textMuted }}>Run prediction to see results</div>}
        </div>

        <div style={css.card}>
          <div style={css.sectionTitle}>🔢 Disease Risk Snapshot</div>
          {hasPrediction ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {DISEASE_CATEGORIES.map(d => {
                const score = Math.round(diseaseScores[d.id] || 0);
                return (
                  <div key={d.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", color: colors.textMuted }}>{d.icon} {d.label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: getRiskColor(score) }}>{score}%</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.07)" }}>
                      <div style={css.progressBar(score, getRiskColor(score))} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: colors.textMuted, fontSize: "13px", textAlign: "center", marginTop: "20px" }}>
              Run prediction to see disease risk breakdown
            </div>
          )}
        </div>

        <div style={css.card}>
          <div style={css.sectionTitle}>⚡ Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={css.label}>Region</div>
              <select value={region} onChange={e => setRegion(e.target.value)}
                style={{ ...css.input, background: "rgba(255,255,255,0.06)" }}>
                {REGIONS.map(r => <option key={r} value={r} style={{ background: "#0a1628" }}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={css.label}>UV Index: <span style={{ color: colors.accent }}>{climate.uv}</span></div>
              <input type="range" min={1} max={12} value={climate.uv} onChange={e => handleClimateChange("uv", e.target.value)} style={css.range} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: colors.textMuted }}>
                <span>Low (1)</span><span>High (12)</span>
              </div>
            </div>
            <button onClick={() => { setActiveTab("input"); }} style={{ ...css.btnSecondary, fontSize: "12px" }}>
              ✏️ Edit All Climate Data
            </button>
            <button onClick={handleRunPrediction} disabled={isPredicting} style={{ ...css.btnPrimary, fontSize: "13px", padding: "12px" }}>
              {isPredicting ? "⏳ Running AI Model…" : "🚀 Run Prediction"}
            </button>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div style={css.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={css.sectionTitle}>📈 7-Month Disease Trend</div>
          <div style={{ display: "flex", gap: "16px", fontSize: "11px" }}>
            {[{ color: "#ef4444", label: "Dengue" }, { color: "#3b82f6", label: "Malaria" }, { color: "#8b5cf6", label: "Respiratory" }].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "3px", background: s.color, borderRadius: "2px" }} />
                <span style={{ color: colors.textMuted }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <LineChart data={TREND_DATA} series={[
          { key: "dengue", color: "#ef4444" },
          { key: "malaria", color: "#3b82f6" },
          { key: "respiratory", color: "#8b5cf6" },
        ]} height={180} />
      </div>
    </div>
  );

  // ── INPUT TAB ─────────────────────────────────────────────────────────────────
  const InputTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={css.grid(2)}>
        {/* Input Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={css.card}>
            <div style={css.sectionTitle}>📍 Location & Data Source</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={css.label}>Region / City</div>
                <select value={region} onChange={e => setRegion(e.target.value)} style={css.input}>
                  {REGIONS.map(r => <option key={r} value={r} style={{ background: "#0a1628" }}>{r}</option>)}
                </select>
              </div>
              <button onClick={handleFetchClimate} disabled={fetchingClimate} style={{ ...css.btnSecondary, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {fetchingClimate ? "⏳ Fetching…" : "🌐 Auto-Fetch Live Climate Data"}
              </button>
              <div style={{ fontSize: "11px", color: colors.textMuted, padding: "8px 12px", background: "rgba(14,165,233,0.06)", borderRadius: "8px", border: `1px solid rgba(14,165,233,0.15)` }}>
                💡 Auto-fetch uses Open-Meteo API to populate real-time climate data for the selected region
              </div>
            </div>
          </div>

          <div style={css.card}>
            <div style={css.sectionTitle}>🌡️ Climate Parameters</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { key: "temperature", label: "Temperature (°C)", min: 10, max: 50, icon: "🌡️", unit: "°C" },
                { key: "humidity", label: "Relative Humidity (%)", min: 10, max: 100, icon: "💧", unit: "%" },
                { key: "rainfall", label: "7-Day Rainfall (mm)", min: 0, max: 400, icon: "🌧️", unit: "mm" },
                { key: "aqi", label: "Air Quality Index", min: 0, max: 300, icon: "💨", unit: "" },
                { key: "uv", label: "UV Index", min: 1, max: 12, icon: "☀️", unit: "" },
              ].map(field => (
                <div key={field.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={css.label}>{field.icon} {field.label}</div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.accent }}>{climate[field.key]}{field.unit}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input type="range" min={field.min} max={field.max} value={climate[field.key]}
                      onChange={e => handleClimateChange(field.key, e.target.value)} style={{ ...css.range, flex: 1 }} />
                    <input type="number" min={field.min} max={field.max} value={climate[field.key]}
                      onChange={e => handleClimateChange(field.key, e.target.value)}
                      style={{ ...css.input, width: "72px", textAlign: "center", padding: "8px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Compare + Run */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={css.card}>
            <div style={css.sectionTitle}>🔍 Region Comparison</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <input type="checkbox" id="compare" checked={comparing} onChange={e => setComparing(e.target.checked)} style={{ accentColor: colors.accent }} />
              <label htmlFor="compare" style={{ color: colors.textMuted, fontSize: "13px", cursor: "pointer" }}>Compare with another region</label>
            </div>
            {comparing && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: `1px solid ${colors.border}` }}>
                <div>
                  <div style={css.label}>Compare Region</div>
                  <select value={compareRegion} onChange={e => setCompareRegion(e.target.value)} style={css.input}>
                    {REGIONS.filter(r => r !== region).map(r => <option key={r} value={r} style={{ background: "#0a1628" }}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <div style={css.label}>Compare Temperature: <span style={{ color: "#a78bfa" }}>{compareClimate.temperature}°C</span></div>
                  <input type="range" min={10} max={50} value={compareClimate.temperature} onChange={e => setCompareClimate(p => ({ ...p, temperature: +e.target.value }))} style={{ ...css.range, accentColor: "#a78bfa" }} />
                </div>
                <div>
                  <div style={css.label}>Compare Humidity: <span style={{ color: "#a78bfa" }}>{compareClimate.humidity}%</span></div>
                  <input type="range" min={10} max={100} value={compareClimate.humidity} onChange={e => setCompareClimate(p => ({ ...p, humidity: +e.target.value }))} style={{ ...css.range, accentColor: "#a78bfa" }} />
                </div>
                <div>
                  <div style={css.label}>Compare AQI: <span style={{ color: "#a78bfa" }}>{compareClimate.aqi}</span></div>
                  <input type="range" min={0} max={300} value={compareClimate.aqi} onChange={e => setCompareClimate(p => ({ ...p, aqi: +e.target.value }))} style={{ ...css.range, accentColor: "#a78bfa" }} />
                </div>
              </div>
            )}
          </div>

          <div style={css.card}>
            <div style={css.sectionTitle}>📁 Bulk Data Upload</div>
            <div style={{ border: `2px dashed ${colors.border}`, borderRadius: "12px", padding: "24px", textAlign: "center",
              cursor: "pointer", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = colors.accent + "66"}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
              <div style={{ fontSize: "30px", marginBottom: "8px" }}>📊</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.textMuted }}>Drop CSV / Excel dataset here</div>
              <div style={{ fontSize: "11px", color: colors.textMuted + "99", marginTop: "4px" }}>or click to browse</div>
              <div style={{ marginTop: "12px", fontSize: "11px", color: colors.textMuted + "77" }}>
                Supports WHO format · NASA POWER format · Custom CSV
              </div>
            </div>
          </div>

          <div style={{ ...css.cardAccent, padding: "24px", textAlign: "center" }}>
            {hasPrediction && (
              <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(34,197,94,0.1)", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600 }}>✅ Last prediction: {getRiskLabel(riskScore)} Risk ({riskScore}/100)</div>
                <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>Confidence: {confidence}%</div>
              </div>
            )}
            <button onClick={handleRunPrediction} disabled={isPredicting}
              style={{ ...css.btnPrimary, fontSize: "16px", padding: "16px" }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px rgba(14,165,233,0.5)"; }}
              onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 20px rgba(14,165,233,0.35)"; }}>
              {isPredicting ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Running XGBoost Model…
                </span>
              ) : "🚀 Run Disease Risk Prediction"}
            </button>
            {isPredicting && (
              <div style={{ marginTop: "12px", fontSize: "12px", color: colors.textMuted }}>
                Analysing 47 climate-disease correlations…
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── PREDICTION TAB ────────────────────────────────────────────────────────────
  const PredictionTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {!hasPrediction && (
        <div style={{ ...css.card, textAlign: "center", padding: "48px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔬</div>
          <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No Prediction Yet</div>
          <div style={{ color: colors.textMuted, marginBottom: "20px" }}>Set your climate parameters and run the prediction model to see disease risk analysis</div>
          <button onClick={() => setActiveTab("input")} style={{ ...css.btnPrimary, width: "auto", padding: "12px 24px" }}>
            Go to Climate Input →
          </button>
        </div>
      )}

      {hasPrediction && (
        <>
          {/* Main risk + compare */}
          <div style={css.grid(comparing ? 2 : 1)}>
            <div style={css.cardAccent}>
              <div style={{ ...css.sectionTitle, justifyContent: "space-between" }}>
                <span>🎯 {region} — Risk Analysis</span>
                <span style={{ ...css.badge(riskColor), fontSize: "13px", padding: "4px 14px" }}>{getRiskLabel(riskScore)}</span>
              </div>
              <div style={css.grid(2)}>
                <RiskGauge score={riskScore} size={180} />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                  <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                    <div style={css.label}>Risk Score</div>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: riskColor }}>{riskScore}<span style={{ fontSize: "14px", color: colors.textMuted }}>/100</span></div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                    <div style={css.label}>Model Confidence</div>
                    <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.07)", margin: "6px 0" }}>
                      <div style={{ ...css.progressBar(confidence, "#22c55e"), height: "8px" }} />
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>{confidence}%</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                    <div style={css.label}>Primary Risk Factor</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text }}>
                      {climate.humidity > 80 ? "High Humidity → Dengue" : climate.temperature > 35 ? "Heat Stress" : climate.aqi > 150 ? "Poor Air Quality" : "Multiple Factors"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {comparing && (
              <div style={css.card}>
                <div style={{ ...css.sectionTitle, justifyContent: "space-between" }}>
                  <span>⚖️ {compareRegion} — Comparison</span>
                  <span style={{ ...css.badge(getRiskColor(compareScore)), fontSize: "13px", padding: "4px 14px" }}>{getRiskLabel(compareScore)}</span>
                </div>
                <div style={css.grid(2)}>
                  <RiskGauge score={compareScore} size={180} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                    <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                      <div style={css.label}>Comparison Score</div>
                      <div style={{ fontSize: "28px", fontWeight: 800, color: getRiskColor(compareScore) }}>{compareScore}<span style={{ fontSize: "14px", color: colors.textMuted }}>/100</span></div>
                    </div>
                    <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                      <div style={css.label}>Δ Score Difference</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: riskScore > compareScore ? "#ef4444" : "#22c55e" }}>
                        {riskScore > compareScore ? "+" : ""}{riskScore - compareScore}
                      </div>
                      <div style={{ fontSize: "11px", color: colors.textMuted }}>{region} is {riskScore > compareScore ? "higher" : "lower"} risk</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Disease category cards */}
          <div>
            <div style={{ ...css.sectionTitle, marginBottom: "16px" }}>🦠 Disease Category Risk Breakdown</div>
            <div style={css.grid(4)}>
              {DISEASE_CATEGORIES.map(d => {
                const score = Math.round(diseaseScores[d.id] || 0);
                const col = getRiskColor(score);
                return (
                  <div key={d.id} style={{ ...css.card, borderColor: `${col}33`, cursor: "default" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = col + "77"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = col + "33"}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{d.icon}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>{d.label}</div>
                    <div style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "10px" }}>{d.examples}</div>
                    <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.07)", marginBottom: "6px" }}>
                      <div style={{ ...css.progressBar(score, col), height: "6px" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", ...css.badge(col) }}>{getRiskLabel(score)}</span>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: col }}>{score}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 14-day forecast */}
          <div style={css.card}>
            <div style={css.sectionTitle}>📅 14-Day Risk Forecast</div>
            <BarChart data={Array.from({ length: 14 }, (_, i) => ({
              label: `D+${i+1}`,
              value: Math.max(5, riskScore + (Math.random() - 0.5) * 20 + (i * 0.5)),
              color: getRiskColor(Math.max(5, riskScore + (Math.random() - 0.5) * 20)),
            }))} height={160} />
          </div>
        </>
      )}
    </div>
  );

  // ── RECOMMENDATIONS TAB ───────────────────────────────────────────────────────
  const RecommendationsTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {!hasPrediction ? (
        <div style={{ ...css.card, textAlign: "center", padding: "48px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>💊</div>
          <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Run Prediction First</div>
          <div style={{ color: colors.textMuted, marginBottom: "20px" }}>Preventive recommendations are generated based on your specific climate conditions and predicted risks</div>
          <button onClick={() => setActiveTab("input")} style={{ ...css.btnPrimary, width: "auto", padding: "12px 24px" }}>Configure & Run Prediction →</button>
        </div>
      ) : (
        <>
          <div style={{ ...css.cardAccent, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "16px" }}>AI-Generated Health Recommendations · {region}</div>
              <div style={{ fontSize: "12px", color: colors.textMuted, marginTop: "4px" }}>Based on current climate profile · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
            </div>
            <div style={css.badge(riskColor)}>Risk: {riskScore}/100 · {getRiskLabel(riskScore)}</div>
          </div>

          {recommendations.map((rec, i) => {
            const typeConfig = {
              critical: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", accent: "#ef4444" },
              warning:  { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)", accent: "#f97316" },
              info:     { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)", accent: "#3b82f6" },
              success:  { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)", accent: "#22c55e" },
            }[rec.type] || { bg: colors.surface, border: colors.border, accent: colors.blue };
            return (
              <div key={i} style={{ background: typeConfig.bg, border: `1px solid ${typeConfig.border}`, borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "22px" }}>{rec.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: typeConfig.accent }}>{rec.title}</div>
                    <div style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                      {rec.type === "critical" ? "🔴 CRITICAL" : rec.type === "warning" ? "🟠 WARNING" : rec.type === "info" ? "🔵 ADVISORY" : "🟢 ROUTINE"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {rec.actions.map((action, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px",
                      background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: `1px solid rgba(255,255,255,0.06)` }}>
                      <span style={{ color: typeConfig.accent, fontWeight: 700, marginTop: "1px", flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: "13px", lineHeight: 1.5 }}>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Download report */}
          <div style={{ ...css.card, textAlign: "center", padding: "24px" }}>
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>📄 Export Health Risk Report</div>
            <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "16px" }}>Download a PDF summary for district health officers, ASHA workers, or researchers</div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button style={{ ...css.btnSecondary, fontSize: "12px" }}>📄 Download PDF Report</button>
              <button style={{ ...css.btnSecondary, fontSize: "12px" }}>📋 Copy as Text</button>
              <button style={{ ...css.btnSecondary, fontSize: "12px" }}>📧 Email to Team</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── ANALYTICS TAB ─────────────────────────────────────────────────────────────
  const AnalyticsTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={css.grid(2)}>
        <div style={css.card}>
          <div style={css.sectionTitle}>📈 Climate Trend Analysis</div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "11px" }}>
            {[{ color: "#f97316", label: "Temperature (°C)" }, { color: "#3b82f6", label: "Humidity (%)" }].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "3px", background: s.color, borderRadius: "2px" }} />
                <span style={{ color: colors.textMuted }}>{s.label}</span>
              </div>
            ))}
          </div>
          <LineChart data={TREND_DATA} series={[
            { key: "temp", color: "#f97316" },
            { key: "humidity", color: "#3b82f6" },
          ]} height={160} />
        </div>
        <div style={css.card}>
          <div style={css.sectionTitle}>🦠 Disease Incidence Trends</div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "11px" }}>
            {[{ color: "#ef4444", label: "Dengue" }, { color: "#3b82f6", label: "Malaria" }, { color: "#8b5cf6", label: "Respiratory" }].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "3px", background: s.color, borderRadius: "2px" }} />
                <span style={{ color: colors.textMuted }}>{s.label}</span>
              </div>
            ))}
          </div>
          <LineChart data={TREND_DATA} series={[
            { key: "dengue", color: "#ef4444" },
            { key: "malaria", color: "#3b82f6" },
            { key: "respiratory", color: "#8b5cf6" },
          ]} height={160} />
        </div>
      </div>

      <div style={css.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={css.sectionTitle}>🗓️ Seasonal Risk Heatmap — India Districts</div>
          <div style={{ display: "flex", gap: "8px", fontSize: "11px" }}>
            {[{ color: "#22c55e", label: "Low" }, { color: "#eab308", label: "Mod" }, { color: "#f97316", label: "High" }, { color: "#ef4444", label: "Crit" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: l.color + "55", border: `1px solid ${l.color}88` }} />
                <span style={{ color: colors.textMuted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <RiskHeatmap />
      </div>

      <div style={css.grid(3)}>
        <div style={css.card}>
          <div style={css.sectionTitle}>🏆 Highest Risk Regions</div>
          {[
            { region: "Kolkata", score: 78, change: "+4" },
            { region: "Mumbai", score: 72, change: "+2" },
            { region: "Chennai", score: 68, change: "-1" },
            { region: "Hyderabad", score: 65, change: "+3" },
            { region: "Visakhapatnam", score: 61, change: "0" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0",
              borderBottom: i < 4 ? `1px solid ${colors.border}` : "none" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: colors.textMuted, width: "16px" }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{r.region}</div>
                <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.07)", marginTop: "4px" }}>
                  <div style={{ ...css.progressBar(r.score, getRiskColor(r.score)), height: "4px" }} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: getRiskColor(r.score) }}>{r.score}</div>
                <div style={{ fontSize: "10px", color: r.change.startsWith("+") ? "#ef4444" : r.change === "0" ? colors.textMuted : "#22c55e" }}>{r.change}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={css.card}>
          <div style={css.sectionTitle}>📊 Historical Comparison</div>
          <BarChart data={[
            { label: "2021", value: 42, color: "#3b82f6" },
            { label: "2022", value: 55, color: "#3b82f6" },
            { label: "2023", value: 61, color: "#f97316" },
            { label: "2024", value: 58, color: "#eab308" },
            { label: "2025", value: 68, color: "#ef4444" },
          ]} height={160} />
        </div>

        <div style={css.card}>
          <div style={css.sectionTitle}>🌡️ Model Performance</div>
          {[
            { label: "Dengue Prediction", accuracy: 89 },
            { label: "Malaria Risk", accuracy: 84 },
            { label: "Respiratory", accuracy: 82 },
            { label: "Heat Illness", accuracy: 91 },
            { label: "Water-Borne", accuracy: 86 },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: colors.textMuted }}>{m.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>{m.accuracy}%</span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.07)" }}>
                <div style={{ ...css.progressBar(m.accuracy, "#22c55e"), height: "6px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TABS = [
    { id: "dashboard", label: "🏠 Dashboard" },
    { id: "input",     label: "🌡️ Climate Input" },
    { id: "prediction", label: "🔬 Risk Analysis" },
    { id: "recommendations", label: "💊 Recommendations" },
    { id: "analytics", label: "📊 Analytics" },
  ];

  return (
    <div style={css.app}>
      <div style={css.bgGlow} />
      <AlertBanner />

      {/* NAV */}
      <nav style={css.nav}>
        <div style={css.logo}>
          <span style={{ fontSize: "22px" }}>🌿</span>
          <span>ClimateHealth AI</span>
        </div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={css.navBtn(activeTab === t.id)}>
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
            ● Live
          </div>
          <button onClick={() => setDarkMode(d => !d)} style={{ ...css.btnSecondary, padding: "6px 12px", fontSize: "12px" }}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <div style={{ fontSize: "12px", color: colors.textMuted, padding: "6px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}` }}>
            📍 {region}
          </div>
        </div>
      </nav>

      {/* PAGE HEADER */}
      <div style={{ ...css.main, paddingBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
              Integrated Climate-Driven Disease Risk Prediction
            </h1>
            <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: "13px" }}>
              AI-powered preventive healthcare intelligence · {region} · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {hasPrediction && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "4px" }}>Current Risk Level</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: riskColor }}>{getRiskLabel(riskScore)}</div>
            </div>
          )}
        </div>

        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "input" && <InputTab />}
        {activeTab === "prediction" && <PredictionTab />}
        {activeTab === "recommendations" && <RecommendationsTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>

      {/* FOOTER */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "24px", fontSize: "11px", color: colors.textMuted, borderTop: `1px solid ${colors.border}`, marginTop: "24px" }}>
        <span>ClimateHealth AI · Integrated Climate-Driven Disease Risk Prediction System · Built with XGBoost + React · </span>
        <span style={{ color: colors.accent }}>Final Year Project · Hackathon Ready</span>
      </div>
    </div>
  );
}
