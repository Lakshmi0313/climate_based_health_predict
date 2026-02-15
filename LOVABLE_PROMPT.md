# ══════════════════════════════════════════════════════════════════════
#  LOVABLE / VERCEL AI PROMPT
#  ClimateHealth AI — Full-Stack Implementation
#  Copy this ENTIRE prompt into Lovable or v0.dev
# ══════════════════════════════════════════════════════════════════════

## PASTE THIS INTO LOVABLE (lovable.dev):

Build a complete full-stack React + TypeScript web application called **"ClimateHealth AI — Integrated Climate-Driven Disease Risk Prediction and Preventive Healthcare System"**.

---

### TECH STACK
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom dark theme
- **Charts**: Recharts (line charts, bar charts, area charts)
- **Icons**: Lucide React
- **HTTP**: Axios or fetch for API calls
- **State**: React useState + useEffect (no Redux needed)
- **Routing**: React Router v6 (5 main pages/tabs)

---

### BACKEND API INTEGRATION
Connect to this FastAPI backend deployed on Render.com:
- Base URL: `https://climatehealth-api.onrender.com` (replace with your actual URL after deploying the Python backend)
- Key endpoints:
  - `POST /predict` — main prediction
  - `GET /climate/live/{city}` — fetch real climate data
  - `POST /compare` — compare two regions
  - `GET /analytics/seasonal` — chart data
  - `POST /upload/csv` — batch upload
  - `GET /model/metrics` — model performance

If the API is unavailable, use mock data fallback so the UI always works.

---

### DESIGN SYSTEM
- **Color palette**:
  - Background: `#060d1a` (deep navy)
  - Surface cards: `rgba(255,255,255,0.04)` with `rgba(255,255,255,0.08)` border
  - Primary accent: `#0ea5e9` (sky blue)
  - Secondary: `#14b8a6` (teal)
  - Success/Low risk: `#22c55e`
  - Warning/Moderate: `#eab308`
  - High risk: `#f97316`
  - Critical: `#ef4444`
- **Typography**: DM Sans (import from Google Fonts)
- **Border radius**: 16px for cards, 10px for inputs, 8px for buttons
- **Glassmorphism**: backdrop-filter blur(10px) on cards
- **Background**: Animated radial gradient glows (blue + teal) fixed behind content

---

### PAGES / NAVIGATION TABS

Create a sticky top navigation bar with these 5 tabs:

#### 1. 🏠 Dashboard (default page)
- **4 Overview KPI cards** in a grid: Temperature, Humidity, Rainfall, AQI
  - Each card has: icon, current value, sub-label, sparkline chart (last 5 readings)
  - Cards have colored left border matching metric (orange=temp, blue=humidity, teal=rain, red/green=AQI)
- **3-column middle section**:
  - Col 1: Risk Gauge SVG — animated arc gauge from 0–100. Color changes: green(<25), yellow(<50), orange(<75), red(>=75). Shows score + label in center
  - Col 2: Disease Risk Snapshot — 7 horizontal progress bars (one per disease category) with animated fill and color-coded labels
  - Col 3: Quick Actions — region dropdown, UV slider, "Edit Climate Data" button, "Run Prediction" button (gradient)
- **7-month trend line chart** (Recharts LineChart) showing Dengue, Malaria, Respiratory trends with legend
- Subtle animated background glow divs

#### 2. 🌡️ Climate Input
- **Left column**:
  - Region selector dropdown (10 Indian cities)
  - "Auto-Fetch Live Climate Data" button — calls `/climate/live/{city}` → auto-fills all fields. Shows loading spinner
  - 5 climate parameter fields (Temperature, Humidity, Rainfall, AQI, UV Index):
    - Each has: label, range slider + number input side by side, min/max labels
    - Slider accent color matches metric
- **Right column**:
  - Region comparison checkbox — when checked, shows a second set of inputs for a compare city
  - Drag-and-drop CSV upload area (dashed border, hover effect, file icon)
  - Run Prediction button (large, gradient, full-width, loading state with spinner)
  - Last prediction result badge (shows when prediction exists)

#### 3. 🔬 Risk Analysis
- Empty state: centered illustration + message + "Go to Climate Input" button
- After prediction:
  - **Main risk card** (accent border): large Risk Gauge + score + label + confidence bar + primary risk factor
  - **Comparison card** (only if comparing): same layout for second region
  - **7 disease category cards** in a 4-column grid:
    - Each card: emoji icon, disease name, example diseases, horizontal progress bar, risk level badge, score number
    - Card border color = risk color of that disease
    - Hover: border brightens
  - **14-day bar chart**: animated bars colored by their risk level

#### 4. 💊 Recommendations
- Empty state when no prediction
- After prediction: 
  - Header card showing region + date + overall risk badge
  - Dynamic recommendation blocks (only shown for diseases with risk ≥ 40):
    - Background tinted by severity (red=critical, orange=warning, blue=info, green=safe)
    - Header: emoji + disease name + severity pill
    - 2×2 grid of action checklist items (checkmark icon + action text)
    - Types: critical (red), warning (orange), info (blue), success (green)
  - Export buttons row: "Download PDF Report", "Copy as Text", "Email to Team"

#### 5. 📊 Analytics
- **2-column row**: Climate Trend chart + Disease Incidence chart (Recharts LineCharts)
- **Full-width seasonal heatmap table**:
  - Rows: 5 disease categories
  - Columns: 12 months
  - Cell color: green/yellow/orange/red based on value (0–100)
  - Cell shows numeric risk value
  - Hover tooltip shows exact value
- **3-column bottom row**:
  - Highest Risk Regions ranking list (5 cities with progress bars + change indicators)
  - Historical comparison bar chart (5 years)
  - Model performance accuracy bars (5 diseases, green color)

---

### KEY COMPONENTS TO BUILD

```typescript
// 1. RiskGauge.tsx — SVG arc gauge
// Props: score: number, size?: number
// Animated arc from green→yellow→orange→red

// 2. SparkLine.tsx — Mini SVG polyline
// Props: data: number[], color: string

// 3. DiseaseCard.tsx — Disease risk category card
// Props: disease, icon, score, examples, color

// 4. RecommendationBlock.tsx — Health advice block
// Props: type, icon, title, actions[]

// 5. ClimateInputField.tsx — Slider + number input combo
// Props: label, min, max, value, onChange, unit, color

// 6. AlertBanner.tsx — Fixed top alert when risk >= 60
// Animated slide-down, dismissible
```

---

### ALERT SYSTEM
When prediction risk score >= 60:
- Show a **fixed alert banner** below the navbar (position: fixed, top: 64px)
- Background: `linear-gradient(90deg, #ef444499, #f97316aa)` with backdrop blur
- Content: ⚠️ icon + "HIGH RISK ALERT — {region}" + score
- Dismissible with × button

---

### LOADING STATES
- **App loading screen** (1.5s on mount): centered globe emoji spinning + "ClimateHealth AI" + animated progress bar
- **Run Prediction**: button text changes to "⏳ Running XGBoost Model…" with spinner, + subtitle "Analysing 47 climate-disease correlations…"
- **Auto-fetch climate**: button shows "⏳ Fetching…"
- Smooth transitions on all chart updates (0.8s ease)

---

### RESPONSIVE LAYOUT
- Mobile (< 768px): all grids stack to 1 column, nav becomes scrollable, gauge size reduces to 150px
- Tablet (768–1024px): 2-column grids
- Desktop: full multi-column layout

---

### API CALL PATTERN
```typescript
// In a custom hook: useClimateHealth.ts
const API_BASE = import.meta.env.VITE_API_URL || "https://your-backend.onrender.com";

export const runPrediction = async (climate: ClimateInput) => {
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(climate),
    });
    return await res.json();
  } catch (error) {
    // Return mock data on failure so UI always works
    return getMockPrediction(climate);
  }
};

// Mock fallback for offline/demo mode
const getMockPrediction = (climate: ClimateInput) => ({
  overall_risk_score: 65,
  overall_risk_label: "High",
  overall_confidence: 0.87,
  disease_risks: [...],   // mock data
  recommendations: [...],
  forecast_14day: [...],
});
```

---

### ENV VARIABLES (.env)
```
VITE_API_URL=https://your-backend.onrender.com
```

---

### EXTRA POLISH
- All cards: `transition: border-color 0.2s` + hover brightens border
- Run button: hover lifts with `transform: translateY(-2px)` + stronger shadow
- Numbers animate up when prediction loads (count-up effect)
- Footer: "ClimateHealth AI · XGBoost + React · Final Year Project · Hackathon Ready"
- Favicon: use a medical cross or leaf emoji

---

### OUTPUT REQUIREMENTS
1. Create all component files properly separated
2. Include `src/hooks/useClimateHealth.ts` for all API calls + mock fallback
3. Include `src/types/index.ts` for all TypeScript interfaces
4. Include `src/utils/riskCalculations.ts` for risk scoring logic
5. Working navigation between all 5 tabs
6. All charts must render with demo data even without API
7. README with setup and deployment instructions

Build this as a production-quality final year project dashboard.
