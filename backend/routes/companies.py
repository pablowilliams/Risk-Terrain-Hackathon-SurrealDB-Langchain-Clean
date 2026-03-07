from __future__ import annotations
"""
Companies API -- Fix #34 #35
"""

import time
from fastapi import APIRouter
from db.surreal import get_db

router = APIRouter(prefix="/api/v1", tags=["companies"])  # Fix #86: versioned

_cache: list[dict] | None = None
_cache_time: float = 0
CACHE_TTL = 300  # Fix #34: 5 min TTL


@router.get("/companies")
def get_companies():
    """Return all companies from SurrealDB (cached 5 min). Fix #35: no hardcoded count."""
    global _cache, _cache_time
    if _cache is not None and (time.time() - _cache_time) < CACHE_TTL:
        return _cache

    db = get_db()
    result = db.query("SELECT ticker, name, sector, lat, lng, mc, country FROM company ORDER BY mc DESC")

    companies = []
    if isinstance(result, list):
        for item in result:
            if isinstance(item, dict):
                if "result" in item and isinstance(item["result"], list):
                    companies = item["result"]
                    break
                elif "ticker" in item:
                    companies.append(item)
        if not companies:
            companies = result

    cleaned = []
    for c in companies:
        if isinstance(c, dict) and c.get("ticker"):
            cleaned.append({
                "ticker": c["ticker"], "name": c.get("name", ""),
                "sector": c.get("sector", ""), "lat": c.get("lat", 0),
                "lng": c.get("lng", 0), "mc": c.get("mc", 0),
            })

    _cache = cleaned
    _cache_time = time.time()
    return cleaned
