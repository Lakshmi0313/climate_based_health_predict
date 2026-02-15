# 🌿 ClimateHealth AI
## Integrated Climate-Driven Disease Risk Prediction & Preventive Healthcare System

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-green)
![React](https://img.shields.io/badge/react-18-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Project Overview

ClimateHealth AI is a full-stack AI-powered dashboard that predicts disease risk based on real-time climate data and provides context-aware preventive healthcare recommendations.

**Built for:** Final Year Project | Public Health Hackathons | Research

---

## 📁 Project Structure

```
climatehealth-ai/
│
├── 📁 src/                          # React Frontend (TypeScript)
│   ├── App.tsx                      # Root component with nav + routing
│   ├── main.tsx                     # Entry point
│   │
│   ├── 📁 types/
│   │   └── index.ts                 # All TypeScript interfaces
│   │
│   ├── 📁 hooks/
│   │   └── useClimateHealth.ts      # API calls + offline fallback
│   │
│   ├── 📁 utils/
│   │   └── riskCalculations.ts      # Risk scoring + constants
│   │
│   └── 📁 components/
│       ├── RiskGauge.tsx            # Animated SVG gauge (0–100)
│       ├── Charts.tsx               # LineChart, BarChart, Heatmap
│       ├── UI.tsx                   # All reusable UI components
│       └── Pages.tsx                # All 5 tab page components
│
├── 📁 backend/
│   ├── main.py                      # FastAPI + XGBoost backend
│   └── requirements.txt             # Python dependencies
│
├── 📁 datasets/
│   ├── dataset1_training.xlsx       # 8,000 training samples
│   ├── dataset2_district_climate.xlsx  # 30 Indian districts
│   ├── dataset3_who_disease.xlsx    # WHO-format disease incidence
│   ├── dataset4_nasa_power.xlsx     # NASA POWER climate records
│   └── dataset5_model_performance.xlsx # XGBoost model metrics
│
├── index.html                       # HTML entry point
├── package.json                     # Node dependencies
├── vite.config.ts                   # Vite config
├── tsconfig.json                    # TypeScript config
├── .env.example                     # Environment variable template
└── README.md                        # This file
```

---

## 🚀 Quick Start (Frontend)

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# 1. Clone/download the project
cd climatehealth-ai

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env and set VITE_API_URL to your backend URL

# 4. Start development server
npm run dev
# Opens at http://localhost:5173
```

### Build for Production
```bash
npm run build
# Output in /dist folder — deploy to Vercel, Netlify, or Lovable
```

---

## 🐍 Quick Start (Backend)

### Prerequisites
- Python 3.10+

### Installation
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn main:app --reload --port 8000
# API docs at http://localhost:8000/docs
```

### Key API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Run disease risk prediction |
| GET | `/climate/live/{city}` | Fetch real climate data |
| POST | `/compare` | Compare two regions |
| POST | `/upload/csv` | Batch prediction from CSV |
| GET | `/analytics/seasonal` | Seasonal trend data |
| GET | `/model/metrics` | Model accuracy stats |

---

## ☁️ Free Deployment

### Backend → Render.com (Free)
1. Push backend folder to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect GitHub repo
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Copy the URL → add to `.env` as `VITE_API_URL`

### Frontend → Vercel (Free)
1. Push entire project to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Set environment variable: `VITE_API_URL=<your render URL>`
4. Deploy — Vercel auto-detects Vite

### Frontend → Lovable
1. Open your Lovable project
2. Replace `src/App.tsx` with our `App.tsx`
3. Add all other files from `src/` folder
4. Set the API URL in Lovable's environment settings

---

## 🤖 ML Model Details

| Property | Value |
|----------|-------|
| Algorithm | XGBoost (Classifier + 7 Regressors) |
| Training Samples | 8,000 synthetic + domain-knowledge samples |
| Features | Temperature, Humidity, Rainfall, AQI, UV Index, Month, Season |
| Output | Overall risk class (4) + 7 disease risk scores (0–100) |
| Overall Accuracy | 89.1% |
| Best Model | Heat-Related (91.2% accuracy) |

### Disease Models
| Disease Category | R² Score |
|-----------------|----------|
| Vector-Borne (Dengue/Malaria) | 0.882 |
| Water-Borne (Cholera/Typhoid) | 0.854 |
| Respiratory (Asthma/COPD) | 0.821 |
| Heat-Related | 0.912 |
| Nutritional | 0.798 |
| Mental Health | 0.762 |
| Skin & Eye | 0.901 |

---

## 🌐 Real Data Sources

| Source | URL | Data Type | Cost |
|--------|-----|-----------|------|
| Open-Meteo | api.open-meteo.com | Real-time weather | Free, no key |
| NASA POWER | power.larc.nasa.gov | Historical climate | Free, no key |
| OpenAQ | openaq.org | Air quality (AQI) | Free |
| WHO GHO | who.int/data/gho | Disease burden | Free |
| IDSP India | idsp.mohfw.gov.in | India surveillance | Free |

---

## 🏆 Hackathon Pitch

### Problem
1.2 billion people live in climate-vulnerable zones. Disease risk spikes with weather changes, but health systems react weeks too late.

### Solution
ClimateHealth AI provides **72-hour advance disease risk alerts** based on real-time climate data — enabling proactive public health response.

### Impact Metrics
- **7 disease categories** predicted simultaneously
- **89.1% model accuracy** on validation data
- **Real-time data** from Open-Meteo (zero cost)
- **30 Indian districts** covered out-of-box
- **14-day forecast** for early intervention

### Target Hackathons
- Health in Climate AI Hackathon (Cornell Tech NYC, Sept 2025)
- AI x City Climate Action Hackathon ($15K prize, Cambridge/C40)
- Smart India Hackathon (SIH)
- iDEA Hackathon (NITI Aayog)

---

## 📊 Dataset Guide

| File | Rows | Use For |
|------|------|---------|
| `dataset1_training.xlsx` | 8,000 | Training XGBoost models |
| `dataset2_district_climate.xlsx` | 30 | Dashboard map & regional data |
| `dataset3_who_disease.xlsx` | 1,000 | Validation & historical charts |
| `dataset4_nasa_power.xlsx` | 730 | Real climate validation |
| `dataset5_model_performance.xlsx` | — | Report/thesis metrics |

---

## 🔮 Future Enhancements

- [ ] **ASHA Worker Mobile App** (React Native)
- [ ] **District Choropleth Map** (Leaflet.js)
- [ ] **SMS Alert System** (Twilio)
- [ ] **Multilingual support** (Telugu, Hindi, Tamil)
- [ ] **IDSP real data integration**
- [ ] **Ensemble models** (XGBoost + LSTM for time-series)
- [ ] **API rate limiting + auth** (production)

---

## 👤 Author

**Final Year B.Tech Project**  
Integrated Climate-Driven Disease Risk Prediction System  
Built with ❤️ using React, FastAPI, XGBoost, and Open-Meteo

---

*"Empowering public health decisions with climate intelligence"*
