"""
Node 6: report_generator -- Fix #16 #43
3 writes: document + risk_scores + vector embedding.
"""

import logging
from datetime import datetime, timezone
from db.surreal import get_db
from db.langchain_stores import add_event_to_vector_store
from agents.state import RiskState

logger = logging.getLogger("riskterrain.node.report_generator")


def report_generator(state: RiskState) -> dict:
    db = get_db()
    now_dt = datetime.now(timezone.utc)
    # ISO string for frontend responses
    now_z = now_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    risks = state.get("risks", {})

    # SurrealDB SDK needs Python datetime objects (not ISO strings)
    event_data = {
        "type": state.get("event_type", "geopolitical"),
        "title": state.get("title", "Unknown Event"),
        "description": state.get("description", ""),
        "severity": int(state.get("severity", 3)),
        "source": state.get("source", "manual"),
        "affected_countries": state.get("affected_countries", []),
        "affected_sectors": state.get("affected_sectors", []),
        "lat": float(state.get("event_lat", 0.0)),
        "lng": float(state.get("event_lng", 0.0)),
        "created_at": now_dt,
        "risks": risks,
    }

    # WRITE 1: Event document
    event_id = "event:unknown"
    try:
        result = db.create("event", event_data)
        # SDK may return error as string instead of raising exception
        if isinstance(result, str) and ("Couldn't" in result or "error" in result.lower()):
            raise RuntimeError(result)
        event_id = _extract_id(result, "event:unknown")
        logger.info(f"Write 1: event -> {event_id}")
    except Exception as e:
        logger.error(f"Write 1 failed: {e}")
        # Fallback: use raw SurrealQL which handles datetime casting
        import uuid
        fallback_id = uuid.uuid4().hex[:10]
        try:
            db.query(f"CREATE event:{fallback_id} CONTENT $data", {"data": event_data})
            event_id = f"event:{fallback_id}"
            logger.info(f"Write 1 (fallback): event -> {event_id}")
        except Exception as e2:
            logger.error(f"Write 1 fallback also failed: {e2}")

    # WRITE 2: Individual risk_score records
    count = 0
    for ticker, risk in risks.items():
        try:
            result = db.create("risk_score", {
                "event_id": event_id,
                "ticker": ticker,
                "score": float(risk.get("score", 0)),
                "reasoning": risk.get("reasoning", ""),
                "created_at": now_dt,
            })
            if isinstance(result, str) and "Couldn't" in result:
                raise RuntimeError(result)
            count += 1
        except Exception as e:
            logger.debug(f"Write 2 {ticker}: {e}")
    logger.info(f"Write 2: {count} risk_scores")

    # WRITE 3: Vector embedding (SurrealDBVectorStore)
    try:
        add_event_to_vector_store(
            event_id=event_id,
            title=event_data["title"],
            description=event_data["description"],
            severity=event_data["severity"],
            risks=risks,
            metadata={
                "countries": ",".join(event_data["affected_countries"]),
                "sectors": ",".join(event_data["affected_sectors"]),
            },
        )
        logger.info("Write 3: vector embedding stored")
    except Exception as e:
        logger.warning(f"Write 3 (non-blocking): {e}")

    demo_event = {
        "id": event_id,
        "type": event_data["type"],
        "title": event_data["title"],
        "description": event_data["description"],
        "severity": event_data["severity"],
        "source": event_data["source"],
        "affected_countries": event_data["affected_countries"],
        "affected_sectors": event_data["affected_sectors"],
        "lat": event_data["lat"],
        "lng": event_data["lng"],
        "created_at": now_z,
        "risks": risks,
        # Extra context (doesn't break frontend -- these fields are additive)
        "supply_chain_paths": state.get("supply_chain_paths", [])[:10],
        "news_context": state.get("news_context", [])[:5],
        "news_articles": state.get("news_articles", [])[:8],
        "exposed_company_count": len(state.get("exposed_companies", [])),
        "similar_events_used": len(state.get("similar_historical_events", [])),
    }

    logger.info(f"report_generator DONE: {event_id}, {len(risks)} scores, 3 writes")
    return {"event_id": event_id, "created_at": now_z, "final_output": demo_event}


def _extract_id(result, default: str = "event:unknown") -> str:
    """Extract event ID from SurrealDB create response (handles multiple SDK formats)."""
    extracted = result
    # Unwrap list
    if isinstance(extracted, list):
        if not extracted:
            return default
        extracted = extracted[0]
    # Unwrap {"result": [...]} wrapper
    if isinstance(extracted, dict) and "result" in extracted:
        inner = extracted["result"]
        if isinstance(inner, list) and inner:
            extracted = inner[0]
        elif isinstance(inner, dict):
            extracted = inner
    # Extract id field
    if isinstance(extracted, dict) and "id" in extracted:
        return str(extracted["id"])
    # Handle RecordID objects (some SDK versions return objects instead of strings)
    if hasattr(extracted, "id"):
        return str(extracted.id)
    # Last resort: stringify the whole result
    s = str(result)
    if "event:" in s:
        import re
        match = re.search(r"event:[a-zA-Z0-9_]+", s)
        if match:
            return match.group(0)
    return default
