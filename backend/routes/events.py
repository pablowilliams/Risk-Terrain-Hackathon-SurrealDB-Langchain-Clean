"""
Events + Graph QA Routes — Fix #36 #37 #38 #86 #87 #88 #89 #90 #94
"""

import re
import time
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from db.surreal import get_db
from agents.pipeline import run_pipeline
from utils import sanitise_input

logger = logging.getLogger("riskterrain.routes.events")

router = APIRouter(prefix="/api/v1")  # Fix #86

# Fix #87: simple in-memory rate limit for analyze endpoint
_analyze_timestamps: list[float] = []
MAX_ANALYZE_PER_MINUTE = 10


# ── Request/Response Models — Fix #89 ─────────────────────────────────────

class AnalyzeRequest(BaseModel):
    input: str = Field(..., min_length=5, max_length=2000)  # Fix #88
    source: str = Field(default="manual", max_length=50)


class GraphQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)


class EventResponse(BaseModel):  # Fix #89
    id: str
    type: str
    title: str
    description: str
    severity: int
    source: str
    affected_countries: list[str]
    affected_sectors: list[str]
    lat: float
    lng: float
    created_at: str
    risks: dict


class GraphQueryResponse(BaseModel):  # Fix #89 #90
    question: str
    answer: str
    engine: str
    note: Optional[str] = None  # Fix #90: excluded when None via response_model_exclude_none


# ── Event Endpoints ───────────────────────────────────────────────────────

@router.get("/events", response_model=list[EventResponse], tags=["events"])
def get_events():
    db = get_db()
    rows = _extract(db.query("SELECT * FROM event ORDER BY created_at DESC LIMIT 50"))
    return [_clean(e) for e in rows if isinstance(e, dict) and e.get("title")]


@router.get("/events/{event_id}", response_model=EventResponse, tags=["events"])
def get_event(event_id: str):
    # Fix #36: validate ID format to prevent SurrealQL injection
    if not re.match(r"^[a-zA-Z0-9_:⟨⟩-]+$", event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID format")
    db = get_db()
    if not event_id.startswith("event:"):
        event_id = f"event:{event_id}"
    # Fix #36: use parameterised query
    rows = _extract(db.query("SELECT * FROM type::thing($table, $id)", {
        "table": "event", "id": event_id.split(":", 1)[1] if ":" in event_id else event_id
    }))
    if not rows:
        # Fallback: direct (safe since we validated format)
        rows = _extract(db.query(f"SELECT * FROM {event_id}"))
    if not rows:
        raise HTTPException(status_code=404, detail="Event not found")
    return _clean(rows[0])


@router.post("/events/analyze", response_model=EventResponse, tags=["events"])
def analyze_event(request: AnalyzeRequest):
    """Run the full 6-node LangGraph pipeline. 3-8 seconds."""
    # Fix #87: rate limit
    now = time.time()
    _analyze_timestamps[:] = [t for t in _analyze_timestamps if now - t < 60]
    if len(_analyze_timestamps) >= MAX_ANALYZE_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Rate limit: max 10 analyses per minute")
    _analyze_timestamps.append(now)

    # Fix #88: sanitise
    clean_input = sanitise_input(request.input)
    return run_pipeline(raw_input=clean_input, source=request.source)


# ── Graph QA Endpoint — Fix #94: separate tag ────────────────────────────

@router.post("/graph/query", response_model=GraphQueryResponse,
             response_model_exclude_none=True, tags=["graph"])  # Fix #90 #94
def graph_query(request: GraphQueryRequest):
    """SurrealDBGraphQAChain: natural-language supply chain queries."""
    from db.langchain_stores import create_graph_qa_chain

    chain = create_graph_qa_chain()
    if chain is None:
        return _fallback_graph_query(request.question)

    try:
        result = chain.invoke(request.question.strip())
        return GraphQueryResponse(
            question=request.question,
            answer=result if isinstance(result, str) else str(result),
            engine="SurrealDBGraphQAChain",
        )
    except Exception as e:
        return _fallback_graph_query(request.question, error=str(e))


def _fallback_graph_query(question: str, error: str = None) -> GraphQueryResponse:
    """Fix #37 #38: reduced limit, use system prompt."""
    from utils import call_claude
    db = get_db()

    try:
        # Fix #37: LIMIT matches usage
        rows = _extract(db.query(
            "SELECT ticker, name, ->supplies->company.ticker AS to, "
            "<-supplies<-company.ticker AS from FROM company LIMIT 20"
        ))
        ctx = "\n".join(
            f"{r.get('ticker','?')}: supplies={r.get('to',[])}, supplied_by={r.get('from',[])}"
            for r in rows[:20] if isinstance(r, dict)
        )
    except Exception:
        ctx = "Graph query unavailable"

    # Fix #38: use system prompt via call_claude
    answer = call_claude(
        system="You answer questions about a supply chain knowledge graph stored in SurrealDB. "
               "Use only the graph data provided to answer.",
        user_content=f"Graph data:\n{ctx}\n\nQuestion: {question}",
        max_tokens=500,
    )

    return GraphQueryResponse(
        question=question, answer=answer,
        engine="fallback_claude_with_graph_context",
        note=f"GraphQAChain unavailable: {error}" if error else None,
    )


def _extract(result) -> list[dict]:
    if not isinstance(result, list):
        return []
    rows = []
    for item in result:
        if isinstance(item, dict):
            if "result" in item and isinstance(item["result"], list):
                rows.extend(r for r in item["result"] if isinstance(r, dict))
            elif "title" in item or "ticker" in item:
                rows.append(item)
    return rows


def _clean(evt: dict) -> dict:
    return {
        "id": str(evt.get("id", "")),
        "type": evt.get("type", "geopolitical"),
        "title": evt.get("title", ""),
        "description": evt.get("description", ""),
        "severity": evt.get("severity", 3),
        "source": evt.get("source", "unknown"),
        "affected_countries": evt.get("affected_countries", []),
        "affected_sectors": evt.get("affected_sectors", []),
        "lat": evt.get("lat", 0),
        "lng": evt.get("lng", 0),
        "created_at": str(evt.get("created_at", "")),
        "risks": evt.get("risks", {}),
    }
