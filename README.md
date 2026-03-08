# RiskTerrain

### Geospatial S&P 500 Risk Intelligence Platform

> Real-time geopolitical event detection, supply chain knowledge graph traversal, and AI-powered risk scoring — visualized on a 3D globe.

**London Hackathon 2025 — LangChain x SurrealDB**

---

## Demo Video

<!-- REPLACE_VIDEO_URL: Drag hackathon.mp4 into a GitHub Issue comment, copy the generated URL, and paste it below -->
https://github.com/user-attachments/assets/PASTE_YOUR_VIDEO_URL_HERE

> 2-minute project overview demonstrating the full pipeline: live event detection, SurrealDB graph traversal, AI risk scoring, and 3D globe visualization.

---

## What It Does

RiskTerrain monitors the world for disruptive events — earthquakes, sanctions, market shocks — and instantly maps how they ripple through the S&P 500 supply chain. When a crisis hits, the system:

1. **Detects the event** from live data feeds (USGS earthquakes, NewsAPI headlines)
2. **Classifies it** using AI (type, severity, geographic footprint)
3. **Walks the supply chain graph** in SurrealDB to find exposed companies (direct suppliers, second-order dependencies, sector peers)
4. **Scores each company's risk** from 0.0 to 1.0 with natural language reasoning
5. **Persists everything** to SurrealDB — events, risk scores, and vector embeddings for historical similarity search
6. **Visualizes it** on a 3D globe with real-time arcs, pulsing risk indicators, and interactive dashboards

**Example**: A M7.4 earthquake in Taiwan triggers automatic detection. The graph traverser finds TSMC (directly affected), then traces downstream to NVIDIA, AMD, Apple, and Qualcomm through semiconductor supply chain edges. Each company gets a risk score with reasoning like *"NVDA: 0.94 — sole-source GPU dependency on TSMC fab capacity, 90% weight supply chain edge."*

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Agent Orchestration** | LangGraph (StateGraph) | 6-node DAG pipeline with MemorySaver checkpointing |
| **Knowledge Graph** | SurrealDB | 154 companies + ~90 supply chain edges as a graph (RELATE edges) |
| **Vector Search** | langchain-surrealdb VectorStore | Historical event similarity via embeddings |
| **Graph QA** | langchain-surrealdb GraphQAChain | Natural language queries over the supply chain |
| **AI Scoring** | Gemini Flash + Claude | Event classification, risk synthesis, portfolio analysis |
| **Live Data** | USGS API, NewsAPI | Earthquake monitoring (60s poll) + breaking news (15min poll) |
| **Frontend** | React 19 + Vite + TypeScript | 3D globe (react-globe.gl), floating widget dashboard |
| **Market Data** | yfinance | Real-time stock prices and changes |

---

## Architecture

```
                         ┌─────────────────────────────────────┐
                         │         LIVE DATA SOURCES           │
                         │  USGS Earthquakes  │  NewsAPI       │
                         │  (60s polling)     │  (15min poll)  │
                         └────────┬──────────┬────────────────┘
                                  │          │
                                  ▼          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     LANGGRAPH PIPELINE (6 Nodes)                     │
│                                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │  EVENT    │──▶│   GEO    │──▶│    GRAPH     │──▶│    NEWS      │ │
│  │  INTAKE   │   │ RESOLVER │   │  TRAVERSER   │   │  ENRICHER    │ │
│  │          │   │          │   │              │   │              │ │
│  │ Classify  │   │ Countries│   │ 5-Phase Walk │   │ Headlines    │ │
│  │ Severity  │   │ Sectors  │   │ + VectorDB   │   │ from NewsAPI │ │
│  └──────────┘   └──────────┘   └──────────────┘   └──────────────┘ │
│                                        │                      │      │
│                                        ▼                      ▼      │
│                              ┌──────────────┐   ┌──────────────┐    │
│                              │    RISK       │──▶│   REPORT     │    │
│                              │   SCORER      │   │  GENERATOR   │    │
│                              │               │   │              │    │
│                              │ 0.0-1.0 per   │   │ Persist to   │    │
│                              │ company + why  │   │ SurrealDB    │    │
│                              └──────────────┘   └──────────────┘    │
│                                                                      │
│  State: RiskState (TypedDict) │ Checkpoint: MemorySaver             │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        SURREALDB (Cloud)                             │
│                                                                      │
│  ┌───────────┐    supplies     ┌───────────┐                        │
│  │  company   │───(RELATE)────▶│  company   │  154 S&P 500 nodes    │
│  │           │    weight: 0.9  │           │  ~90 supply edges      │
│  │ TSMC      │    rel: chip_fab│ NVDA      │                        │
│  └───────────┘                 └───────────┘                        │
│                                                                      │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐             │
│  │   event    │  │  risk_score   │  │  vector_store    │             │
│  │ (document) │  │  (per ticker) │  │  (embeddings)    │             │
│  └───────────┘  └──────────────┘  └──────────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (3D Globe)                         │
│                                                                      │
│  Globe3D ── company dots with risk-colored POIs + hover cards        │
│          ── event epicenter rings (pulsing)                          │
│          ── supply chain arcs (color-coded by relationship)          │
│          ── event-to-company impact arcs                             │
│                                                                      │
│  Widgets: Market Data │ Portfolio Risk │ Live News │ Custom Tracker  │
│           Sector Filter │ Live Streams │ Supply Chain │ Settings     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## SurrealDB Knowledge Graph

### Schema

```sql
-- Company nodes
DEFINE TABLE company SCHEMAFULL;
DEFINE FIELD ticker ON company TYPE string;
DEFINE FIELD name   ON company TYPE string;
DEFINE FIELD sector ON company TYPE string;
DEFINE FIELD lat    ON company TYPE float;
DEFINE FIELD lng    ON company TYPE float;
DEFINE FIELD mc     ON company TYPE int;      -- market cap in $B
DEFINE FIELD country ON company TYPE string;
DEFINE INDEX idx_ticker ON company FIELDS ticker UNIQUE;

-- Supply chain edges (graph relations)
DEFINE TABLE supplies SCHEMAFULL TYPE RELATION IN company OUT company;
DEFINE FIELD relationship ON supplies TYPE string;
DEFINE FIELD weight       ON supplies TYPE float;    -- 0.0-1.0 dependency strength
DEFINE FIELD description  ON supplies TYPE string;

-- Events persisted from pipeline
DEFINE TABLE event SCHEMAFULL;
-- ... type, title, description, severity, source, affected_countries, etc.

-- Per-ticker risk scores
DEFINE TABLE risk_score SCHEMAFULL;
-- ... event_id, ticker, score, reasoning, created_at
```

### Graph Data

**154 S&P 500 companies** across all 11 sectors, plus key international players (TSMC, ASML, Samsung, Toyota, Shell, Nestle, SAP, Sony, Alibaba).

**~90 supply chain edges** with relationship types:
- `chip_fab` — TSMC fabricates chips for NVDA, AMD, QCOM, AAPL, INTC
- `semiconductor` — ASML supplies lithography to TSMC, Samsung
- `ai_compute` — NVDA supplies AI GPUs to MSFT, GOOGL, AMZN, META
- `cloud_provider` — AWS/Azure/GCP infrastructure dependencies
- `component` — Hardware supply relationships (AAPL ← QCOM, etc.)
- `logistics` — Shipping and distribution dependencies
- `sector_peer` — Correlated sector exposure
- `financial`, `energy`, `raw_materials`, `software`, `licensing`

### Graph Traversal (5-Phase)

The `graph_traverser` node executes a multi-hop supply chain walk:

```
Phase A: Direct Geographic Exposure
  SELECT * FROM company WHERE country IN $affected_countries

Phase B: 1-Hop Downstream (who depends on affected companies?)
  SELECT out.ticker FROM supplies WHERE in = company:$ticker

Phase C: 1-Hop Upstream (who supplies affected companies?)
  SELECT in.ticker FROM supplies WHERE out = company:$ticker
  (weighted at 0.7x — upstream less directly affected)

Phase D: 2-Hop Downstream (secondary cascade effects)
  Walk through Phase B results to find tertiary exposure

Phase E: Sector Correlation
  SELECT * FROM company WHERE sector IN $affected_sectors AND country = 'USA'
```

Each phase aggregates exposure weights that flow into the risk scorer.

### Vector Store (Historical Similarity)

Events are embedded using `sentence-transformers/all-MiniLM-L6-v2` and stored in SurrealDB via `langchain-surrealdb` VectorStore. When a new event occurs, the graph traverser searches for the 5 most similar historical events to provide precedent context for risk scoring.

### Graph QA Chain

Natural language queries over the supply chain graph via `langchain-surrealdb` GraphQAChain:

```
"Who supplies NVIDIA?" → Traverses graph → "TSMC (chip_fab, 90%), ASML (semiconductor, 60%)..."
```

---

## LangGraph Pipeline

### 6-Node Stateful DAG

Each node reads from and writes to a shared `RiskState` (TypedDict), with `MemorySaver` checkpointing for state persistence across the pipeline.

| Node | Input State | Output State | AI Model |
|------|------------|-------------|----------|
| **event_intake** | `raw_input` | `event_type, title, description, severity, lat, lng` | Gemini Flash |
| **geo_resolver** | `title, description, event_type` | `affected_countries, affected_sectors` | Gemini Flash |
| **graph_traverser** | `affected_countries, affected_sectors` | `exposed_companies, supply_chain_paths, similar_historical_events` | SurrealDB queries + VectorStore |
| **news_enricher** | `title, affected_sectors` | `news_context, news_articles` | NewsAPI |
| **risk_scorer** | `exposed_companies, supply_chain_paths, news_context` | `risks: {ticker: {score, reasoning}}` | Gemini Flash |
| **report_generator** | All state | `event_id, created_at, final_output` | SurrealDB writes |

### Pipeline Invocation

```python
from agents.pipeline import run_pipeline

# Returns a complete DemoEvent with risk scores
event = run_pipeline(
    raw_input="M7.4 earthquake strikes southern Taiwan, TSMC fabs report shaking",
    source="manual"
)
# event["risks"]["NVDA"] → {"score": 0.94, "reasoning": "..."}
```

### Checkpointing

Each pipeline invocation gets a unique `thread_id` (8-char UUID). The `MemorySaver` checkpointer tracks state at each node boundary, enabling:
- Post-hoc inspection of intermediate state
- Error recovery (partial pipeline results preserved)
- LangSmith trace integration for full observability

---

## Live Data Ingestion

### USGS Earthquake Monitor
- Polls USGS API every 60 seconds for M5.0+ earthquakes worldwide
- New quakes automatically trigger the full LangGraph pipeline
- Bounded cache (500 event IDs) prevents duplicate processing

### NewsAPI Scanner
- Polls every 15 minutes for breaking news matching 37+ crisis keywords
- Two-tier deduplication: Jaccard word overlap (0.60 threshold) + Gemini Flash semantic check
- Keywords include: sanctions, earthquake, war, tariff, recession, cyberattack, oil, pandemic, etc.
- Matched articles trigger the pipeline with the headline as input

---

## Frontend Dashboard

### 3D Globe Visualization
- **Company POIs**: 154+ colored dots on the globe, sized by risk exposure
- **Rich Hover Cards**: Ticker, company name, sector, market cap, and risk score with AI reasoning
- **Persistent Labels**: At-risk companies show floating ticker tags with risk percentages
- **Event Rings**: Pulsing red rings at crisis epicenters
- **Company Risk Rings**: Pulsing colored rings around at-risk companies (severity-matched colors)
- **Supply Chain Arcs**: Color-coded animated arcs showing supplier relationships
- **Impact Arcs**: Dashed arcs connecting events to affected companies

### Floating Widget System
8 draggable, resizable widgets with glassmorphism styling:

| Widget | Description |
|--------|-------------|
| **Market Data** | Live stock prices with 1D/7D/30D changes (yfinance) |
| **Portfolio Risk** | AI-powered portfolio analysis via Claude — concentration risk, sector exposure, supply chain vulnerabilities |
| **Live News** | Breaking news feed from NewsAPI with relevance filtering |
| **Supply Chain** | Interactive supply chain explorer — click any company to see upstream/downstream links |
| **Sector Filter** | Filter the globe by sector with checkbox toggles (max 30 tickers) |
| **Custom Tracker** | Personal stock watchlist with favorites, prices, risk scores, and Yahoo Finance links |
| **Live Streams** | Embedded live news streams |
| **Settings** | Timezone, date format, and accent theme configuration |

### Event Analysis
- Event feed with severity indicators and affected sector/country tags
- Click any event to see the full risk report with per-company scores
- Risk panel shows stock prices alongside risk scores
- Tickers link to Yahoo Finance for deeper research

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check (SurrealDB + LangChain status) |
| `GET` | `/api/v1/stats` | Database statistics (companies, edges, events, density) |
| `GET` | `/api/v1/companies` | All S&P 500 companies (5min cache) |
| `GET` | `/api/v1/events` | Recent events with risk scores (last 50) |
| `GET` | `/api/v1/events/{id}` | Single event detail |
| `POST` | `/api/v1/events/analyze` | **Run full LangGraph pipeline** on new event |
| `GET` | `/api/v1/supply-chain` | All supply chain edges (filterable by ticker) |
| `POST` | `/api/v1/portfolio/risk` | AI portfolio risk analysis (up to 50 tickers) |
| `GET` | `/api/v1/market-data` | Live stock quotes via yfinance |
| `GET` | `/api/v1/news` | Recent news articles by ticker |
| `POST` | `/api/graph/query` | Natural language graph queries |

---

## Observability

### LangSmith Integration
Set `LANGCHAIN_API_KEY` in `.env` to enable full pipeline tracing in LangSmith. Each pipeline invocation is traced with:
- Per-node execution times
- State snapshots at each checkpoint
- AI model calls with prompts and responses

### Request Logging
- Every pipeline invocation gets an 8-character correlation ID
- Per-node timing logged (>500ms flagged)
- Request timing middleware on all HTTP endpoints

### Health & Stats
```bash
# Health check
curl http://localhost:8000/api/v1/health
# → {"status": "ok", "surrealdb": "connected", "langchain_stores": "ready"}

# Database statistics
curl http://localhost:8000/api/v1/stats
# → {"companies": 154, "supply_edges": 90, "events": 12, "risk_scores": 48, "graph_density": 0.58}
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (for SurrealDB) or a [SurrealDB Cloud](https://app.surrealdb.com/cloud) account

### 1. Clone & Configure

```bash
git clone https://github.com/YOUR_REPO/riskterrain.git
cd riskterrain
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set your API keys:
#   ANTHROPIC_API_KEY=sk-ant-...     (required)
#   GOOGLE_API_KEY=...               (required for event classification)
#   NEWSAPI_KEY=...                  (optional, enables live news)
#   LANGCHAIN_API_KEY=...            (optional, enables LangSmith tracing)
```

### 3. Start SurrealDB

**Option A: Docker (recommended)**
```bash
docker compose up -d surrealdb
# Wait for health check to pass
```

**Option B: Local binary**
```bash
surreal start --user root --pass root --bind 0.0.0.0:8000 memory
```

**Option C: SurrealDB Cloud**
```bash
# In .env, set:
SURREAL_URL=wss://YOUR_INSTANCE.surrealist.app/rpc
SURREAL_TOKEN=your_jwt_token
```

### 4. Start Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On startup, the backend will:
1. Connect to SurrealDB
2. Create schema (tables, indexes, relations)
3. Seed 154 companies + ~90 supply chain edges
4. Initialize LangChain stores (VectorStore + Graph)
5. Start background pollers (USGS + NewsAPI)

Verify: `http://localhost:8000/api/v1/health`

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

### 6. Docker Compose (Full Stack)

```bash
cd backend
docker compose up --build
# Backend: http://localhost:8001
# SurrealDB: ws://localhost:8000
```

---

## Test the Pipeline

### Submit a Manual Event

```bash
curl -X POST http://localhost:8000/api/v1/events/analyze \
  -H "Content-Type: application/json" \
  -d '{"input": "M7.4 earthquake strikes southern Taiwan near TSMC facilities", "source": "manual"}'
```

### Query the Supply Chain Graph

```bash
curl -X POST http://localhost:8000/api/graph/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Which companies depend on TSMC for chip fabrication?"}'
```

### Analyze Portfolio Risk

```bash
curl -X POST http://localhost:8000/api/v1/portfolio/risk \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "NVDA", "TSMC", "MSFT", "GOOGL"]}'
```

---

## Project Structure

```
riskterrain/
├── backend/
│   ├── main.py                    # FastAPI app + startup lifecycle
│   ├── config.py                  # Pydantic settings (.env)
│   ├── utils.py                   # AI client helpers, JSON parsing
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Container build
│   ├── docker-compose.yml         # Full stack (SurrealDB + backend)
│   ├── .env.example               # Environment template
│   │
│   ├── agents/
│   │   ├── pipeline.py            # LangGraph 6-node DAG + checkpointer
│   │   ├── state.py               # RiskState TypedDict
│   │   └── nodes/
│   │       ├── __init__.py
│   │       ├── event_intake.py    # Node 1: Event classification (Gemini)
│   │       ├── geo_resolver.py    # Node 2: Geographic mapping (Gemini)
│   │       ├── graph_traverser.py # Node 3: SurrealDB graph walk + vector search
│   │       ├── news_enricher.py   # Node 4: NewsAPI headline enrichment
│   │       ├── risk_scorer.py     # Node 5: AI risk scoring (Gemini)
│   │       └── report_generator.py# Node 6: SurrealDB persistence
│   │
│   ├── db/
│   │   ├── surreal.py             # Connection manager + schema DDL
│   │   ├── seed.py                # 154 companies + 90 supply chain edges
│   │   └── langchain_stores.py    # VectorStore + GraphStore + GraphQAChain
│   │
│   ├── ingest/
│   │   ├── usgs.py                # USGS earthquake poller (60s)
│   │   └── newsapi.py             # NewsAPI scanner (15min) + deduplication
│   │
│   └── routes/
│       ├── companies.py           # GET /api/v1/companies
│       ├── events.py              # GET/POST events + graph QA
│       ├── supply_chain.py        # GET /api/v1/supply-chain
│       ├── portfolio.py           # POST /api/v1/portfolio/risk
│       ├── market.py              # GET /api/v1/market-data
│       └── news.py                # GET /api/v1/news
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                # Router (Landing → Dashboard)
│       ├── pages/
│       │   ├── Landing.tsx        # Scroll-driven landing page
│       │   └── Dashboard.tsx      # Dashboard wrapper
│       ├── components/
│       │   ├── Globe3D.tsx        # 3D globe with POIs, arcs, rings, labels
│       │   └── dashboard/
│       │       ├── RiskTerrain.jsx # Main dashboard orchestrator
│       │       ├── SupplyChainPanel.tsx # Supply chain explorer
│       │       └── widgets/
│       │           ├── MarketTicker.jsx  # Live stock prices
│       │           ├── PortfolioRisk.jsx # AI portfolio analysis
│       │           ├── NewsFeed.jsx      # Breaking news
│       │           ├── LiveStreams.jsx    # Live video streams
│       │           ├── SectorFilter.jsx  # Sector/ticker toggles
│       │           ├── CustomTracker.jsx # Personal watchlist
│       │           └── Settings.jsx      # Timezone/date/theme
│       └── data/
│           └── mockData.ts        # Types, sample data, utilities
│
└── README.md
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SURREAL_URL` | Yes | SurrealDB connection (`ws://localhost:8000/rpc`) |
| `SURREAL_NAMESPACE` | Yes | SurrealDB namespace (`riskterrain`) |
| `SURREAL_DATABASE` | Yes | SurrealDB database (`main`) |
| `SURREAL_USER` | Yes | SurrealDB username (`root`) |
| `SURREAL_PASS` | Yes | SurrealDB password |
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `GOOGLE_API_KEY` | Yes | Gemini Flash API key |
| `NEWSAPI_KEY` | No | NewsAPI key (enables live news feed) |
| `LANGCHAIN_API_KEY` | No | LangSmith key (enables pipeline tracing) |
| `LANGCHAIN_TRACING_V2` | No | Enable LangSmith tracing (`true`) |
| `LANGCHAIN_PROJECT` | No | LangSmith project name (`riskterrain`) |

---

## Hackathon Judging Criteria Alignment

### Structured Memory / Knowledge Usage — SurrealDB (30%)
- **Knowledge graph**: 154 company nodes + ~90 weighted supply chain edges stored as SurrealDB `RELATE` relations
- **Multi-hop traversal**: 5-phase graph walk (direct geographic → 1-hop downstream → 1-hop upstream → 2-hop cascade → sector correlation)
- **Evolving context**: Every pipeline run persists new events, risk scores, and vector embeddings back to SurrealDB
- **Vector search**: Historical event similarity via `langchain-surrealdb` VectorStore — new events are compared against past events for precedent
- **Graph QA**: Natural language queries over the supply chain graph via `langchain-surrealdb` GraphQAChain

### Agent Workflow Quality — LangGraph (20%)
- **6-node StateGraph DAG**: event_intake → geo_resolver → graph_traverser → news_enricher → risk_scorer → report_generator
- **Typed state**: `RiskState` TypedDict with typed fields for each node's input/output
- **Clear orchestration**: Each node has a single responsibility with well-defined state contracts
- **Timed execution**: Every node is wrapped with timing decorators and correlation IDs

### Persistent Agent State (20%)
- **MemorySaver checkpointer**: State persisted at each node boundary with unique thread IDs
- **SurrealDB persistence**: Events, risk scores, and embeddings written to database by report_generator
- **Evolving knowledge**: Each processed event enriches the vector store and risk score history
- **Background pollers**: Stateful event tracking with bounded LRU caches (500 USGS events, 1000 news titles)

### Practical Use Case (20%)
- **Real problem**: Supply chain risk is a multi-trillion dollar concern — companies need to understand cascading exposure to geopolitical events
- **Live data**: Actual USGS earthquake data and real NewsAPI headlines (not simulated)
- **Actionable output**: Per-company risk scores with natural language reasoning, portfolio-level analysis, and market data integration
- **Interactive exploration**: 3D globe visualization, supply chain graph explorer, custom stock watchlists

### Observability (10%)
- **LangSmith**: Full pipeline tracing with per-node state snapshots (set `LANGCHAIN_API_KEY`)
- **Structured logging**: Correlation IDs, per-node timing, request-level metrics
- **Health endpoints**: `/api/v1/health` and `/api/v1/stats` for system status
- **Request middleware**: HTTP request timing with >500ms alerting

---

## Team

Built at the London Hackathon 2025 — LangChain x SurrealDB.

---

## License

MIT
