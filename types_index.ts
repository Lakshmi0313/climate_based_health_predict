// ══════════════════════════════════════════════════════
//  ClimateHealth AI — TypeScript Type Definitions
// ══════════════════════════════════════════════════════

export interface ClimateInput {
  temperature: number;   // °C
  humidity: number;      // %
  rainfall: number;      // mm (7-day)
  aqi: number;           // Air Quality Index
  uv_index: number;      // UV Index
  region?: string;
  month?: number;        // 1–12
}

export interface DiseaseRisk {
  disease: string;
  risk_score: number;         // 0–100
  risk_label: RiskLabel;
  confidence: number;         // 0–1
  contributing_factors: string[];
}

export type RiskLabel = "Low" | "Moderate" | "High" | "Critical";

export interface PredictionResponse {
  overall_risk_score: number;
  overall_risk_label: RiskLabel;
  overall_confidence: number;
  disease_risks: DiseaseRisk[];
  recommendations: Recommendation[];
  forecast_14day: ForecastDay[];
  timestamp: string;
  model_version: string;
}

export interface Recommendation {
  disease: string;
  icon: string;
  risk_score: number;
  severity: RiskLabel;
  type: "critical" | "warning" | "info" | "success";
  actions: string[];
}

export interface ForecastDay {
  day: number;
  date: string;
  risk_score: number;
  risk_label: RiskLabel;
}

export interface RegionCompareRequest {
  region_a: ClimateInput;
  region_b: ClimateInput;
}

export interface CompareResponse {
  region_a: {
    name: string;
    overall_score: number;
    overall_label: RiskLabel;
    disease_scores: Record<string, number>;
  };
  region_b: {
    name: string;
    overall_score: number;
    overall_label: RiskLabel;
    disease_scores: Record<string, number>;
  };
  winner: string;
  score_difference: number;
  recommendation: string;
  timestamp: string;
}

export interface LiveClimateResponse {
  city: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  uv_index: number;
  aqi: number | null;
  source: string;
  timestamp: string;
  note: string;
}

export interface SeasonalData {
  months: string[];
  vector_borne: number[];
  water_borne: number[];
  respiratory: number[];
  heat_related: number[];
  skin_eye: number[];
}

export interface ModelMetrics {
  model_version: string;
  training_samples: number;
  feature_count: number;
  disease_models: number;
  metrics: Record<string, number>;
  features_used: string[];
  disease_targets: string[];
  trained_at: string;
}

export interface DiseaseCategory {
  id: string;
  label: string;
  icon: string;
  examples: string;
  color: string;
  scoreKey: string;
}

export interface TrendDataPoint {
  month: string;
  temp: number;
  humidity: number;
  dengue: number;
  malaria: number;
  respiratory: number;
}

export interface RegionInfo {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}
