"""
NewsAPI Scanner -- Fix #23 #31 #80 #99
"""

import time
import logging
import threading
from collections import OrderedDict
import httpx
from config import settings

logger = logging.getLogger("riskterrain.ingest.newsapi")

# Fix #23: consistent with news_enricher
NEWSAPI_URL = "https://newsapi.org/v2/everything"
POLL_INTERVAL = 900
MAX_CACHE = 1000  # Fix #31

TRIGGERS = [
    "sanctions", "trade war", "export controls", "military strike",
    "coup", "embargo", "tariff", "central bank", "rate hike", "rate cut",
    "pandemic", "supply chain", "earthquake", "tsunami", "nuclear",
    "invasion", "blockade", "default", "recession",
]

_processed: OrderedDict = OrderedDict()  # Fix #31
_callback = None
_stop = threading.Event()  # Fix #99


def configure_callback(fn):
    global _callback
    _callback = fn


def poll_once() -> list[str]:
    if not settings.NEWSAPI_KEY or settings.NEWSAPI_KEY == "your_key_here":
        return []
    try:
        with httpx.Client(timeout=5.0) as c:
            r = c.get(NEWSAPI_URL, params={
                "q": "geopolitics OR sanctions OR earthquake OR trade",
                "language": "en", "sortBy": "publishedAt", "pageSize": 20,
                "apiKey": settings.NEWSAPI_KEY,
            })
            if r.status_code != 200:
                return []
            articles = r.json().get("articles", [])
    except Exception as e:
        logger.error(f"NewsAPI: {e}")
        return []

    matches = []
    for a in articles:
        title = a.get("title", "")
        if not title or title == "[Removed]" or title in _processed:
            continue
        if len(_processed) >= MAX_CACHE:
            _processed.popitem(last=False)
        _processed[title] = True

        if any(kw in title.lower() for kw in TRIGGERS):
            desc = a.get("description", "")
            matches.append(f"{title}. {desc}" if desc else title)
            logger.info(f"TRIGGER: [{a.get('source',{}).get('name','?')}] {title}")
    return matches


def _loop():
    logger.info(f"NewsAPI scanner: every {POLL_INTERVAL}s")
    while not _stop.is_set():
        for headline in poll_once():
            if _callback:
                t = threading.Thread(target=_safe_cb, args=(headline,), daemon=True)
                t.start()
        _stop.wait(POLL_INTERVAL)


def _safe_cb(text: str):
    try:
        _callback(text, "NewsAPI")
    except Exception as e:
        logger.error(f"NewsAPI callback: {e}")


def start_background_scanner():
    if not settings.NEWSAPI_KEY or settings.NEWSAPI_KEY == "your_key_here":
        logger.info("NewsAPI not configured, scanner disabled")
        return None
    thread = threading.Thread(target=_loop, daemon=True, name="newsapi")
    thread.start()
    return thread


def stop():
    _stop.set()
