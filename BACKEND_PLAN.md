# RiskTerrain Backend — Full Implementation Plan

## Context
The frontend (React + Vite) is complete with a 3D globe dashboard, 154 S&P 500 company dots, event feed, and risk analysis panel — all running on hardcoded mock data. This plan builds the real backend so the dashboard displays live events processed through an AI agent pipeline.

**Stack**: Python 3.11+ / FastAPI / SurrealDB Cloud / LangGraph / Claude API
**SurrealDB**: Cloud instance using hackathon credits (50 EUR)

---

## 1. Project Structure

```
backend/
├── main.py                  # FastAPI app, CORS, mount routes
├── config.py                # Pydantic Settings from .env
├── requirements.txt
├── .env.example             # Template (never commit real .env)
├── db/
│   ├── surreal.py           # SurrealDB async client (connect, query helpers)
│   └── seed.py              # Seed companies + supply chain edges
├── agents/
│   ├── state.py             # LangGraph TypedDict state
│   ├── pipeline.py          # StateGraph definition + compile
│   └── nodes/
│       ├── event_intake.py       # Classify, validate, normalize
│       ├── geo_resolver.py       # Map event → countries, sectors
│       ├── graph_traverser.py    # Walk SurrealDB supply chain graph
│       ├── risk_scorer.py        # Claude scores each exposed company
│       ├── news_enricher.py      # Fetch latest headlines for context
│       └── report_generator.py   # Compile final DemoEvent-shaped output
├── ingest/
│   ├── usgs.py              # Poll USGS earthquake API (free, no key)
│   └── newsapi.py           # Poll NewsAPI for breaking news (free key)
└── routes/
    ├── companies.py         # GET /api/companies
    └── events.py            # GET /api/events, POST /api/events/analyze
```

---

## 2. API Keys Needed

| Service | Key Required? | Free Tier | Get At |
|---|---|---|---|
| **SurrealDB Cloud** | Yes (namespace/db creds) | 50 EUR hackathon credits | surrealist.app |
| **Anthropic Claude** | Yes | $5 free credits on signup | console.anthropic.com |
| **NewsAPI** | Yes | 100 req/day free | newsapi.org/register |
| **USGS Earthquake** | No | Fully free, no auth | earthquake.usgs.gov/fdsnws |

`.env.example`:
```env
# SurrealDB Cloud
SURREAL_URL=wss://YOUR_INSTANCE.surrealist.app/rpc
SURREAL_NAMESPACE=riskterrain
SURREAL_DATABASE=main
SURREAL_USER=root
SURREAL_PASS=your_password

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# NewsAPI
NEWSAPI_KEY=your_key_here

# Server
HOST=0.0.0.0
PORT=8000
```

---

## 3. SurrealDB Schema

Create these tables in SurrealDB Cloud console or via seed script:

```surql
-- Companies (S&P 500)
DEFINE TABLE company SCHEMAFULL;
DEFINE FIELD ticker ON company TYPE string;
DEFINE FIELD name ON company TYPE string;
DEFINE FIELD sector ON company TYPE string;
DEFINE FIELD lat ON company TYPE float;
DEFINE FIELD lng ON company TYPE float;
DEFINE FIELD mc ON company TYPE int;
DEFINE FIELD country ON company TYPE string DEFAULT 'USA';
DEFINE INDEX idx_ticker ON company FIELDS ticker UNIQUE;

-- Supply chain graph edges (the key differentiator)
-- Uses SurrealDB RELATE syntax: company:AAPL ->supplies-> company:TSMC
DEFINE TABLE supplies SCHEMAFULL;
DEFINE FIELD relationship ON supplies TYPE string;    -- "chip_fab", "cloud_provider", "raw_material"
DEFINE FIELD weight ON supplies TYPE float;            -- 0-1 dependency strength
DEFINE FIELD description ON supplies TYPE string;

-- Detected events
DEFINE TABLE event SCHEMAFULL;
DEFINE FIELD type ON event TYPE string;
DEFINE FIELD title ON event TYPE string;
DEFINE FIELD description ON event TYPE string;
DEFINE FIELD severity ON event TYPE int;
DEFINE FIELD source ON event TYPE string;
DEFINE FIELD affected_countries ON event TYPE array;
DEFINE FIELD affected_sectors ON event TYPE array;
DEFINE FIELD lat ON event TYPE float;
DEFINE FIELD lng ON event TYPE float;
DEFINE FIELD created_at ON event TYPE datetime;
DEFINE FIELD risks ON event TYPE object DEFAULT {};

-- Risk scores (normalized, linked to event)
DEFINE TABLE risk_score SCHEMAFULL;
DEFINE FIELD event_id ON risk_score TYPE string;
DEFINE FIELD ticker ON risk_score TYPE string;
DEFINE FIELD score ON risk_score TYPE float;
DEFINE FIELD reasoning ON risk_score TYPE string;
DEFINE FIELD created_at ON risk_score TYPE datetime;
```

### Supply Chain Seed Data (~200 edges)

Key relationships to seed — these drive the graph traversal:

```
TSMC  →supplies→ NVDA  (chip_fab, 0.90, "Manufactures 100% of NVIDIA GPUs")
TSMC  →supplies→ AAPL  (chip_fab, 0.85, "A-series and M-series chip production")
TSMC  →supplies→ AMD   (chip_fab, 0.88, "Primary fab for Ryzen and EPYC")
TSMC  →supplies→ QCOM  (chip_fab, 0.82, "5G modem and Snapdragon production")
TSMC  →supplies→ AVGO  (chip_fab, 0.70, "Custom ASIC fabrication")
AAPL  →supplies→ QCOM  (component, 0.40, "5G modem chips for iPhone")
AAPL  →supplies→ TXN   (component, 0.30, "Power management ICs")
AMZN  →supplies→ MSFT  (cloud_competition, 0.15, "AWS vs Azure market dynamics")
MSFT  →supplies→ NVDA  (ai_compute, 0.60, "Azure AI uses NVIDIA H100 GPUs")
GOOGL →supplies→ NVDA  (ai_compute, 0.55, "TPU alternatives but still heavy NVIDIA use")
XOM   →supplies→ CVX   (sector_peer, 0.30, "Correlated energy sector exposure")
JPM   →supplies→ BAC   (sector_peer, 0.25, "Correlated financial sector exposure")
...
```

Full seed script creates ~200 edges across tech, energy, finance, healthcare, and consumer sectors. Relationships are directional (supplier → customer) so graph traversal can find both upstream (supply) and downstream (demand) exposure.

---

## 4. LangGraph Agent Pipeline

### State Definition (`agents/state.py`)
```python
from typing import TypedDict

class RiskState(TypedDict):
    # Input
    raw_input: str                          # Raw event text or API payload
    # After event_intake
    event_type: str                         # natural_disaster | geopolitical | macro
    title: str
    description: str
    severity: int                           # 1-5
    source: str
    event_lat: float
    event_lng: float
    # After geo_resolver
    affected_countries: list[str]
    affected_sectors: list[str]
    # After graph_traverser
    exposed_companies: list[dict]           # [{ticker, name, sector, path, weight}]
    supply_chain_paths: list[str]           # Human-readable path descriptions
    # After risk_scorer
    risks: dict[str, dict]                  # {ticker: {score, reasoning}}
    # After news_enricher
    news_context: list[str]                 # Relevant headline strings
    # Final
    event_id: str                           # SurrealDB record ID
    created_at: str                         # ISO 8601
```

### Pipeline Graph (`agents/pipeline.py`)
```
event_intake → geo_resolver → graph_traverser → risk_scorer → news_enricher → report_generator
```

Each node is a function `(state: RiskState) -> dict` that returns partial state updates.

### Node Descriptions

**1. event_intake** — Takes raw text (news headline, USGS alert, or user input). Calls Claude to classify:
- Extract event type, title, description, severity (1-5), source
- Geocode the event to lat/lng (Claude can do this from context)
- If the input is from USGS API, parse structured JSON directly instead

**2. geo_resolver** — Determines affected countries and sectors:
- Claude analyzes the event description to identify all affected countries
- Maps to GICS sectors that would be impacted
- Returns `affected_countries: ["Taiwan", "China"]`, `affected_sectors: ["Technology", "Semiconductors"]`

**3. graph_traverser** — The SurrealDB-powered core:
```surql
-- Find companies in affected countries/sectors
SELECT * FROM company WHERE country IN $countries OR sector IN $sectors;

-- Walk supply chain graph (2-hop traversal)
SELECT
  <-supplies<-company AS suppliers,
  ->supplies->company AS customers
FROM company
WHERE country IN $countries;
```
- Collects directly exposed companies + second-order exposure via supply chain edges
- Returns list with dependency weights and path descriptions

**4. risk_scorer** — The Claude-powered core:
- Receives: event details + list of exposed companies + supply chain paths
- Claude prompt asks for a JSON object: `{ticker: {score: 0.0-1.0, reasoning: "one sentence"}}`
- Scores reflect direct exposure + supply chain dependency weight
- Claude sees the full context: event severity, company sector, dependency path, geographic overlap

**5. news_enricher** — Fetches 5-10 recent headlines from NewsAPI related to the event:
- Search query built from event title + affected sectors
- Headlines added as context for the final report
- Non-blocking: if NewsAPI fails, pipeline continues without it

**6. report_generator** — Compiles everything into the exact `DemoEvent` shape the frontend expects:
```python
return {
    "event_id": surreal_record_id,
    "created_at": datetime.utcnow().isoformat() + "Z",
    # Assembles the final DemoEvent dict matching frontend interface
}
```

---

## 5. API Endpoints

### `GET /api/companies`
Returns all 154 companies from SurrealDB in the exact `Company[]` shape.

### `GET /api/events`
Returns the latest 50 events from SurrealDB, each with their `risks` dict populated. Ordered by `created_at` DESC.

### `GET /api/events/{id}`
Returns a single event by ID.

### `POST /api/events/analyze`
**This is the main endpoint.** Accepts a raw event and runs the full LangGraph pipeline.

Request body:
```json
{
  "input": "M7.4 earthquake strikes Hualien County, Taiwan. TSMC pauses fab operations.",
  "source": "USGS"
}
```

Response (streams or returns after pipeline completes):
```json
{
  "id": "event:abc123",
  "type": "natural_disaster",
  "title": "M7.4 Earthquake — Taiwan",
  "description": "Major earthquake strikes Hualien County...",
  "severity": 5,
  "source": "USGS",
  "affected_countries": ["Taiwan"],
  "affected_sectors": ["Technology", "Semiconductors"],
  "lat": 24.0,
  "lng": 121.6,
  "created_at": "2026-03-08T14:32:00.000Z",
  "risks": {
    "NVDA": {"score": 0.94, "reasoning": "90% of supply chain routed through TSMC Taiwan fabs"},
    "AAPL": {"score": 0.88, "reasoning": "25% supply chain + 19% revenue exposure"}
  }
}
```

**Critical**: Response shape matches `DemoEvent` interface exactly — frontend can consume it directly.

### `GET /api/health`
```json
{"status": "ok", "surreal": "connected", "model": "claude-sonnet-4-6"}
```

---

## 6. Frontend Integration Changes

### File: `frontend/vite.config.ts`
Add dev proxy so `/api` calls route to the backend:
```ts
export default defineConfig({
  plugins: [react()],
  base: '/Risk-Terrain-Hackathon-SurrealDB-Langchain/',
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

### File: `frontend/src/components/dashboard/RiskTerrain.jsx`
Key changes (minimal — keep all UI code, just swap data source):

1. **Replace hardcoded `DEMO_EVENTS` with API fetch on mount:**
```jsx
// Replace the pre-seed useState with:
const [events, setEvents] = useState([]);

// Replace the auto-trigger useEffect with:
useEffect(() => {
  fetch('/api/events').then(r => r.json()).then(data => {
    setEvents(data);
    if (data.length > 0) {
      setActiveEvent(data[0]);
      setView("report");
    }
  });
}, []);
```

2. **Replace `handleTrigger(idx)` with real API call:**
```jsx
const handleTrigger = useCallback(async (idx) => {
  const prompts = [
    "M7.4 earthquake strikes Hualien County, Taiwan. TSMC pauses fab operations.",
    "US Treasury announces new export controls on semiconductor technology to China.",
    "Federal Reserve raises interest rates by 75 basis points."
  ];
  setProcessing(true);
  const res = await fetch('/api/events/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: prompts[idx], source: 'manual' })
  });
  const evt = await res.json();
  setEvents(prev => [evt, ...prev]);
  setActiveEvent(evt);
  setView("report");
  setProcessing(false);
}, []);
```

3. **Companies can stay hardcoded** (154 entries in mockData.ts) or optionally load from `/api/companies`. Hardcoded is fine for the hackathon since company data is static.

4. **Keep the `SIMULATE EVENT` buttons** — they now call the real pipeline instead of using setTimeout mock delays. The processing overlay naturally shows during the real API call (~3-8 seconds).

### File: `frontend/src/data/mockData.ts`
Keep all interfaces (`Company`, `DemoEvent`, `RiskEntry`) and the `SP500_SAMPLE` array. Only remove the hardcoded `DEMO_EVENTS` array (it moves to the backend).

---

## 7. Implementation Order (Tomorrow)

### Phase 1: Infrastructure (30 min)
1. Create `backend/` directory + `requirements.txt` + `main.py` + `config.py`
2. Create SurrealDB Cloud instance at surrealist.app
3. Set up `.env` with all credentials
4. Verify FastAPI starts and health check works

### Phase 2: Database + Seed (45 min)
1. Connect to SurrealDB Cloud
2. Run schema DDL (define tables, fields, indexes)
3. Seed 154 companies (copy coordinates from `mockData.ts`)
4. Seed ~200 supply chain edges (the differentiating feature)
5. Verify: `SELECT * FROM company` returns 154 rows
6. Verify: `SELECT ->supplies->company FROM company:NVDA` returns supply chain

### Phase 3: LangGraph Pipeline (1.5 hr)
1. Define `RiskState` TypedDict
2. Build nodes one at a time: event_intake → geo_resolver → graph_traverser → risk_scorer → news_enricher → report_generator
3. Wire into StateGraph with sequential flow
4. Test with hardcoded Taiwan earthquake input
5. Verify output matches `DemoEvent` JSON shape exactly

### Phase 4: API Routes (30 min)
1. `GET /api/companies` — query SurrealDB, return Company[]
2. `GET /api/events` — query SurrealDB, return DemoEvent[]
3. `POST /api/events/analyze` — invoke LangGraph pipeline, store result, return DemoEvent
4. Test all endpoints via Swagger UI at `localhost:8000/docs`

### Phase 5: Frontend Wiring (30 min)
1. Add Vite proxy config
2. Swap RiskTerrain.jsx data fetching (3 small edits described in Section 6)
3. Test end-to-end: click SIMULATE EVENT → see processing overlay → globe flies to event → risk panel shows real Claude-generated scores

### Phase 6: Event Ingestion (30 min, optional)
1. USGS earthquake poller (background task, checks every 60s)
2. NewsAPI headline scanner
3. Auto-feed detected events into the pipeline

**Total estimate: ~4 hours**

---

## 8. Dependencies (`requirements.txt`)

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
surrealdb==0.3.2
anthropic==0.39.0
langgraph==0.2.0
langchain-anthropic==0.2.0
python-dotenv==1.0.1
httpx==0.27.0
pydantic-settings==2.5.0
```

---

## 9. Verification Checklist

1. `cd backend && uvicorn main:app --reload` → starts on :8000
2. `GET /api/health` → `{"status":"ok","surreal":"connected"}`
3. `GET /api/companies` → 154 companies, each with ticker/name/sector/lat/lng/mc
4. `POST /api/events/analyze` with earthquake text → returns DemoEvent with Claude-generated risk scores in ~5-8 seconds
5. `GET /api/events` → shows the event we just analyzed
6. Frontend: load `/dashboard` → events load from API, globe shows company dots
7. Frontend: click SIMULATE EVENT → real processing overlay → real risk scores appear
8. Globe arcs draw from event epicenter to affected companies
9. Risk panel shows Claude-generated reasoning per company
10. Supply chain paths visible: TSMC disruption → NVDA, AAPL, AMD scored high

---

## 10. Key Design Decisions

- **SurrealDB graph traversal is the core differentiator** — the supply chain RELATE edges + multi-hop queries are what make this a "SurrealDB hackathon" project, not just "Claude + REST API"
- **Claude handles classification AND scoring** — two separate calls (event_intake uses a cheap fast call, risk_scorer uses a detailed prompt with full context)
- **Frontend changes are minimal** — only 3 edits in RiskTerrain.jsx + 1 in vite.config.ts. All UI stays the same.
- **Pipeline is synchronous for hackathon** — no WebSocket streaming needed. The 3-8 second wait maps naturally to the existing "AGENT PROCESSING" overlay.
- **Companies stay hardcoded on frontend** — the 154-company array with coordinates doesn't change. Backend seeds the same data into SurrealDB for graph queries.
