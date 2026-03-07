from __future__ import annotations
"""
Supply Chain Routes -- GET /api/v1/supply-chain
Returns supply chain edges from SurrealDB's supplies relation table.
"""

import time
import logging
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from db.surreal import get_db
from utils import safe_surreal_id

logger = logging.getLogger("riskterrain.routes.supply_chain")

router = APIRouter(prefix="/api/v1", tags=["supply-chain"])

_cache: list[dict] | None = None
_cache_time: float = 0
CACHE_TTL = 300


class SupplyChainEdge(BaseModel):
    from_ticker: str
    to_ticker: str
    relationship: str
    weight: float
    description: str


@router.get("/supply-chain", response_model=list[SupplyChainEdge])
def get_supply_chain(
    ticker: Optional[str] = Query(None, max_length=10),
):
    if ticker is None:
        global _cache, _cache_time
        if _cache is not None and (time.time() - _cache_time) < CACHE_TTL:
            return _cache

    db = get_db()

    if ticker:
        safe_t = safe_surreal_id(ticker.upper())
        edges = _get_filtered_edges(db, safe_t)
    else:
        edges = _get_all_edges(db)

    cleaned = _clean_edges(edges)

    if ticker is None:
        _cache = cleaned
        _cache_time = time.time()

    return cleaned


def _get_all_edges(db) -> list[dict]:
    rows = _q(db,
        "SELECT in.ticker AS from_ticker, out.ticker AS to_ticker, "
        "relationship, weight, description FROM supplies"
    )
    return rows


def _get_filtered_edges(db, safe_ticker: str) -> list[dict]:
    rows = _q(db,
        "SELECT in.ticker AS from_ticker, out.ticker AS to_ticker, "
        "relationship, weight, description FROM supplies "
        f"WHERE in = company:{safe_ticker} OR out = company:{safe_ticker}"
    )
    return rows


def _clean_edges(rows: list[dict]) -> list[dict]:
    seen = set()
    cleaned = []
    for r in rows:
        ft = _extract_ticker(r.get("from_ticker", ""))
        tt = _extract_ticker(r.get("to_ticker", ""))
        if not ft or not tt:
            continue
        key = f"{ft}->{tt}"
        if key in seen:
            continue
        seen.add(key)
        cleaned.append({
            "from_ticker": ft,
            "to_ticker": tt,
            "relationship": r.get("relationship", "supplies"),
            "weight": float(r.get("weight", 0.5)),
            "description": r.get("description", ""),
        })
    return cleaned


def _extract_ticker(value) -> str:
    """Extract ticker string from various SurrealDB response formats."""
    if isinstance(value, str):
        # Handle "company:AAPL" format
        if ":" in value:
            return value.split(":")[-1]
        return value
    if isinstance(value, dict):
        return str(value.get("ticker", ""))
    if hasattr(value, "id"):
        return str(value.id).split(":")[-1]
    return str(value) if value else ""


def _q(db, surql: str) -> list[dict]:
    try:
        result = db.query(surql)
    except Exception as e:
        logger.debug(f"Query failed: {surql[:80]}... -> {e}")
        return []
    if not isinstance(result, list):
        return [result] if isinstance(result, dict) else []
    rows = []
    for item in result:
        if isinstance(item, dict):
            if "result" in item and isinstance(item["result"], list):
                rows.extend(r for r in item["result"] if isinstance(r, dict))
            elif "from_ticker" in item or "relationship" in item:
                rows.append(item)
    return rows if rows else [r for r in result if isinstance(r, dict)]
