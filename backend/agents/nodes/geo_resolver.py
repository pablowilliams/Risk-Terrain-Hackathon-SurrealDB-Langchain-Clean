"""
Node 2: geo_resolver -- Fix #29 #59 #61
"""

import logging
from agents.state import RiskState
from utils import call_gemini, parse_claude_json

logger = logging.getLogger("riskterrain.node.geo_resolver")

# Fix #59: sector names exactly match seed data
GEO_PROMPT = """You are a geopolitical analyst for a financial risk platform.
Determine affected countries and sectors.
Respond ONLY with valid JSON.

Available sectors (use EXACTLY these names):
Technology, Communication, Consumer Disc, Consumer Staples,
Energy, Financials, Healthcare, Industrials, Materials, Utilities, Real Estate

Return: {"affected_countries": ["Country1"], "affected_sectors": ["Sector1"]}

Include cascading geographic effects:
- Taiwan event -> Taiwan, China, Japan, South Korea
- US-China sanctions -> USA, China, Taiwan, South Korea
- Fed rate decision -> USA, Emerging Markets, Eurozone
- Middle East conflict -> affected nations + global Energy"""


def geo_resolver(state: RiskState) -> dict:
    event_desc = f"{state.get('title', '')} -- {state.get('description', '')}"
    severity = state.get("severity", 3)

    logger.info(f"geo_resolver: '{state.get('title', '')}'")

    # Uses Gemini Flash for cheap/fast classification
    raw_text = call_gemini(
        system=GEO_PROMPT,
        user_content=f"Event type: {state.get('event_type','unknown')}\nSeverity: {severity}/5\nDescription: {event_desc}",
        max_tokens=400,
    )

    parsed = parse_claude_json(raw_text, fallback={"affected_countries": ["USA"], "affected_sectors": ["Technology"]})
    countries = parsed.get("affected_countries", ["USA"])
    sectors = parsed.get("affected_sectors", ["Technology"])

    logger.info(f"Resolved: countries={countries}, sectors={sectors}")
    return {"affected_countries": countries, "affected_sectors": sectors}
