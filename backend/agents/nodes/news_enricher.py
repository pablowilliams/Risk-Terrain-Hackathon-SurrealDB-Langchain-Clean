"""
Node 5: news_enricher -- Fix #23 #24
"""

import re
import logging
import httpx
from config import settings
from agents.state import RiskState

logger = logging.getLogger("riskterrain.node.news_enricher")

# Fix #23: use /v2/everything consistently (both here and ingest)
NEWSAPI_URL = "https://newsapi.org/v2/everything"


def news_enricher(state: RiskState) -> dict:
    title = state.get("title", "")
    sectors = state.get("affected_sectors", [])

    if not settings.NEWSAPI_KEY or settings.NEWSAPI_KEY == "your_key_here":
        logger.info("NewsAPI not configured, skipping")
        return {"news_context": []}

    # Fix #24: build clean search query (remove special chars, numbers, dashes)
    clean_title = re.sub(r"[^a-zA-Z\s]", " ", title).strip()
    query_words = [w for w in clean_title.split() if len(w) > 2][:4]
    if sectors:
        query_words.append(sectors[0])
    search_query = " ".join(query_words)

    if not search_query:
        return {"news_context": []}

    logger.info(f"news_enricher: query='{search_query}'")
    headlines = []

    try:
        with httpx.Client(timeout=3.0) as client:
            r = client.get(NEWSAPI_URL, params={
                "q": search_query, "language": "en",
                "sortBy": "relevancy", "pageSize": 8,
                "apiKey": settings.NEWSAPI_KEY,
            })
            if r.status_code == 200:
                for article in r.json().get("articles", [])[:8]:
                    t = article.get("title", "")
                    if t and t != "[Removed]":
                        src = article.get("source", {}).get("name", "Unknown")
                        headlines.append(f"[{src}] {t}")
                logger.info(f"news_enricher: {len(headlines)} headlines")
            else:
                logger.warning(f"NewsAPI status {r.status_code}")
    except Exception as e:
        logger.warning(f"NewsAPI failed (non-blocking): {e}")

    return {"news_context": headlines}
