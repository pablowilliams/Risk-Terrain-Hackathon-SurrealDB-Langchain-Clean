from __future__ import annotations
"""
Node 1: event_intake -- Fix #9 #28 #57 #58 #60
"""

import json
import logging
from agents.state import RiskState
from utils import call_claude, parse_claude_json

logger = logging.getLogger("riskterrain.node.event_intake")

CLASSIFICATION_PROMPT = """You are a geopolitical event classifier for a financial risk platform.
Extract structured metadata from raw event descriptions.
Respond ONLY with valid JSON.

{
  "event_type": "natural_disaster" | "geopolitical" | "macro",
  "title": "<concise, max 60 chars>",
  "description": "<2-3 sentences on event and financial impact>",
  "severity": <1-5>,
  "lat": <epicentre latitude>,
  "lng": <epicentre longitude>
}

Severity: 5=catastrophic 4=major 3=significant 2=moderate 1=minor

Example input: "US announces new semiconductor export controls targeting China"
Example output: {"event_type": "geopolitical", "title": "US Semiconductor Export Controls -- China", "description": "The US government has announced sweeping new restrictions on semiconductor equipment exports to China, targeting EUV lithography and advanced chip manufacturing. This could disrupt global chip supply chains and affect companies with China revenue exposure.", "severity": 4, "lat": 39.9, "lng": 116.4}"""


def _try_parse_usgs(raw: str) -> dict | None:
    try:
        data = json.loads(raw)
        props = data.get("properties", {})
        coords = data.get("geometry", {}).get("coordinates", [])
        if "mag" not in props or len(coords) < 2:
            return None
        mag = float(props["mag"])
        place = props.get("place", "Unknown location")
        # Fix #58: magnitude-appropriate description
        if mag >= 7.0:
            sev, impact = 5, "catastrophic damage and major supply chain disruptions"
        elif mag >= 6.0:
            sev, impact = 4, "significant damage to infrastructure and regional supply chains"
        elif mag >= 5.0:
            sev, impact = 3, "moderate structural impacts and localised disruptions"
        else:
            sev, impact = 2, "minor local effects"
        usgs_url = props.get("url", "")
        articles = [{"title": f"M{mag:.1f} Earthquake -- {place}", "url": usgs_url, "source": "USGS"}] if usgs_url else []
        return {
            "event_type": "natural_disaster",
            "title": f"M{mag:.1f} Earthquake -- {place}",
            "description": f"A magnitude {mag:.1f} earthquake struck {place}, potentially causing {impact}.",
            "severity": sev,
            "event_lat": float(coords[1]),
            "event_lng": float(coords[0]),
            "news_articles": articles,
        }
    except (json.JSONDecodeError, KeyError, TypeError, IndexError, ValueError):  # Fix #57
        return None


def event_intake(state: RiskState) -> dict:
    raw = state["raw_input"]
    source_hint = state.get("source_hint", "manual")
    logger.info(f"event_intake: {len(raw)} chars, source={source_hint}")

    usgs = _try_parse_usgs(raw)
    if usgs:
        logger.info(f"USGS parsed: {usgs['title']}")
        return {**usgs, "source": "USGS"}

    # Fix #60: uses shared retry-enabled call_claude
    raw_text = call_claude(
        system=CLASSIFICATION_PROMPT,
        user_content=f"Classify this event:\n\n{raw[:1500]}",  # Fix #88: truncate
        max_tokens=500,
    )

    parsed = parse_claude_json(raw_text, fallback={
        "event_type": "geopolitical", "title": raw[:60], "description": raw[:200],
        "severity": 3, "lat": 0.0, "lng": 0.0,
    })

    logger.info(f"Classified: {parsed.get('title')} (sev={parsed.get('severity')})")
    return {
        "event_type": parsed.get("event_type", "geopolitical"),
        "title": parsed.get("title", raw[:60]),
        "description": parsed.get("description", raw[:200]),
        "severity": max(1, min(5, int(parsed.get("severity", 3)))),
        "source": source_hint,
        "event_lat": float(parsed.get("lat", 0)),
        "event_lng": float(parsed.get("lng", 0)),
    }
