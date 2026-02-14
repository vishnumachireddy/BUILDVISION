# 🏗️ ConstructIQ — AI-Powered Construction Planning Platform

> **Version:** 1.0.0  
> **Date:** February 13, 2026  
> **Status:** ✅ Fully Functional  

---

## 📌 Overview

**ConstructIQ** is an AI-powered web application that helps users plan residential construction projects by simply drawing a plot boundary on a satellite map. The system automatically calculates land area, generates an optimized room layout, estimates material quantities, provides a detailed cost breakdown, and renders an interactive 3D model — all in real time.

---

## 🎯 Problem Statement

Manual construction estimation is time-consuming, error-prone, and requires expert knowledge. ConstructIQ automates this entire pipeline — from plot measurement to cost estimation — making it accessible to anyone, from homeowners to civil engineering professionals.

---

## ✨ Key Features

### 1. 🗺️ Interactive Satellite Map (Draw-to-Build)
- Integrated **Leaflet.js** map with OpenStreetMap satellite tiles
- Users click on the map to place polygon boundary points
- Real-time polygon visualization with marker pins
- Default centered on **Hyderabad, India** (17.385°N, 78.487°E)
- Supports any geographic location worldwide

### 2. 📐 Precision Area & Perimeter Calculation
- **Haversine formula** for accurate great-circle distance on Earth's surface
- **Shoelace algorithm** on locally projected coordinates for polygon area
- Outputs in both **metric (m², meters)** and **imperial (sq ft, feet)** units
- Automatic **buildable area** calculation with setback deductions:
  - Small plots (<1,000 sq ft): 10% setback
  - Medium plots (1,000–3,000 sq ft): 15% setback
  - Large plots (>3,000 sq ft): 20% setback
- Smart validation with warnings for plots that are too small (<300 sq ft) or too large (>20,000 sq ft)

### 3. 🏠 Intelligent Room Layout Generation
- Auto-detects property type based on buildable area:
  - **1BHK** — under 800 sq ft
  - **2BHK** — 800 to 1,500 sq ft
  - **3BHK** — 1,500 to 2,500 sq ft
  - **4BHK** — above 2,500 sq ft
- Generates rooms with realistic proportions (3:4 aspect ratio):
  - **Living Hall** (22% of area)
  - **Kitchen & Dining** (12% of area)
  - **Bedrooms** (40% of area, split equally)
  - **Bathrooms** (10% of area)
- Each room includes dimensions (width × length) and area in sq ft
- Color-coded floor plan rendered in both 2D grid and 3D model

### 4. 🧱 Material Quantity Estimation
Uses industry-standard **thumb rules** for residential construction:

| Material       | Formula / Rule                           |
|----------------|------------------------------------------|
| **Cement**     | 4.5 bags per sq m of built-up area       |
| **Steel**      | 3.5 kg per sq ft of built-up area        |
| **Bricks**     | 9 bricks per sq ft (for 9" walls)        |
| **Sand**       | 1 ton per 250 sq ft of built-up area     |
| **Aggregate**  | 1.4× of sand volume                      |
| **Paint**      | Wall surface (4× floor area) ÷ 120 sq ft per liter (2 coats) |
| **Flooring**   | 90% of buildable area                    |

### 5. 💰 Cost Breakdown (INR)
Calculates a detailed cost estimate using average **Indian market rates**:

| Item                 | Rate              |
|----------------------|-------------------|
| Cement               | ₹400 per bag      |
| Steel                | ₹75 per kg        |
| Bricks               | ₹12 per unit      |
| Sand                 | ₹1,500 per ton    |
| Aggregate            | ₹1,200 per ton    |
| Paint                | ₹350 per liter    |
| Flooring (tiles+lay) | ₹120 per sq ft    |

**Cost categories:**
- **Material Cost** — Sum of all material quantities × rates
- **Labor Cost** — 65% of material cost
- **Finishing Cost** — 20% of (material + labor), covering electrical, plumbing, and woodwork
- **Total** = Material + Labor + Finishing

### 6. 🏗️ Interactive 3D Model Viewer
- Built with **Three.js** via `@react-three/fiber` and `@react-three/drei`
- Renders color-coded room volumes as 3D boxes with proper proportions
- Features:
  - **Auto-rotation** for 360° view
  - **Orbit controls** — drag to rotate, scroll to zoom
  - **Room labels** displayed on top of each block (name, dimensions, area)
  - **Dimension annotations** on width and length faces
  - **Wireframe overlays** for structural clarity
  - **HDR city environment lighting** for realistic rendering
  - **Grid floor** for spatial reference
  - **Interactive legend** with room names and colors

### 7. 📊 Dashboard with Project Summary
- Hero section with gradient card and call-to-action
- Quick-view stat cards showing: Total Area, Total Cost, Layout Type, Material Cost
- Engineering disclaimer for professional verification
- Seamless navigation to all analysis views

### 8. 📄 Reports (Coming Soon)
- PDF export module placeholder — planned for next release

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React + Vite)               │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐  │
│  │Dashboard │ │Satellite   │ │Analysis  │ │ 3D Model    │  │
│  │  Page    │ │Map (Leaflet│ │ + Costs  │ │ (Three.js)  │  │
│  └──────────┘ └────────────┘ └──────────┘ └─────────────┘  │
│               ↕ Axios HTTP (REST API)                       │
├─────────────────────────────────────────────────────────────┤
│                       BACKEND (FastAPI + Uvicorn)           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Layer (api/)                                    │   │
│  │  ├── /api/calculate-area   → Area + Perimeter        │   │
│  │  └── /api/generate-plan    → Full Construction Plan  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Service Layer (services/)                           │   │
│  │  ├── geometry.py    → Haversine + Shoelace           │   │
│  │  ├── layout.py      → BHK & Room Generation         │   │
│  │  ├── materials.py   → Quantity Estimation            │   │
│  │  └── cost.py        → INR Cost Breakdown             │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Schema Layer (schemas/)                             │   │
│  │  └── polygon.py     → Pydantic Validation Models     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer        | Technology                                          |
|--------------|-----------------------------------------------------|
| **Frontend** | React 19, Vite 7, JavaScript (JSX)                  |
| **Styling**  | TailwindCSS v4, Inline Styles, Lucide Icons         |
| **3D Engine**| Three.js, @react-three/fiber, @react-three/drei     |
| **Mapping**  | Leaflet.js, react-leaflet, OpenStreetMap             |
| **Backend**  | Python, FastAPI, Uvicorn, Pydantic                   |
| **HTTP**     | Axios (frontend) → REST API (backend)                |
| **Tooling**  | TypeScript config, ESLint, Vite HMR                  |

---

## 📡 API Endpoints

### `GET /`
Returns a welcome message.

### `GET /health`
Health check endpoint. Returns `{ "status": "healthy" }`.

### `POST /api/calculate-area`
Calculates area and perimeter from polygon coordinates.

**Request Body:**
```json
{
  "coordinates": [[17.385, 78.486], [17.386, 78.487], [17.385, 78.488]]
}
```

**Response:**
```json
{
  "area_sqm": 5432.10,
  "area_sqft": 58482.30,
  "perimeter_m": 320.50,
  "perimeter_ft": 1051.52,
  "buildable_area_sqft": 46785.84,
  "status": "success",
  "warnings": []
}
```

### `POST /api/generate-plan`
Full construction planning pipeline — area, layout, materials, and cost.

**Request Body:** Same as `/api/calculate-area`

**Response:**
```json
{
  "area_metrics": { "area_sqm": ..., "area_sqft": ..., "perimeter_m": ..., "perimeter_ft": ..., "buildable_area_sqft": ... },
  "layout_plan": { "bhk_type": "3BHK", "total_area_sqft": ..., "rooms": [...], "efficiency_ratio": 0.85 },
  "material_estimate": { "cement_bags": ..., "steel_kg": ..., "bricks_count": ..., "sand_tons": ..., "aggregate_tons": ..., "paint_liters": ..., "flooring_sqft": ... },
  "cost_estimate": { "material_cost": ..., "labor_cost": ..., "finishing_cost": ..., "total_estimated_cost": ..., "currency": "INR" }
}
```

---

## 📂 Project Structure

```
ConstructIQ/
├── backend/
│   ├── main.py                 # FastAPI app entry point, CORS, router mounts
│   ├── requirements.txt        # Python dependencies
│   ├── api/
│   │   ├── calculation.py      # /api/calculate-area endpoint
│   │   └── project.py          # /api/generate-plan endpoint
│   ├── schemas/
│   │   └── polygon.py          # Pydantic models (PolygonRequest, AreaResponse)
│   ├── services/
│   │   ├── geometry.py         # Haversine distance, Shoelace area, perimeter, validation
│   │   ├── layout.py           # BHK detection, room generation with dimensions
│   │   ├── materials.py        # Material quantity estimation (7 materials)
│   │   └── cost.py             # Cost calculation with INR rates
│   └── venv/                   # Python virtual environment
│
├── frontend/
│   ├── index.html              # Entry HTML
│   ├── package.json            # Node dependencies & scripts
│   ├── vite.config.js          # Vite + React + TailwindCSS plugin config
│   ├── tsconfig.json           # TypeScript configuration
│   ├── src/
│   │   ├── main.jsx            # React DOM render entry
│   │   ├── App.jsx             # Main application (all views, state, styling)
│   │   ├── index.css           # Global styles with Tailwind imports
│   │   └── components/
│   │       └── MapComponent.jsx  # Leaflet satellite map with polygon drawing
│   └── node_modules/           # Installed packages
│
└── test_payload.json           # Sample API test payload
```

---

## 🚀 How to Run

### Prerequisites
- **Python 3.10+** with `pip`
- **Node.js 18+** with `npm`

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Backend runs at: **http://localhost:8000**  
Swagger docs at: **http://localhost:8000/docs**

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

## 🔄 Application Workflow

```mermaid
graph LR
    A[🗺️ Draw Polygon on Map] --> B[📐 Calculate Area & Perimeter]
    B --> C[🏠 Generate Room Layout]
    C --> D[🧱 Estimate Material Quantities]
    D --> E[💰 Calculate Cost Breakdown]
    E --> F[🏗️ Render 3D Model]
    F --> G[📊 Display Dashboard Summary]
```

1. **User draws** a polygon on the satellite map by clicking boundary points
2. **Clicks "Generate Complete Plan"** button
3. **Backend processes** the coordinates through 4 service layers
4. **Frontend displays** results across 4 tabs: Dashboard, Analysis, 3D Model, Reports

---

## 🧪 Testing

### Sample Test Payload (`test_payload.json`)
```json
{
  "coordinates": [[17.385, 78.486], [17.386, 78.487], [17.385, 78.488]]
}
```

### cURL Test
```bash
curl -X POST http://localhost:8000/api/generate-plan \
  -H "Content-Type: application/json" \
  -d '{"coordinates": [[17.385, 78.486], [17.386, 78.487], [17.385, 78.488]]}'
```

---

## 🎨 UI/UX Design Highlights

- **Dark sidebar** with gradient navigation and glow effects
- **Collapsible sidebar** with icon-only mode
- **Hero cards** with glassmorphism and gradient overlays
- **Color-coded material cards** for visual distinction
- **Responsive stat grids** with smooth hover transitions
- **Loading overlay** with animated spinner and blur backdrop
- **3D auto-rotation** with orbit controls and HDR lighting
- **Engineering disclaimer** for professional accountability

---

## 📈 Future Enhancements (Roadmap)

- [ ] PDF report export with charts and floor plans
- [ ] Multi-floor support (2/3 story buildings)
- [ ] Database integration (PostgreSQL) for project saving
- [ ] User authentication and project history
- [ ] AI-powered material recommendations using machine learning
- [ ] Terrain slope analysis from satellite elevation data
- [ ] Building code compliance checking by region
- [ ] Cost comparison across different cities/states
- [ ] Contractor marketplace integration

---

## ⚠️ Disclaimer

> This system provides **AI-assisted estimation only**. Final structural design must be verified by a **licensed civil engineer**. Satellite measurements are approximate. Material quantities and costs are based on industry thumb rules and average Indian market rates, and may vary by region, terrain, and specific project requirements.

---

## 👨‍💻 Built With

Developed as an **AI-powered Construction Intelligence Platform** combining:
- Geospatial computing (Haversine + Shoelace algorithms)
- Rule-based engineering estimation
- Interactive 3D visualization
- Modern full-stack web architecture

---

*ConstructIQ v1.0.0 — Making construction planning smarter, faster, and accessible to everyone.*
