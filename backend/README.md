# RiskTerrain Backend

**LONDON Hackathon: Agents & Knowledge Graphs (LangChain × SurrealDB)** — 6–8 March 2026

## Quick Start

```bash
# Docker (one command)
cp .env.example .env && vim .env   # add ANTHROPIC_API_KEY
docker compose up --build

# Manual
surreal start --user root --pass root
pip install -r requirements.txt
cp .env.example .env && vim .env
python main.py
```

## Verify Before Demo

```bash
python test_pipeline.py                  # 7 E2E tests
python test_pipeline.py http://host:port # custom URL
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health + langchain store status |
| GET | `/api/v1/companies` | 154 companies from SurrealDB |
| GET | `/api/v1/events` | Latest 50 processed events |
| POST | `/api/v1/events/analyze` | Full 6-node pipeline (3-8s) |
| POST | `/api/v1/graph/query` | SurrealDBGraphQAChain NL queries |

## langchain-surrealdb Integration

| Component | Used In | Purpose |
|-----------|---------|---------|
| SurrealDBVectorStore | graph_traverser (read), report_generator (write) | Event similarity search + embedding persistence |
| SurrealDBGraph | seed.py (write) | Knowledge graph for supply chain |
| SurrealDBGraphQAChain | POST /api/v1/graph/query | Natural-language graph queries |

Central hub: `db/langchain_stores.py` — all three on a shared SurrealDB connection.

## Pipeline

```
POST /api/v1/events/analyze
  |
  v
event_intake --> geo_resolver --> graph_traverser --> risk_scorer --> news_enricher --> report_generator
(Claude)        (Claude)         (SurrealDB graph   (Claude +       (NewsAPI        (3 writes:
                                 + VectorStore)     hybrid ctx)     LIVE)           doc + scores
                                                                                    + vector)
```

## Hackathon Criteria

- [x] 1. Agent workflows built with LangChain (LangGraph 6-node StateGraph)
- [x] 2. Knowledge graph context (~90 RELATE edges + SurrealDBGraph)
- [x] 3. Hybrid retrieval: vector + graph (SurrealDBVectorStore + SurrealQL)
- [x] 4. Persistent evolving context (3 writes/event, vector embeddings accumulate)
- [x] 5. Production-oriented (live USGS + NewsAPI, rate limiting, Swagger docs)
- [x] SurrealDB unified: relational + graph + document + vector + temporal
- [x] langchain-surrealdb: all 3 components used
