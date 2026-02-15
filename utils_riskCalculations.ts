// ══════════════════════════════════════════════════════
//  ClimateHealth AI — Risk Calculation Utilities
// ══════════════════════════════════════════════════════

import type { ClimateInput, RiskLabel, DiseaseCategory, RegionInfo } from "../types";

// ── Constants ──────────────────────────────────────────

export const DISEASE_CATEGORIES: DiseaseCategory[] = [
  { id: "vector",      label: "Vector-Borne",   icon: "🦟", examples: "Dengue, Malaria, Chikungunya",      color: "#ef4444", scoreKey: "vector_score"      },
  { id: "water",       label: "Water-Borne",    icon: "💧", examples: "Cholera, Typhoid, Hepatitis A",     color: "#3b82f6", scoreKey: "water_score"       },
  { id: "respiratory", label: "Respiratory",    icon: "🫁", examples: "Asthma, COPD, Influenza",           color: "#8b5cf6", scoreKey: "respiratory_score" },
  { id: "heat",        label: "Heat-Related",   icon: "🌡️", examples: "Heatstroke, Dehydration",           color: "#f97316", scoreKey: "heat_score"        },
  { id: "nutrition",   label: "Nutritional",    icon: "🥗", examples: "Malnutrition, Vitamin deficiency",  color: "#22c55e", scoreKey: "nutrition_score"   },
  { id: "mental",      label: "Mental Health",  icon: "🧠", examples: "Climate anxiety, Depression",       color: "#a855f7", scoreKey: "mental_score"      },
  { id: "skin",        label: "Skin & Eye",     icon: "👁️", examples: "Conjunctivitis, UV damage",         color: "#eab308", scoreKey: "skin_score"        },
];

export const REGIONS: RegionInfo[] = [
  { name: "Visakhapatnam", state: "Andhra Pradesh",  latitude: 17.6868,  longitude: 83.2185  },
  { name: "Hyderabad",     state: "Telangana",        latitude: 17.3850,  longitude: 78.4867  },
  { name: "Mumbai",        state: "Maharashtra",      latitude: 19.0760,  longitude: 72.8777  },
  { name: "Delhi",         state: "Delhi",            latitude: 28.7041,  longitude: 77.1025  },
  { name: "Chennai",       state: "Tamil Nadu",       latitude: 13.0827,  longitude: 80.2707  },
  { name: "Kolkata",       state: "West Bengal",      latitude: 22.5726,  longitude: 88.3639  },
  { name: "Bangalore",     state: "Karnataka",        latitude: 12.9716,  longitude: 77.5946  },
  { name: "Pune",          state: "Maharashtra",      latitude: 18.5204,  longitude: 73.8567  },
  { name: "Ahmedabad",     state: "Gujarat",          latitude: 23.0225,  longitude: 72.5714  },
  { name: "Jaipur",        state: "Rajasthan",        latitude: 26.9124,  longitude: 75.7873  },
];

export const RISK_COLORS: Record<RiskLabel, string> = {
  Low:      "#22c55e",
  Moderate: "#eab308",
  High:     "#f97316",
  Critical: "#ef4444",
};

export const TREND_DATA = [
  { month: "Aug", temp: 31, humidity: 72, dengue: 28, malaria: 15, respiratory: 20 },
  { month: "Sep", temp: 30, humidity: 78, dengue: 45, malaria: 22, respiratory: 18 },
  { month: "Oct", temp: 28, humidity: 82, dengue: 62, malaria: 31, respiratory: 22 },
  { month: "Nov", temp: 26, humidity: 74, dengue: 41, malaria: 20, respiratory: 35 },
  { month: "Dec", temp: 23, humidity: 66, dengue: 22, malaria: 12, respiratory: 48 },
  { month: "Jan", temp: 22, humidity: 60, dengue: 18, malaria: 10, respiratory: 55 },
  { month: "Feb", temp: 25, humidity: 58, dengue: 21, malaria: 11, respiratory: 42 },
];

export const SEASONAL_HEATMAP = {
  months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  diseases: [
    { label: "Vector",  data: [15,18,25,42,60,72,85,78,62,40,22,14] },
    { label: "Water",   data: [12,10,15,30,55,70,80,72,60,35,18,10] },
    { label: "Resp.",   data: [55,50,35,22,15,12,10,12,18,28,45,58] },
    { label: "Heat",    data: [8, 10,20,40,65,80,90,88,72,45,22,10] },
    { label: "Skin",    data: [10,12,30,50,72,88,92,88,65,40,20,12] },
  ],
};

// ── Core Risk Calculations ─────────────────────────────

export function calcOverallRiskScore(c: ClimateInput): number {
  let score = 0;
  if (c.temperature > 35) score += 25;
  else if (c.temperature > 30) score += 15;
  else if (c.temperature > 25) score += 8;

  if (c.humidity > 80) score += 20;
  else if (c.humidity > 65) score += 12;

  if (c.rainfall > 200) score += 20;
  else if (c.rainfall > 100) score += 10;

  if (c.aqi > 150) score += 20;
  else if (c.aqi > 100) score += 12;

  if (c.uv_index > 8) score += 15;
  else if (c.uv_index > 5) score += 8;

  return Math.min(score, 100);
}

export function calcDiseaseScores(c: ClimateInput): Record<string, number> {
  return {
    vector_score:      Math.min(100, (c.humidity * 0.4) + (c.rainfall * 0.2) + (c.temperature > 28 ? 30 : 10)),
    water_score:       Math.min(100, (c.rainfall * 0.35) + (c.temperature * 0.3) + (c.humidity * 0.15)),
    respiratory_score: Math.min(100, (c.aqi * 0.5) + (c.uv_index * 0.2) + (c.humidity > 70 ? 20 : 5)),
    heat_score:        Math.min(100, (c.temperature * 1.5) + (c.humidity * 0.3) + (c.uv_index * 1.2)),
    nutrition_score:   Math.min(100, (c.temperature * 0.4) + (c.rainfall < 50 ? 30 : 5) + 15),
    mental_score:      Math.min(100, (c.temperature > 32 ? 25 : 10) + (c.aqi * 0.3) + 15),
    skin_score:        Math.min(100, (c.uv_index * 5) + (c.temperature * 0.5) + 10),
  };
}

export function getRiskLabel(score: number): RiskLabel {
  if (score < 25) return "Low";
  if (score < 50) return "Moderate";
  if (score < 75) return "High";
  return "Critical";
}

export function getRiskColor(score: number): string {
  return RISK_COLORS[getRiskLabel(score)];
}

export function getConfidenceScore(riskScore: number): number {
  return Math.round(78 + riskScore * 0.12);
}

export function generate14DayForecast(baseScore: number) {
  return Array.from({ length: 14 }, (_, i) => {
    const variation = (Math.random() - 0.5) * 12 + (i * 0.4);
    const daily = Math.min(100, Math.max(5, baseScore + variation));
    return {
      day: i + 1,
      label: `D+${i + 1}`,
      risk_score: Math.round(daily),
      risk_label: getRiskLabel(daily),
    };
  });
}

export function getPrimaryRiskFactor(c: ClimateInput): string {
  if (c.humidity > 80)      return "High Humidity → Vector-Borne Risk";
  if (c.temperature > 35)   return "Extreme Heat → Heat Illness";
  if (c.aqi > 150)          return "Poor Air Quality → Respiratory Risk";
  if (c.rainfall > 200)     return "Heavy Rainfall → Water Contamination";
  if (c.uv_index > 9)       return "High UV → Skin & Eye Damage";
  return "Multiple Moderate Climate Stressors";
}
