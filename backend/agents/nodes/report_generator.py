"""
Node 6: report_generator — Fix #16 #43
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
    # Fix #16: ISO 8601 with Z suffix matching frontend expectation
    now_dt = datetime.now(timezone.utc)
    now_z = now_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    risks = state.get("risks", {})

    event_data = {
        "type": state.get("event_type", "geopolitical"),
        "title": state.get("title", "Unknown Event"),
        "description": state.get("description", ""),
        "severity": state.get("severity", 3),
        "source": state.get("source", "manual"),
        "affected_countries": state.get("affected_countries", []),
        "affected_sectors": state.get("affected_sectors", []),
        "lat": state.get("event_lat", 0.0),
        "lng": state.get("event_lng", 0.0),
        # Fix #43: pass ISO string — SurrealDB auto-casts to datetime
        "created_at": now_z,
        "risks": risks,
    }

    # WRITE 1: Event document
    event_id = "event:unknown"
    try:
        result = db.create("event", event_data)
        if isinstance(result, list) and result:
            event_id = str(result[0].get("id", event_id))
        elif isinstance(result, dict):
            event_id = str(result.get("id", event_id))
        logger.info(f"Write 1: event → {event_id}")
    except Exception as e:
        logger.error(f"Write 1 failed: {e}")

    # WRITE 2: Individual risk_score records
    count = 0
    for ticker, risk in risks.items():
        try:
            db.create("risk_score", {
                "event_id": event_id,
                "ticker": ticker,
                "score": risk.get("score", 0),
                "reasoning": risk.get("reasoning", ""),
                "created_at": now_z,
            })
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
        # Extra context (doesn't break frontend — these fields are additive)
        "supply_chain_paths": state.get("supply_chain_paths", [])[:10],
        "news_context": state.get("news_context", [])[:5],
        "exposed_company_count": len(state.get("exposed_companies", [])),
        "similar_events_used": len(state.get("similar_historical_events", [])),
    }

    logger.info(f"report_generator DONE: {event_id}, {len(risks)} scores, 3 writes")
    return {"event_id": event_id, "created_at": now_z, "final_output": demo_event}
