from __future__ import annotations
"""
Portfolio Risk Analysis -- AI-powered portfolio risk scoring via Claude.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from db.surreal import get_db
from utils import call_gemini, parse_claude_json, safe_surreal_id

logger = logging.getLogger("riskterrain.routes.portfolio")

router = APIRouter(prefix="/api/v1", tags=["portfolio"])


class PortfolioRiskRequest(BaseModel):
    tickers: list[str] = Field(..., min_length=1, max_length=50)
    event_ids: Optional[list[str]] = Field(default=None)


class PortfolioRiskResponse(BaseModel):
    portfolio_score: float
    risk_level: str
    reasoning: str
    sector_breakdown: dict
    top_risks: list[dict]
    supply_chain_vulnerabilities: list[str]


PORTFOLIO_PROMPT = """You are a senior portfolio risk analyst. Analyze a portfolio of S&P 500 stocks for concentration risk, supply chain vulnerabilities, and event exposure.

Respond ONLY with valid JSON:
{
  "portfolio_score": 0.XX,
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "reasoning": "2-3 sentences explaining overall portfolio risk",
  "sector_breakdown": {"SectorName": {"score": 0.XX, "tickers": ["T1"]}},
  "top_risks": [{"ticker": "T", "score": 0.XX, "reasoning": "One sentence"}],
  "supply_chain_vulnerabilities": ["Description of vulnerability"]
}

RULES:
- portfolio_score: 0.0-1.0 (weighted by concentration + supply chain + events)
- risk_level: LOW (<0.3), MEDIUM (0.3-0.6), HIGH (0.6-0.8), CRITICAL (>0.8)
- top_risks: max 5
- supply_chain_vulnerabilities: max 5"""


@router.post("/portfolio/risk", response_model=PortfolioRiskResponse)
def portfolio_risk(request: PortfolioRiskRequest) -> dict:
    """Analyze portfolio-level risk across holdings using supply chain graph and AI scoring."""
    db = get_db()
    tickers = [t.upper().strip() for t in request.tickers]

    # 1. Fetch companies from SurrealDB
    companies = []
    for t in tickers:
        rows = _q(db, f"SELECT ticker, name, sector, mc FROM company WHERE ticker = '{safe_surreal_id(t)}'")
        companies.extend(rows)

    if not companies:
        raise HTTPException(status_code=400, detail="No valid tickers found")

    # 2. Fetch supply chain edges touching any portfolio ticker
    edges = []
    for t in tickers:
        sid = safe_surreal_id(t)
        rows = _q(
            db,
            "SELECT in.ticker AS from_ticker, out.ticker AS to_ticker, "
            f"relationship, weight, description FROM supplies "
            f"WHERE in = company:{sid} OR out = company:{sid}",
        )
        edges.extend(rows)

    ticker_set = set(tickers)
    internal: list[dict] = []
    seen: set[str] = set()
    for e in edges:
        ft = _extract_ticker(e.get("from_ticker", ""))
        tt = _extract_ticker(e.get("to_ticker", ""))
        key = f"{ft}->{tt}"
        if ft in ticker_set and tt in ticker_set and key not in seen:
            seen.add(key)
            internal.append({**e, "from_ticker": ft, "to_ticker": tt})

    # 3. Fetch recent risk scores for portfolio tickers
    risk_rows = _q(
        db,
        f"SELECT ticker, score, created_at FROM risk_score "
        f"WHERE ticker IN {list(tickers)} ORDER BY created_at DESC LIMIT 50",
    )

    # 4. Build plain-text context for Claude
    lines = ["PORTFOLIO HOLDINGS:"]
    for c in companies:
        lines.append(
            f"  {c.get('ticker', '?')}: {c.get('name', '')} | "
            f"Sector: {c.get('sector', '')} | MCap: ${c.get('mc', 0)}B"
        )
    if internal:
        lines.append("\nINTERNAL SUPPLY CHAIN LINKS:")
        for e in internal[:20]:
            lines.append(
                f"  {e.get('from_ticker', '')} -> {e.get('to_ticker', '')}: "
                f"{e.get('relationship', '')} (weight={float(e.get('weight', 0)):.2f})"
            )
    if risk_rows:
        lines.append("\nRECENT RISK SCORES:")
        for r in risk_rows[:20]:
            lines.append(f"  {r.get('ticker', '?')}: score={float(r.get('score', 0)):.2f}")
    context = "\n".join(lines)

    # 5. Call Gemini Flash for portfolio analysis
    raw = call_gemini(system=PORTFOLIO_PROMPT, user_content=context, max_tokens=1000)

    # 6. Parse with safe fallback
    fallback: dict = {
        "portfolio_score": 0.5,
        "risk_level": "MEDIUM",
        "reasoning": "Unable to generate AI analysis.",
        "sector_breakdown": {},
        "top_risks": [],
        "supply_chain_vulnerabilities": ["Analysis unavailable"],
    }
    parsed = parse_claude_json(raw, fallback=fallback)

    score = max(0.0, min(1.0, float(parsed.get("portfolio_score", 0.5))))
    level = parsed.get("risk_level", "MEDIUM")
    if level not in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
        level = "CRITICAL" if score > 0.8 else "HIGH" if score >= 0.6 else "MEDIUM" if score >= 0.3 else "LOW"

    return {
        "portfolio_score": round(score, 2),
        "risk_level": level,
        "reasoning": str(parsed.get("reasoning", "Analysis unavailable"))[:500],
        "sector_breakdown": parsed.get("sector_breakdown", {}),
        "top_risks": parsed.get("top_risks", [])[:5],
        "supply_chain_vulnerabilities": parsed.get("supply_chain_vulnerabilities", [])[:5],
    }


# ---------------------------------------------------------------------------
# SurrealDB helpers (mirrored from supply_chain.py pattern)
# ---------------------------------------------------------------------------

def _extract_ticker(value) -> str:
    """Extract ticker string from various SurrealDB response formats."""
    if isinstance(value, str):
        if ":" in value:
            return value.split(":")[-1]
        return value
    if isinstance(value, dict):
        return str(value.get("ticker", ""))
    if hasattr(value, "id"):
        return str(value.id).split(":")[-1]
    return str(value) if value else ""


def _q(db, surql: str) -> list[dict]:
    """Execute a SurrealDB query and return a flat list of result dicts."""
    try:
        result = db.query(surql)
    except Exception as e:
        logger.debug(f"Query failed: {surql[:80]}... -> {e}")
        return []
    if not isinstance(result, list):
        return [result] if isinstance(result, dict) else []
    rows: list[dict] = []
    for item in result:
        if isinstance(item, dict):
            if "result" in item and isinstance(item["result"], list):
                rows.extend(r for r in item["result"] if isinstance(r, dict))
            elif "ticker" in item or "from_ticker" in item or "relationship" in item:
                rows.append(item)
    return rows if rows else [r for r in result if isinstance(r, dict)]
