from __future__ import annotations
"""
Node 3: graph_traverser -- Fix #10 #11 #21 #22 #47
HACKATHON (2) + (3): Knowledge graph walk + SurrealDBVectorStore hybrid retrieval.
"""

import logging
from db.surreal import get_db
from db.langchain_stores import search_similar_events
from utils import safe_surreal_id
from agents.state import RiskState

logger = logging.getLogger("riskterrain.node.graph_traverser")


def graph_traverser(state: RiskState) -> dict:
    countries = state.get("affected_countries", [])
    sectors = state.get("affected_sectors", [])
    description = state.get("description", "")
    title = state.get("title", "")

    db = get_db()
    exposed: dict[str, dict] = {}
    paths: list[str] = []

    # ===================================================================
    # PHASE 1: SURREALDB KNOWLEDGE GRAPH
    # ===================================================================

    # Step A: Direct geographic exposure
    direct_ids = []
    if countries:
        rows = _q(db, "SELECT ticker, name, sector, country FROM company WHERE country IN $c", {"c": countries})
        for c in rows:
            t = c.get("ticker", "")
            if not t:
                continue
            sid = safe_surreal_id(t)
            direct_ids.append(sid)
            p = f"DIRECT: {t} ({c.get('name','')}) HQ in {c.get('country','')}"
            exposed[t] = {"ticker": t, "name": c.get("name",""), "sector": c.get("sector",""),
                          "exposure_type": "direct_geographic", "max_weight": 1.0, "paths": [p]}
            paths.append(p)
        logger.info(f"Step A: {len(direct_ids)} direct geographic")

    # Step B: 1-hop DOWNSTREAM -- who depends on affected companies?
    # Fix #10 #11: parameterised queries on supplies table, extract ticker from record link
    for sid in direct_ids[:20]:
        rows = _q(db, f"SELECT * FROM supplies WHERE in = company:{sid}")
        for edge in rows:
            to_t = _ticker_from_record(edge.get("out", ""))
            rel = edge.get("relationship", "supplies")
            w = _safe_float(edge.get("weight", 0.5))
            desc = edge.get("description", "")
            if not to_t or to_t == sid:
                continue

            p = f"{sid} ->[{rel}, w={w:.2f}]-> {to_t}: {desc}"
            paths.append(p)
            # Fix #22: upgrade weight if already exists with lower weight
            _upsert_exposed(exposed, to_t, "supply_chain_1hop", w, p)

    # Step C: 1-hop UPSTREAM -- who supplies the affected companies?
    for sid in direct_ids[:20]:
        rows = _q(db, f"SELECT * FROM supplies WHERE out = company:{sid}")
        for edge in rows:
            from_t = _ticker_from_record(edge.get("in", ""))
            rel = edge.get("relationship", "supplies")
            w = _safe_float(edge.get("weight", 0.5))
            desc = edge.get("description", "")
            if not from_t or from_t == sid:
                continue

            p = f"{from_t} ->[{rel}, w={w:.2f}]-> {sid} (UPSTREAM): {desc}"
            paths.append(p)
            _upsert_exposed(exposed, from_t, "supply_chain_upstream", w * 0.7, p)

    # Step D: 2-hop DOWNSTREAM -- second-order effects
    first_hop = [t for t, v in exposed.items() if v.get("exposure_type") == "supply_chain_1hop"]
    for ft in first_hop[:15]:
        ft_id = safe_surreal_id(ft)
        parent_w = exposed[ft]["max_weight"]
        rows = _q(db, f"SELECT * FROM supplies WHERE in = company:{ft_id}")
        for edge in rows:
            to_t = _ticker_from_record(edge.get("out", ""))
            if not to_t or to_t in [safe_surreal_id(d) for d in direct_ids] or to_t == ft_id:
                continue
            w2 = _safe_float(edge.get("weight", 0.3))
            rel = edge.get("relationship", "supplies")
            eff = round(parent_w * w2, 3)

            p = f"2-HOP: ...-> {ft} ->[{rel}, w={w2:.2f}]-> {to_t} (eff={eff:.3f})"
            paths.append(p)
            _upsert_exposed(exposed, to_t, "supply_chain_2hop", eff, p)

    # Step E: Sector correlation -- Fix #21: cap at 10 to avoid drowning real signals
    if sectors:
        rows = _q(db, "SELECT ticker, name, sector FROM company WHERE sector IN $s AND country = 'USA' ORDER BY mc DESC LIMIT 10", {"s": sectors})
        for c in rows:
            t = c.get("ticker", "")
            if t and t not in exposed:
                exposed[t] = {"ticker": t, "name": c.get("name",""), "sector": c.get("sector",""),
                              "exposure_type": "sector_correlation", "max_weight": 0.20,
                              "paths": [f"SECTOR: {t} in {c.get('sector','')}"]}

    graph_count = len(exposed)
    logger.info(f"Phase 1: {graph_count} companies, {len(paths)} paths")

    # -- Enrich: populate names for graph-found companies --
    nameless = [t for t, v in exposed.items() if not v.get("name")]
    if nameless:
        for ticker in nameless[:30]:
            sid = safe_surreal_id(ticker)
            rows = _q(db, f"SELECT name, sector FROM company:{sid}")
            if rows and rows[0].get("name"):
                exposed[ticker]["name"] = rows[0]["name"]
                exposed[ticker]["sector"] = rows[0].get("sector", "")
        logger.info(f"Enriched {len(nameless)} company names")

    # ===================================================================
    # PHASE 2: VECTOR RETRIEVAL via SurrealDBVectorStore
    # ===================================================================
    similar_events = search_similar_events(query=f"{title}. {description}", k=5)

    if not similar_events:
        rows = _q(db, "SELECT title, severity, risks, created_at FROM event ORDER BY created_at DESC LIMIT 5")
        for evt in rows:
            if evt.get("title"):
                similar_events.append({
                    "title": evt["title"], "severity": evt.get("severity", 0),
                    "risk_count": len(evt.get("risks", {})),
                    "similarity_score": 0.0, "content_preview": f"Recent: {evt['title']}",
                })

    logger.info(f"Phase 2: {len(similar_events)} similar events")

    sorted_exp = sorted(exposed.values(), key=lambda x: x.get("max_weight", 0), reverse=True)[:25]
    return {
        "exposed_companies": sorted_exp,
        "supply_chain_paths": paths[:50],
        "similar_historical_events": similar_events[:5],
    }


# -- HELPERS --

def _upsert_exposed(exposed: dict, ticker: str, exp_type: str, weight: float, path: str):
    """Fix #22: insert or upgrade if new weight is higher."""
    if ticker in exposed:
        if weight > exposed[ticker].get("max_weight", 0):
            exposed[ticker]["max_weight"] = weight
            exposed[ticker]["exposure_type"] = exp_type
        exposed[ticker]["paths"].append(path)
    else:
        exposed[ticker] = {"ticker": ticker, "name": "", "sector": "",
                           "exposure_type": exp_type, "max_weight": weight, "paths": [path]}


def _q(db, surql: str, params: dict | None = None) -> list[dict]:
    """Robust row extraction -- handles both embedded (flat) and server (wrapped) formats."""
    try:
        result = db.query(surql, params) if params else db.query(surql)
    except Exception as e:
        logger.debug(f"Query failed: {surql[:80]}... -> {e}")
        return []
    if not isinstance(result, list):
        return [result] if isinstance(result, dict) else []
    rows = []
    for item in result:
        if isinstance(item, dict):
            # Server format: {"result": [...], "status": "OK"}
            if "result" in item and isinstance(item["result"], list):
                rows.extend(r for r in item["result"] if isinstance(r, dict))
            # Embedded format: flat dicts with data fields directly
            elif any(k in item for k in ("ticker", "in", "out", "weight", "title",
                                          "in", "out", "relationship", "country", "count")):
                rows.append(item)
    return rows if rows else [r for r in result if isinstance(r, dict)]


def _ticker_from_record(value) -> str:
    """Extract ticker from SurrealDB RecordID objects, strings, or dicts."""
    # Handle RecordID objects (surrealdb.data.types.record_id.RecordID)
    if hasattr(value, 'id') and not isinstance(value, dict):
        return str(value.id)
    if hasattr(value, 'record_id'):
        return str(value.record_id)
    if isinstance(value, str):
        return value.split(":")[-1] if ":" in value else value
    if isinstance(value, dict):
        tid = value.get("ticker") or value.get("id", "")
        return str(tid).split(":")[-1] if ":" in str(tid) else str(tid)
    # Last resort: str(RecordID) gives "table:id"
    s = str(value)
    return s.split(":")[-1] if ":" in s else ""


def _safe_float(val, default: float = 0.5) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return default
