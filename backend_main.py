"""
╔══════════════════════════════════════════════════════════════════════════╗
║  ClimateHealth AI — FastAPI + XGBoost Backend                          ║
║  Integrated Climate-Driven Disease Risk Prediction System              ║
║                                                                        ║
║  SETUP:                                                                ║
║    pip install fastapi uvicorn xgboost scikit-learn pandas numpy       ║
║               python-multipart requests python-dotenv                  ║
║                                                                        ║
║  RUN:   uvicorn main:app --reload --port 8000                          ║
║  DOCS:  http://localhost:8000/docs  (Swagger UI auto-generated)        ║
║                                                                        ║
║  DEPLOY FREE:  render.com  →  New Web Service  →  paste GitHub repo   ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json, io, os, logging
from datetime import datetime, timedelta
import requests

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("climatehealth")

# ── App Init ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ClimateHealth AI API",
    description="Integrated Climate-Driven Disease Risk Prediction & Preventive Healthcare System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow your Lovable frontend) ───────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # restrict to your Lovable URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
#  SECTION 1: PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class ClimateInput(BaseModel):
    temperature: float = Field(..., ge=-10, le=60, description="Temperature in °C")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity %")
    rainfall: float = Field(..., ge=0, le=1000, description="7-day rainfall in mm")
    aqi: float = Field(..., ge=0, le=500, description="Air Quality Index (0–500)")
    uv_index: float = Field(..., ge=0, le=15, description="UV Index")
    region: Optional[str] = "Unknown"
    month: Optional[int] = None   # 1–12; if None, uses current month

    class Config:
        json_schema_extra = {
            "example": {
                "temperature": 33.5,
                "humidity": 80,
                "rainfall": 195,
                "aqi": 115,
                "uv_index": 7.5,
                "region": "Visakhapatnam",
                "month": 10,
            }
        }

class DiseaseRisk(BaseModel):
    disease: str
    risk_score: float          # 0–100
    risk_label: str            # Low / Moderate / High / Critical
    confidence: float          # 0–1
    contributing_factors: List[str]

class PredictionResponse(BaseModel):
    overall_risk_score: float
    overall_risk_label: str
    overall_confidence: float
    disease_risks: List[DiseaseRisk]
    recommendations: List[Dict]
    forecast_14day: List[Dict]
    timestamp: str
    model_version: str = "XGBoost-v2.1"

class RegionCompareRequest(BaseModel):
    region_a: ClimateInput
    region_b: ClimateInput

class BatchUploadResponse(BaseModel):
    rows_processed: int
    predictions: List[Dict]
    summary: Dict


# ═══════════════════════════════════════════════════════════════════════════════
#  SECTION 2: SYNTHETIC TRAINING DATA GENERATOR
#  (Replace with real WHO + NASA POWER data in production)
# ═══════════════════════════════════════════════════════════════════════════════

def generate_training_data(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generates realistic synthetic climate–disease correlation data.
    
    PRODUCTION UPGRADE: Replace this with:
    - WHO Global Health Observatory CSV exports
    - India IDSP district surveillance data
    - NASA POWER API climate records (power.larc.nasa.gov)
    """
    np.random.seed(42)
    
    records = []
    for _ in range(n_samples):
        month      = np.random.randint(1, 13)
        temp       = np.random.normal(28 + 5 * np.sin((month - 6) * np.pi / 6), 4)
        humidity   = np.random.normal(65 + 20 * np.sin((month - 8) * np.pi / 6), 12)
        rainfall   = max(0, np.random.exponential(100 + 80 * np.sin(max(0, (month - 7) * np.pi / 5))))
        aqi        = max(0, np.random.normal(90 + 30 * np.cos((month - 1) * np.pi / 6), 25))
        uv         = max(1, np.random.normal(6 + 3 * np.cos((month - 7) * np.pi / 6), 1.5))
        
        # Disease risk logic (domain-knowledge driven rules)
        # These mirror the biological/epidemiological relationships
        
        # Vector-borne (Dengue, Malaria): high humidity + warmth + post-rain
        vector_risk = (
            0.35 * max(0, humidity - 55) / 45 +
            0.25 * max(0, temp - 22) / 18 +
            0.20 * min(1, rainfall / 200) +
            0.10 * (1 if 7 <= month <= 11 else 0.2) +
            0.10 * np.random.beta(2, 5)
        )
        
        # Water-borne (Cholera, Typhoid): flooding + heat + poor sanitation proxy
        water_risk = (
            0.40 * min(1, rainfall / 250) +
            0.25 * max(0, temp - 25) / 15 +
            0.20 * max(0, humidity - 60) / 40 +
            0.15 * np.random.beta(2, 5)
        )
        
        # Respiratory (Asthma, COPD, Flu): high AQI + cold season
        respiratory_risk = (
            0.45 * min(1, aqi / 200) +
            0.25 * max(0, 25 - temp) / 20 +
            0.15 * (1 if month in [11, 12, 1, 2] else 0.2) +
            0.15 * np.random.beta(2, 5)
        )
        
        # Heat-related (Heatstroke, dehydration): extreme temp + UV + low humidity
        heat_risk = (
            0.50 * max(0, temp - 28) / 17 +
            0.25 * min(1, uv / 10) +
            0.15 * (1 if month in [4, 5, 6] else 0.2) +
            0.10 * np.random.beta(2, 5)
        )
        
        # Nutritional: drought (low rainfall) + heat
        nutrition_risk = (
            0.35 * max(0, 1 - rainfall / 100) +
            0.30 * max(0, temp - 30) / 15 +
            0.20 * (1 if month in [3, 4, 5] else 0.2) +
            0.15 * np.random.beta(2, 5)
        )
        
        # Mental health: extreme heat + poor air quality
        mental_risk = (
            0.35 * max(0, temp - 30) / 15 +
            0.30 * min(1, aqi / 200) +
            0.20 * max(0, humidity - 70) / 30 +
            0.15 * np.random.beta(2, 5)
        )
        
        # Skin/Eye: UV exposure + heat
        skin_risk = (
            0.55 * min(1, uv / 11) +
            0.25 * max(0, temp - 28) / 17 +
            0.20 * np.random.beta(2, 5)
        )
        
        # Overall risk = weighted combination
        overall = (
            0.25 * vector_risk +
            0.20 * water_risk +
            0.18 * respiratory_risk +
            0.15 * heat_risk +
            0.10 * nutrition_risk +
            0.07 * mental_risk +
            0.05 * skin_risk
        )
        
        # Convert to 0–3 class labels (Low/Moderate/High/Critical)
        def to_label(score):
            if score < 0.25: return 0
            if score < 0.50: return 1
            if score < 0.75: return 2
            return 3
        
        records.append({
            "temperature": round(temp, 2),
            "humidity":    round(max(0, min(100, humidity)), 2),
            "rainfall":    round(max(0, rainfall), 2),
            "aqi":         round(max(0, aqi), 2),
            "uv_index":    round(max(1, uv), 2),
            "month":       month,
            "season":      (month % 12) // 3,   # 0=Winter 1=Spring 2=Summer 3=Monsoon
            
            # Continuous targets
            "vector_score":      round(min(1, vector_risk), 4),
            "water_score":       round(min(1, water_risk), 4),
            "respiratory_score": round(min(1, respiratory_risk), 4),
            "heat_score":        round(min(1, heat_risk), 4),
            "nutrition_score":   round(min(1, nutrition_risk), 4),
            "mental_score":      round(min(1, mental_risk), 4),
            "skin_score":        round(min(1, skin_risk), 4),
            "overall_score":     round(min(1, overall), 4),
            
            # Classified targets
            "overall_label":     to_label(overall),
        })
    
    return pd.DataFrame(records)


# ═══════════════════════════════════════════════════════════════════════════════
#  SECTION 3: MODEL TRAINING
# ═══════════════════════════════════════════════════════════════════════════════

FEATURES = ["temperature", "humidity", "rainfall", "aqi", "uv_index", "month", "season"]
DISEASE_TARGETS = ["vector_score", "water_score", "respiratory_score", "heat_score",
                   "nutrition_score", "mental_score", "skin_score"]

class ModelRegistry:
    """Holds all trained XGBoost models and scalers."""
    
    def __init__(self):
        self.overall_clf = None     # XGBoost classifier for overall risk level
        self.disease_regs = {}      # XGBoost regressors for each disease score
        self.scaler = StandardScaler()
        self.is_trained = False
        self.training_metrics = {}
    
    def train(self):
        logger.info("🔄 Generating training data...")
        df = generate_training_data(n_samples=8000)
        
        X = df[FEATURES].values
        X_scaled = self.scaler.fit_transform(X)
        
        # 1) Train overall risk classifier (4-class)
        y_clf = df["overall_label"].values
        X_tr, X_te, y_tr, y_te = train_test_split(X_scaled, y_clf, test_size=0.2, random_state=42)
        
        self.overall_clf = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=42,
        )
        self.overall_clf.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)
        
        clf_acc = accuracy_score(y_te, self.overall_clf.predict(X_te))
        self.training_metrics["overall_accuracy"] = round(clf_acc, 4)
        logger.info(f"✅ Overall classifier accuracy: {clf_acc:.3f}")
        
        # 2) Train disease-specific regression models
        for target in DISEASE_TARGETS:
            y_reg = df[target].values
            X_tr2, X_te2, y_tr2, y_te2 = train_test_split(X_scaled, y_reg, test_size=0.2, random_state=42)
            
            reg = xgb.XGBRegressor(
                n_estimators=150,
                max_depth=5,
                learning_rate=0.08,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
            )
            reg.fit(X_tr2, y_tr2, eval_set=[(X_te2, y_te2)], verbose=False)
            self.disease_regs[target] = reg
            
            pred_te = reg.predict(X_te2)
            rmse = np.sqrt(np.mean((pred_te - y_te2) ** 2))
            self.training_metrics[f"{target}_rmse"] = round(rmse, 4)
        
        self.is_trained = True
        logger.info("🎉 All models trained successfully!")
        return self.training_metrics
    
    def predict(self, climate: ClimateInput) -> dict:
        if not self.is_trained:
            raise RuntimeError("Models not trained yet")
        
        month = climate.month if climate.month else datetime.now().month
        season = (month % 12) // 3
        
        X_raw = np.array([[
            climate.temperature, climate.humidity, climate.rainfall,
            climate.aqi, climate.uv_index, month, season
        ]])
        X_scaled = self.scaler.transform(X_raw)
        
        # Overall risk
        overall_label_idx = int(self.overall_clf.predict(X_scaled)[0])
        overall_proba = self.overall_clf.predict_proba(X_scaled)[0]
        overall_confidence = float(np.max(overall_proba))
        
        LABELS = ["Low", "Moderate", "High", "Critical"]
        overall_label = LABELS[overall_label_idx]
        overall_score = round((overall_label_idx / 3) * 75 + overall_confidence * 25, 1)
        
        # Disease scores
        disease_scores = {}
        for target in DISEASE_TARGETS:
            raw = float(self.disease_regs[target].predict(X_scaled)[0])
            disease_scores[target] = round(min(1.0, max(0.0, raw)) * 100, 1)
        
        return {
            "overall_score": overall_score,
            "overall_label": overall_label,
            "overall_confidence": overall_confidence,
            "disease_scores": disease_scores,
        }


# Singleton model registry
registry = ModelRegistry()


# ═══════════════════════════════════════════════════════════════════════════════
#  SECTION 4: BUSINESS LOGIC
# ═══════════════════════════════════════════════════════════════════════════════

DISEASE_META = {
    "vector_score":      {"name": "Vector-Borne",   "icon": "🦟", "diseases": ["Dengue", "Malaria", "Chikungunya"]},
    "water_score":       {"name": "Water-Borne",    "icon": "💧", "diseases": ["Cholera", "Typhoid", "Hepatitis A"]},
    "respiratory_score": {"name": "Respiratory",    "icon": "🫁", "diseases": ["Asthma", "COPD", "Influenza"]},
    "heat_score":        {"name": "Heat-Related",   "icon": "🌡️", "diseases": ["Heatstroke", "Dehydration"]},
    "nutrition_score":   {"name": "Nutritional",    "icon": "🥗", "diseases": ["Malnutrition", "Vitamin deficiency"]},
    "mental_score":      {"name": "Mental Health",  "icon": "🧠", "diseases": ["Climate anxiety", "Depression"]},
    "skin_score":        {"name": "Skin & Eye",     "icon": "👁️", "diseases": ["Conjunctivitis", "UV Damage"]},
}

def score_to_label(score: float) -> str:
    if score < 25: return "Low"
    if score < 50: return "Moderate"
    if score < 75: return "High"
    return "Critical"

def identify_contributing_factors(climate: ClimateInput, disease_key: str) -> List[str]:
    factors = []
    if disease_key == "vector_score":
        if climate.humidity > 75: factors.append(f"High humidity ({climate.humidity}%) promotes mosquito breeding")
        if climate.temperature > 28: factors.append(f"Warm temperature ({climate.temperature}°C) accelerates pathogen lifecycle")
        if climate.rainfall > 120: factors.append(f"Heavy rainfall ({climate.rainfall}mm) creates stagnant water pools")
    elif disease_key == "water_score":
        if climate.rainfall > 150: factors.append(f"Excessive rainfall ({climate.rainfall}mm) may cause flooding & contamination")
        if climate.temperature > 30: factors.append("High temperature promotes bacterial growth in water")
    elif disease_key == "respiratory_score":
        if climate.aqi > 100: factors.append(f"Poor air quality (AQI {climate.aqi}) irritates respiratory tract")
        if climate.uv_index > 7: factors.append("High UV promotes ground-level ozone formation")
    elif disease_key == "heat_score":
        if climate.temperature > 35: factors.append(f"Extreme temperature ({climate.temperature}°C) causes thermal stress")
        if climate.uv_index > 8: factors.append(f"Intense UV ({climate.uv_index}) increases radiant heat load")
    elif disease_key == "skin_score":
        if climate.uv_index > 7: factors.append(f"High UV index ({climate.uv_index}) increases skin cancer & eye damage risk")
        if climate.temperature > 32: factors.append("Heat promotes inflammatory skin conditions")
    if not factors:
        factors.append("Multiple moderate climate stressors present")
    return factors

def generate_recommendations(disease_scores: dict, climate: ClimateInput) -> List[Dict]:
    recs = []
    sorted_risks = sorted(disease_scores.items(), key=lambda x: x[1], reverse=True)
    
    for key, score in sorted_risks:
        if score < 40: continue
        meta = DISEASE_META.get(key, {})
        label = score_to_label(score)
        
        actions = []
        if key == "vector_score":
            actions = [
                "Eliminate standing water in containers, tyres, flowerpots",
                "Use DEET-based mosquito repellent (apply every 4 hours)",
                "Sleep under permethrin-treated insecticide nets",
                f"Visit nearest PHC for {'malaria prophylaxis' if climate.rainfall > 150 else 'fever screening'} if symptomatic",
                "Wear full-sleeve clothing during dawn and dusk",
            ]
        elif key == "water_score":
            actions = [
                "Boil drinking water for minimum 1 minute or use ORS",
                "Avoid raw street food, salads, and cut fruits",
                "Wash hands with soap for 20 seconds before meals",
                "Report contaminated water sources to municipal corporation",
                "Oral Rehydration Solution (ORS) ready for diarrheal illnesses",
            ]
        elif key == "respiratory_score":
            actions = [
                f"Wear N95 mask outdoors (AQI = {climate.aqi})",
                "Avoid outdoor exercise during 6–9 AM peak pollution",
                "Keep bronchodilator inhalers accessible if asthmatic",
                "Use indoor air purifiers if available",
                "Monitor AQI via SAFAR or AQI India app before outings",
            ]
        elif key == "heat_score":
            actions = [
                "Drink 3–4 litres of water per day; add ORS or electrolytes",
                f"Avoid outdoor exposure 11 AM – 4 PM (temperature: {climate.temperature}°C)",
                "Wear light-coloured loose cotton clothing",
                "Know heatstroke signs: hot dry skin, confusion, >40°C body temp",
                "Set up cooling centres for vulnerable community members",
            ]
        elif key == "skin_score":
            actions = [
                f"Apply SPF 50+ broad-spectrum sunscreen (UV index: {climate.uv_index})",
                "Wear UV-blocking sunglasses (UV400 rated)",
                "Use umbrella or wide-brim hat outdoors",
                "Schedule annual eye check-up with ophthalmologist",
            ]
        elif key == "nutrition_score":
            actions = [
                "Ensure diversified diet with seasonal local vegetables",
                "Monitor weight and growth parameters in children under 5",
                "Consult ICDS Anganwadi for nutritional supplements if needed",
                "Store food safely to prevent spoilage in heat",
            ]
        elif key == "mental_score":
            actions = [
                "Maintain social connections; check on elderly neighbours",
                "Limit news consumption about climate disasters",
                "Ensure adequate sleep in cool, dark environment",
                "Contact iCall (9152987821) for mental health support",
            ]
        
        if actions:
            recs.append({
                "disease": meta.get("name", key),
                "icon": meta.get("icon", "⚠️"),
                "risk_score": score,
                "severity": label,
                "type": "critical" if score >= 75 else "warning" if score >= 50 else "info",
                "actions": actions[:4],   # top 4 most important
            })
    
    if not recs:
        recs.append({
            "disease": "General Health",
            "icon": "✅",
            "risk_score": 10,
            "severity": "Low",
            "type": "success",
            "actions": [
                "Continue regular handwashing hygiene",
                "Stay hydrated and maintain balanced nutrition",
                "Monitor local district health bulletins weekly",
                "Schedule annual comprehensive health checkup",
            ],
        })
    return recs

def generate_14day_forecast(climate: ClimateInput, base_score: float) -> List[Dict]:
    """Generates a 14-day risk projection with daily variation."""
    forecast = []
    for day in range(1, 15):
        date = datetime.now() + timedelta(days=day)
        # Simulate variation: risk tends to rise slightly then normalise
        variation = np.random.normal(0, 4) + (day * 0.3 if base_score > 60 else -day * 0.2)
        daily_score = round(min(100, max(5, base_score + variation)), 1)
        forecast.append({
            "day": day,
            "date": date.strftime("%d %b"),
            "risk_score": daily_score,
            "risk_label": score_to_label(daily_score),
        })
    return forecast


# ═══════════════════════════════════════════════════════════════════════════════
#  SECTION 5: API ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_event():
    """Train models when server starts."""
    logger.info("🚀 ClimateHealth AI starting up...")
    try:
        metrics = registry.train()
        logger.info(f"📊 Training metrics: {metrics}")
    except Exception as e:
        logger.error(f"❌ Model training failed: {e}")


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "ClimateHealth AI API",
        "version": "2.0.0",
        "status": "operational",
        "models_ready": registry.is_trained,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "models_trained": registry.is_trained,
        "training_metrics": registry.training_metrics,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_disease_risk(climate: ClimateInput):
    """
    🔬 MAIN PREDICTION ENDPOINT
    
    Submit climate parameters → receive disease risk scores + recommendations.
    
    The XGBoost model analyses 7 disease categories using:
    - Temperature, Humidity, Rainfall, AQI, UV Index
    - Month-of-year seasonality patterns
    - 8,000-sample training dataset
    """
    if not registry.is_trained:
        raise HTTPException(503, "Models still training. Retry in 30 seconds.")
    
    try:
        model_out = registry.predict(climate)
        
        # Build disease risk objects
        disease_risks = []
        for key, score in model_out["disease_scores"].items():
            meta = DISEASE_META.get(key, {})
            factors = identify_contributing_factors(climate, key)
            disease_risks.append(DiseaseRisk(
                disease=meta.get("name", key),
                risk_score=score,
                risk_label=score_to_label(score),
                confidence=round(0.78 + (score / 100) * 0.15, 3),
                contributing_factors=factors,
            ))
        
        # Sort by risk score descending
        disease_risks.sort(key=lambda x: x.risk_score, reverse=True)
        
        recs = generate_recommendations(model_out["disease_scores"], climate)
        forecast = generate_14day_forecast(climate, model_out["overall_score"])
        
        return PredictionResponse(
            overall_risk_score=model_out["overall_score"],
            overall_risk_label=model_out["overall_label"],
            overall_confidence=round(model_out["overall_confidence"], 3),
            disease_risks=disease_risks,
            recommendations=recs,
            forecast_14day=forecast,
            timestamp=datetime.now().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(500, f"Prediction failed: {str(e)}")


@app.post("/compare", tags=["Prediction"])
async def compare_regions(request: RegionCompareRequest):
    """
    ⚖️ COMPARE TWO REGIONS SIDE BY SIDE
    
    Submit climate data for two regions and receive a comparative risk analysis.
    """
    if not registry.is_trained:
        raise HTTPException(503, "Models not ready")
    
    result_a = registry.predict(request.region_a)
    result_b = registry.predict(request.region_b)
    
    return {
        "region_a": {
            "name": request.region_a.region,
            "overall_score": result_a["overall_score"],
            "overall_label": result_a["overall_label"],
            "disease_scores": result_a["disease_scores"],
        },
        "region_b": {
            "name": request.region_b.region,
            "overall_score": result_b["overall_score"],
            "overall_label": result_b["overall_label"],
            "disease_scores": result_b["disease_scores"],
        },
        "winner": request.region_a.region if result_a["overall_score"] > result_b["overall_score"] else request.region_b.region,
        "score_difference": round(abs(result_a["overall_score"] - result_b["overall_score"]), 1),
        "recommendation": f"{'Region A' if result_a['overall_score'] > result_b['overall_score'] else 'Region B'} has higher risk and requires priority intervention",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/climate/live/{city}", tags=["Climate Data"])
async def fetch_live_climate(city: str):
    """
    🌐 FETCH REAL-TIME CLIMATE DATA
    
    Uses Open-Meteo (free, no API key) and Open-Meteo Geocoding to get
    real-time climate data for any city. 
    """
    # Step 1: Geocode the city
    geocode_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1"
    try:
        geo_resp = requests.get(geocode_url, timeout=5)
        geo_data = geo_resp.json()
        if not geo_data.get("results"):
            raise HTTPException(404, f"City '{city}' not found in geocoding database")
        
        loc = geo_data["results"][0]
        lat, lon = loc["latitude"], loc["longitude"]
        city_name = loc["name"]
        
    except requests.RequestException:
        # Fallback coordinates for common Indian cities
        FALLBACK = {
            "visakhapatnam": (17.6868, 83.2185),
            "hyderabad":     (17.3850, 78.4867),
            "mumbai":        (19.0760, 72.8777),
            "delhi":         (28.7041, 77.1025),
            "chennai":       (13.0827, 80.2707),
        }
        coords = FALLBACK.get(city.lower())
        if not coords:
            raise HTTPException(503, "Geocoding service unavailable and city not in fallback list")
        lat, lon = coords
        city_name = city
    
    # Step 2: Fetch current weather from Open-Meteo
    weather_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,uv_index"
        f"&daily=precipitation_sum"
        f"&forecast_days=7"
    )
    
    try:
        w_resp = requests.get(weather_url, timeout=8)
        w_data = w_resp.json()
        current = w_data.get("current", {})
        daily   = w_data.get("daily", {})
        
        rainfall_7d = sum(daily.get("precipitation_sum", [0])) if daily else 0
        
        return {
            "city": city_name,
            "latitude": lat,
            "longitude": lon,
            "temperature":  current.get("temperature_2m", 30),
            "humidity":     current.get("relative_humidity_2m", 70),
            "rainfall":     round(rainfall_7d, 1),
            "uv_index":     current.get("uv_index", 6),
            "aqi":          None,   # Open-Meteo free tier doesn't include AQI; use OpenAQ for this
            "source":       "Open-Meteo (open-meteo.com)",
            "timestamp":    datetime.now().isoformat(),
            "note":         "AQI requires OpenAQ API integration (free). See /docs for setup."
        }
    except Exception as e:
        raise HTTPException(503, f"Weather fetch failed: {str(e)}")


@app.post("/upload/csv", tags=["Batch Processing"])
async def upload_csv_batch(file: UploadFile = File(...)):
    """
    📁 BATCH PREDICTION FROM CSV UPLOAD
    
    Upload a CSV with columns: temperature, humidity, rainfall, aqi, uv_index, region
    Returns predictions for all rows.
    
    Max recommended: 1000 rows per request.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files accepted")
    
    if not registry.is_trained:
        raise HTTPException(503, "Models not ready")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        
        required_cols = {"temperature", "humidity", "rainfall", "aqi", "uv_index"}
        if not required_cols.issubset(df.columns):
            missing = required_cols - set(df.columns)
            raise HTTPException(400, f"Missing columns: {missing}")
        
        predictions = []
        for _, row in df.iterrows():
            try:
                climate = ClimateInput(
                    temperature=row["temperature"],
                    humidity=row["humidity"],
                    rainfall=row["rainfall"],
                    aqi=row["aqi"],
                    uv_index=row["uv_index"],
                    region=row.get("region", "Unknown"),
                )
                result = registry.predict(climate)
                predictions.append({
                    "region": climate.region,
                    "overall_score": result["overall_score"],
                    "overall_label": result["overall_label"],
                    "disease_scores": result["disease_scores"],
                })
            except Exception:
                predictions.append({"error": "Invalid row", "row": row.to_dict()})
        
        scores = [p["overall_score"] for p in predictions if "overall_score" in p]
        
        return BatchUploadResponse(
            rows_processed=len(df),
            predictions=predictions,
            summary={
                "avg_risk_score": round(np.mean(scores), 1) if scores else 0,
                "max_risk_score": round(max(scores), 1) if scores else 0,
                "high_risk_rows": sum(1 for s in scores if s >= 60),
                "critical_rows": sum(1 for s in scores if s >= 75),
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"CSV processing failed: {str(e)}")


@app.get("/analytics/seasonal", tags=["Analytics"])
async def get_seasonal_analytics():
    """📊 Returns seasonal disease risk patterns for charting."""
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    seasonal = {
        "months": months,
        "vector_borne":  [12, 10, 15, 25, 40, 60, 80, 85, 72, 55, 30, 15],
        "water_borne":   [10, 8,  12, 22, 45, 65, 75, 78, 68, 40, 20, 12],
        "respiratory":   [60, 55, 40, 25, 18, 12, 10, 10, 15, 25, 45, 58],
        "heat_related":  [8,  10, 22, 45, 70, 85, 90, 88, 65, 35, 15, 8 ],
        "skin_eye":      [10, 15, 35, 55, 78, 88, 90, 85, 65, 40, 20, 12],
    }
    return seasonal


@app.get("/model/metrics", tags=["Model"])
async def get_model_metrics():
    """📊 Returns model training accuracy and performance metrics."""
    if not registry.is_trained:
        raise HTTPException(503, "Models not trained yet")
    return {
        "model_version": "XGBoost-v2.1",
        "training_samples": 8000,
        "feature_count": 7,
        "disease_models": len(registry.disease_regs),
        "metrics": registry.training_metrics,
        "features_used": FEATURES,
        "disease_targets": DISEASE_TARGETS,
        "trained_at": datetime.now().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  SECTION 6: PRODUCTION UPGRADES (commented — enable when ready)
# ═══════════════════════════════════════════════════════════════════════════════

"""
PRODUCTION CHECKLIST:
─────────────────────

1. REAL TRAINING DATA (most important):
   - Download WHO Global Health Observatory datasets
   - Use NASA POWER API: https://power.larc.nasa.gov/api/temporal/daily/point
   - India IDSP data: https://idsp.mohfw.gov.in
   - Replace generate_training_data() with a real data loader

2. DATABASE:
   - pip install sqlalchemy asyncpg
   - Store all predictions in PostgreSQL for audit trails
   - Use Alembic for migrations

3. AUTHENTICATION:
   - pip install python-jose[cryptography] passlib
   - Add JWT-based API key auth for production

4. MODEL PERSISTENCE:
   - Save trained models to disk:
       import joblib
       joblib.dump(registry.overall_clf, "models/overall_clf.pkl")
   - Load on startup instead of retraining every time

5. OPEN-METEO AQI:
   - Use OpenAQ free API: https://api.openaq.org
   - Add as optional enhancement to /climate/live/{city}

6. ENVIRONMENT VARIABLES (.env file):
   ANTHROPIC_API_KEY=your_key          # for AI recommendations
   DATABASE_URL=postgresql://...
   ALLOWED_ORIGINS=https://your-lovable-app.lovable.app

7. DOCKER DEPLOYMENT:
   Create Dockerfile:
       FROM python:3.11-slim
       COPY . .
       RUN pip install -r requirements.txt
       CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
"""


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
