---
name: api-design
description: Use when designing FastAPI endpoints, reviewing API contracts, or ensuring responses match frontend data shapes.
---

# API Design — RiskTerrain

## Endpoints

```
GET  /api/companies          → Company[]
GET  /api/events             → DemoEvent[] (latest 50, DESC by created_at)
GET  /api/events/{id}        → DemoEvent
POST /api/events/analyze     → DemoEvent (runs LangGraph pipeline)
GET  /api/health             → {"status": "ok", "surreal": "connected"}
```

## Request/Response Contracts

### POST /api/events/analyze
```json
// Request
{"input": "M7.4 earthquake strikes Taiwan. TSMC pauses operations.", "source": "USGS"}

// Response (MUST match DemoEvent interface exactly)
{
  "id": "evt_001",
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
    "NVDA": {"score": 0.94, "reasoning": "90% of supply chain via TSMC Taiwan fabs"}
  }
}
```

## Field Constraints

| Field | Type | Constraint |
|-------|------|------------|
| type | string | Exactly: "natural_disaster" \| "geopolitical" \| "macro" |
| severity | int | 1-5 |
| score | float | 0.0-1.0 |
| mc | int | Billions USD (3100 = $3.1T) |
| created_at | string | ISO 8601 parseable by `new Date()` |
| risks keys | string | Must match ticker strings in company list |
| affected_countries | string[] | Never null, empty array if none |
| affected_sectors | string[] | Never null, empty array if none |

## FastAPI Patterns

```python
from pydantic import BaseModel, Field
from typing import Literal

class AnalyzeRequest(BaseModel):
    input: str = Field(..., min_length=10)
    source: str = "manual"

class RiskEntry(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    reasoning: str

class DemoEvent(BaseModel):
    id: str
    type: Literal["natural_disaster", "geopolitical", "macro"]
    title: str
    description: str
    severity: int = Field(..., ge=1, le=5)
    source: str
    affected_countries: list[str]
    affected_sectors: list[str]
    lat: float
    lng: float
    created_at: str
    risks: dict[str, RiskEntry]
```

## Error Responses

```json
{"error": {"code": "validation_error", "message": "Input too short", "status": 422}}
{"error": {"code": "pipeline_error", "message": "Claude API unavailable", "status": 503}}
```

## CORS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://daththeanalyst.github.io"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```
