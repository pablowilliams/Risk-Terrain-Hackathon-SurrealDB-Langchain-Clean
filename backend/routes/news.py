from __future__ import annotations
"""
News Feed -- GET /api/v1/news?tickers=AAPL,NVDA
Fetches recent articles from NewsAPI filtered by ticker symbols.
"""

import time
import logging
import httpx
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from config import settings

logger = logging.getLogger("riskterrain.routes.news")

router = APIRouter(prefix="/api/v1", tags=["news"])

NEWSAPI_URL = "https://newsapi.org/v2/everything"

# In-memory cache: cache_key -> (timestamp, articles)
_cache: dict[str, tuple[float, list]] = {}
CACHE_TTL = 120  # seconds


class NewsArticle(BaseModel):
    title: str
    url: str
    source: str
    published_at: Optional[str] = None
    description: Optional[str] = None


@router.get("/news", response_model=list[NewsArticle])
def get_news(tickers: str = Query(..., max_length=200)) -> list[dict]:
    """Return recent news articles for the given comma-separated ticker list."""
    if not settings.NEWSAPI_KEY or settings.NEWSAPI_KEY in ("", "your_key_here"):
        raise HTTPException(status_code=503, detail="NewsAPI not configured")

    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()][:10]
    if not ticker_list:
        raise HTTPException(status_code=400, detail="At least one ticker is required")

    cache_key = ",".join(sorted(ticker_list))

    # Return cached result if still fresh
    if cache_key in _cache:
        ts, data = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return data

    query = " OR ".join(ticker_list)
    articles: list[dict] = []

    try:
        with httpx.Client(timeout=5.0) as client:
            r = client.get(
                NEWSAPI_URL,
                params={
                    "q": query,
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 15,
                    "apiKey": settings.NEWSAPI_KEY,
                },
            )
            if r.status_code == 200:
                for a in r.json().get("articles", [])[:15]:
                    title = a.get("title", "")
                    if title and title != "[Removed]":
                        articles.append({
                            "title": title,
                            "url": a.get("url", ""),
                            "source": a.get("source", {}).get("name", "Unknown"),
                            "published_at": a.get("publishedAt", ""),
                            "description": (a.get("description", "") or "")[:200],
                        })
            else:
                logger.warning(f"NewsAPI returned HTTP {r.status_code}")
    except Exception as e:
        logger.warning(f"NewsAPI fetch failed: {e}")

    # Deduplicate by URL and normalized title (syndication often produces near-dupes)
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    unique: list[dict] = []
    for a in articles:
        url = a.get("url", "")
        title_key = a.get("title", "").lower().strip()[:80]
        if url in seen_urls or title_key in seen_titles:
            continue
        seen_urls.add(url)
        seen_titles.add(title_key)
        unique.append(a)

    _cache[cache_key] = (time.time(), unique)
    return unique
