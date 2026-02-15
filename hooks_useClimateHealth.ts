// ══════════════════════════════════════════════════════
//  ClimateHealth AI — API Hook
//  All backend calls with mock fallback for offline/demo
// ══════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import type {
  ClimateInput, PredictionResponse, CompareResponse,
  LiveClimateResponse, SeasonalData, ModelMetrics,
} from "../types";
import {
  calcOverallRiskScore, calcDiseaseScores, getRiskLabel,
  getConfidenceScore, generate14DayForecast, DISEASE_CATEGORIES,
} from "../utils/riskCalculations";

const API_BASE = import.meta.env.VITE_API_URL || "https://climatehealth-api.onrender.com";

// ── Fetch wrapper ──────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Mock data generators (offline fallback) ────────────

function mockPrediction(climate: ClimateInput): PredictionResponse {
  const overallScore = calcOverallRiskScore(climate);
  const diseaseScores = calcDiseaseScores(climate);

  const diseaseRisks = DISEASE_CATEGORIES.map((d) => {
    const score = Math.round(diseaseScores[d.scoreKey] ?? 0);
    return {
      disease: d.label,
      risk_score: score,
      risk_label: getRiskLabel(score),
      confidence: 0.78 + score * 0.0012,
      contributing_factors: ["Climate correlation analysis", "Seasonal pattern match"],
    };
  }).sort((a, b) => b.risk_score - a.risk_score);

  const highRisks = diseaseRisks.filter((d) => d.risk_score >= 40);
  const recommendations = highRisks.length > 0
    ? highRisks.map((d) => ({
        disease: d.disease,
        icon: DISEASE_CATEGORIES.find((c) => c.label === d.disease)?.icon ?? "⚠️",
        risk_score: d.risk_score,
        severity: d.risk_label,
        type: d.risk_score >= 75 ? "critical" : d.risk_score >= 50 ? "warning" : "info" as any,
        actions: getMockActions(d.disease, climate),
      }))
    : [{
        disease: "General Health",
        icon: "✅",
        risk_score: 10,
        severity: "Low" as any,
        type: "success" as any,
        actions: [
          "Continue regular handwashing",
          "Stay hydrated daily",
          "Monitor local health bulletins",
          "Annual health checkup recommended",
        ],
      }];

  return {
    overall_risk_score: overallScore,
    overall_risk_label: getRiskLabel(overallScore),
    overall_confidence: getConfidenceScore(overallScore) / 100,
    disease_risks: diseaseRisks,
    recommendations,
    forecast_14day: generate14DayForecast(overallScore).map((f) => ({
      day: f.day,
      date: f.label,
      risk_score: f.risk_score,
      risk_label: getRiskLabel(f.risk_score),
    })),
    timestamp: new Date().toISOString(),
    model_version: "XGBoost-v2.1 (local)",
  };
}

function getMockActions(disease: string, c: ClimateInput): string[] {
  const actions: Record<string, string[]> = {
    "Vector-Borne": [
      "Eliminate standing water in containers and tyres",
      `Use DEET-based repellent — humidity is ${c.humidity}%`,
      "Sleep under insecticide-treated bed nets",
      "Visit nearest PHC if fever develops",
    ],
    "Water-Borne": [
      "Boil drinking water for at least 1 minute",
      "Avoid raw street food and unpeeled fruits",
      "Ensure proper handwashing before meals",
      "Report contaminated water to municipality",
    ],
    "Respiratory": [
      `Wear N95 mask outdoors — AQI is ${c.aqi}`,
      "Avoid outdoor exercise during 6–9 AM",
      "Keep bronchodilator inhaler accessible",
      "Monitor AQI before outdoor activities",
    ],
    "Heat-Related": [
      `Drink 3–4 litres of water daily — temp is ${c.temperature}°C`,
      "Avoid outdoor exposure 11 AM – 4 PM",
      "Wear light-coloured, loose cotton clothing",
      "Know heatstroke signs: hot dry skin, confusion",
    ],
    "Skin & Eye": [
      `Apply SPF 50+ sunscreen — UV index is ${c.uv_index}`,
      "Wear UV-blocking sunglasses (UV400)",
      "Use umbrella or wide-brim hat outdoors",
      "Annual eye checkup with ophthalmologist",
    ],
    "Nutritional": [
      "Ensure diversified diet with seasonal vegetables",
      "Monitor weight in children under 5",
      "Consult ICDS Anganwadi for supplements",
      "Store food safely to prevent heat spoilage",
    ],
    "Mental Health": [
      "Maintain social connections and community support",
      "Limit climate disaster news consumption",
      "Ensure adequate sleep in cool environment",
      "Contact iCall (9152987821) for mental support",
    ],
  };
  return actions[disease] ?? ["Follow general health guidelines", "Consult a healthcare professional"];
}

// ── useClimateHealth hook ──────────────────────────────

export interface UseClimateHealthReturn {
  prediction: PredictionResponse | null;
  compareResult: CompareResponse | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  isOfflineMode: boolean;
  runPrediction: (climate: ClimateInput) => Promise<void>;
  runComparison: (a: ClimateInput, b: ClimateInput) => Promise<void>;
  fetchLiveClimate: (city: string) => Promise<Partial<ClimateInput> | null>;
  fetchSeasonalData: () => Promise<SeasonalData | null>;
  fetchModelMetrics: () => Promise<ModelMetrics | null>;
  clearPrediction: () => void;
}

export function useClimateHealth(): UseClimateHealthReturn {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const runPrediction = useCallback(async (climate: ClimateInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<PredictionResponse>("/predict", {
        method: "POST",
        body: JSON.stringify(climate),
      });
      setPrediction(result);
      setIsOfflineMode(false);
    } catch {
      // Fallback to local calculation
      await new Promise((r) => setTimeout(r, 1800)); // simulate model time
      setPrediction(mockPrediction(climate));
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runComparison = useCallback(async (a: ClimateInput, b: ClimateInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<CompareResponse>("/compare", {
        method: "POST",
        body: JSON.stringify({ region_a: a, region_b: b }),
      });
      setCompareResult(result);
    } catch {
      // Mock comparison fallback
      const scoreA = calcOverallRiskScore(a);
      const scoreB = calcOverallRiskScore(b);
      setCompareResult({
        region_a: { name: a.region ?? "Region A", overall_score: scoreA, overall_label: getRiskLabel(scoreA), disease_scores: calcDiseaseScores(a) },
        region_b: { name: b.region ?? "Region B", overall_score: scoreB, overall_label: getRiskLabel(scoreB), disease_scores: calcDiseaseScores(b) },
        winner: scoreA > scoreB ? (a.region ?? "Region A") : (b.region ?? "Region B"),
        score_difference: Math.abs(scoreA - scoreB),
        recommendation: `${scoreA > scoreB ? a.region : b.region} has higher risk — prioritise intervention`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLiveClimate = useCallback(async (city: string): Promise<Partial<ClimateInput> | null> => {
    setIsFetching(true);
    try {
      const result = await apiFetch<LiveClimateResponse>(`/climate/live/${encodeURIComponent(city)}`);
      return {
        temperature: result.temperature,
        humidity: result.humidity,
        rainfall: result.rainfall,
        uv_index: result.uv_index,
        aqi: result.aqi ?? 100,
      };
    } catch {
      // Fallback: Open-Meteo directly
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results?.length) return null;
        const { latitude, longitude } = geoData.results[0];
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,uv_index&daily=precipitation_sum&forecast_days=7`);
        const wData = await wRes.json();
        const cur = wData.current ?? {};
        const daily = wData.daily ?? {};
        const rainfall7d = (daily.precipitation_sum ?? []).reduce((a: number, b: number) => a + b, 0);
        return {
          temperature: cur.temperature_2m ?? 30,
          humidity: cur.relative_humidity_2m ?? 70,
          rainfall: Math.round(rainfall7d),
          uv_index: cur.uv_index ?? 6,
          aqi: 100, // AQI requires separate API
        };
      } catch {
        return null;
      }
    } finally {
      setIsFetching(false);
    }
  }, []);

  const fetchSeasonalData = useCallback(async (): Promise<SeasonalData | null> => {
    try {
      return await apiFetch<SeasonalData>("/analytics/seasonal");
    } catch {
      return {
        months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        vector_borne:  [12,10,15,25,40,60,80,85,72,55,30,15],
        water_borne:   [10,8, 12,22,45,65,75,78,68,40,20,12],
        respiratory:   [60,55,40,25,18,12,10,10,15,25,45,58],
        heat_related:  [8, 10,22,45,70,85,90,88,65,35,15,8 ],
        skin_eye:      [10,15,35,55,78,88,90,85,65,40,20,12],
      };
    }
  }, []);

  const fetchModelMetrics = useCallback(async (): Promise<ModelMetrics | null> => {
    try {
      return await apiFetch<ModelMetrics>("/model/metrics");
    } catch {
      return null;
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setCompareResult(null);
    setError(null);
  }, []);

  return {
    prediction, compareResult, isLoading, isFetching, error, isOfflineMode,
    runPrediction, runComparison, fetchLiveClimate, fetchSeasonalData,
    fetchModelMetrics, clearPrediction,
  };
}
