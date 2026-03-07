"""
Node 4: risk_scorer — Fix #18 #25 #26 #62 #93
"""

import json
import logging
from agents.state import RiskState
from utils import call_claude, parse_claude_json

logger = logging.getLogger("riskterrain.node.risk_scorer")

# Fix #25: prompt and code both use 15
SCORING_PROMPT = """You are a senior financial risk analyst scoring S&P 500 exposure to a geopolitical event.

You receive: event details, supply chain graph paths (with weights), and historical events.

SCORING RUBRIC:
  0.90-1.00: Catastrophic — sole-source supplier in epicentre
  0.70-0.89: Major — primary supplier affected
  0.50-0.69: Moderate — secondary supplier, partial revenue
  0.30-0.49: Mild — tertiary dependency
  0.10-0.29: Marginal — weak correlation

RULES:
  - Ground scores in supply chain weights (weight=0.90 → score≥0.85)
  - 2-HOP companies score LOWER than 1-hop
  - Sector peers (weight≤0.30) score ≤0.40
  - Only companies with score≥0.15
  - Maximum 15 companies

Respond ONLY with valid JSON:
{"TICKER": {"score": 0.XX, "reasoning": "One sentence"}}"""


def risk_scorer(state: RiskState) -> dict:
    exposed = state.get("exposed_companies", [])
    paths_list = state.get("supply_chain_paths", [])
    historical = state.get("similar_historical_events", [])
    news = state.get("news_context", [])

    if not exposed:
        return {"risks": {}}

    event_ctx = (
        f"EVENT: {state.get('title', '?')}\n"
        f"Type: {state.get('event_type', '?')}, Severity: {state.get('severity', 3)}/5\n"
        f"Description: {state.get('description', 'N/A')}\n"
        f"Countries: {', '.join(state.get('affected_countries', []))}\n"
        f"Sectors: {', '.join(state.get('affected_sectors', []))}\n"
    )

    co_ctx = "EXPOSED COMPANIES (from SurrealDB knowledge graph traversal):\n"
    for comp in exposed[:15]:
        t = comp.get("ticker", "?")
        name = comp.get("name", "")
        w = comp.get("max_weight", 0)
        label = f"{t} ({name})" if name else t
        co_ctx += f"  {label}: weight={w:.2f}, exposure={comp.get('exposure_type','?')}\n"
        for p in comp.get("paths", [])[:2]:
            co_ctx += f"    {p}\n"

    path_ctx = "SUPPLY CHAIN PATHS (from SurrealDB graph edges):\n" + "\n".join(f"  {p}" for p in paths_list[:25])

    hist_ctx = ""
    if historical:
        hist_ctx = "\nSIMILAR HISTORICAL EVENTS (from SurrealDBVectorStore):\n" + "\n".join(
            f"  {e.get('title','?')} (sev={e.get('severity')}, {e.get('risk_count',0)} companies)"
            for e in historical[:3]
        )

    news_ctx = ""
    if news:
        news_ctx = "\nRECENT NEWS CONTEXT (from NewsAPI):\n" + "\n".join(f"  {h}" for h in news[:5])

    full = f"{event_ctx}\n{co_ctx}\n{path_ctx}{hist_ctx}{news_ctx}"
    logger.info(f"risk_scorer: {len(exposed)} companies, ~{len(full)} chars context")

    # Fix #62: retry-enabled Claude call; Fix #26: 2500 tokens for headroom
    raw = call_claude(system=SCORING_PROMPT, user_content=full, max_tokens=2500)

    risks = parse_claude_json(raw)
    if not risks:
        # Fix #18: fallback only uses known tickers from exposed list
        known_tickers = {c.get("ticker", "") for c in exposed if c.get("ticker")}
        risks = {}
        for comp in exposed[:10]:
            t = comp.get("ticker", "")
            if t in known_tickers:
                w = comp.get("max_weight", 0.3)
                risks[t] = {"score": round(min(w * 0.9, 1.0), 2),
                             "reasoning": f"Estimated from supply chain weight ({w:.2f})"}

    # Validate + normalise
    validated = {}
    for ticker, risk in risks.items():
        if isinstance(risk, dict) and "score" in risk:
            score = max(0.0, min(1.0, float(risk["score"])))
            # Fix #93: sanitise reasoning (escape problematic chars)
            reasoning = str(risk.get("reasoning", "")).replace('"', "'").replace("\\", "")[:200]
            validated[ticker] = {"score": round(score, 2), "reasoning": reasoning}

    validated = dict(sorted(validated.items(), key=lambda x: x[1]["score"], reverse=True))
    logger.info(f"risk_scorer: {len(validated)} scored, top={list(validated.keys())[:3]}")
    return {"risks": validated}
