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
    # Original
    "sanctions", "trade war", "export controls", "military strike",
    "coup", "embargo", "tariff", "central bank", "rate hike", "rate cut",
    "pandemic", "supply chain", "earthquake", "tsunami", "nuclear",
    "invasion", "blockade", "default", "recession",
    # War / conflict / military
    "war", "bombing", "airstrike", "missile", "attack", "explosion",
    "conflict", "strikes hit", "troops", "military", "combat",
    "ceasefire", "artillery", "drone strike",
    # Geopolitical crisis
    "crisis", "protest", "unrest", "riot", "martial law",
    "assassination", "escalation", "retaliation", "diplomatic",
    # Energy / commodity disruption
    "oil", "crude", "opec", "pipeline", "refinery", "energy crisis",
    "gas prices", "fuel shortage", "commodity",
    # Financial shocks
    "market crash", "bank failure", "debt crisis", "currency",
    "inflation", "stock plunge", "sell-off", "volatility",
]

_processed: OrderedDict = OrderedDict()  # Fix #31
_callback = None
_stop = threading.Event()  # Fix #99

# Stop words for title similarity (common words that don't add meaning)
_STOP = {"a","an","the","of","in","on","to","for","and","or","is","are","was","has","by","at","its","with","from","over","into","says","said"}


def _stem(word: str) -> str:
    """Minimal suffix stripping so 'refunds'=='refund', 'processing'=='process'."""
    if len(word) <= 4:
        return word
    if word.endswith("ing") and len(word) > 6:
        return word[:-3]
    if word.endswith("ed") and len(word) > 5:
        return word[:-2]
    if word.endswith("es") and not word.endswith("ses") and len(word) > 5:
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 4:
        return word[:-1]
    return word


def _title_words(title: str) -> set[str]:
    """Extract meaningful words from a title (lowercase, stemmed, no stop words)."""
    return {_stem(w) for w in title.lower().split() if w not in _STOP and len(w) > 1}


def _jaccard_duplicate(title: str, threshold: float = 0.65) -> bool:
    """Fast check: word-overlap similarity (Jaccard + overlap coefficient)."""
    new_words = _title_words(title)
    if len(new_words) < 3:
        return title in _processed
    for existing in _processed:
        existing_words = _title_words(existing)
        if not existing_words:
            continue
        intersection = new_words & existing_words
        union = new_words | existing_words
        jaccard = len(intersection) / len(union)
        # Overlap coefficient: catches short-headline subsets
        overlap = len(intersection) / min(len(new_words), len(existing_words))
        if jaccard >= threshold or overlap >= 0.40:
            return True
    return False


def _gemini_duplicate(title: str) -> bool:
    """Use Gemini Flash to confirm semantic duplicates (cheap, ~0.1s)."""
    try:
        from config import settings
        if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY == "your_google_api_key_here":
            return False
        from utils import call_gemini
        recent = list(_processed.keys())[-20:]  # Check against last 20
        if not recent:
            return False
        titles_list = "\n".join(f"- {t}" for t in recent)
        result = call_gemini(
            system="You are a duplicate news detector. Answer ONLY 'YES' or 'NO'.",
            user_content=(
                f"Is this headline reporting the SAME event as any headline below?\n\n"
                f"NEW: {title}\n\nEXISTING:\n{titles_list}\n\n"
                f"Answer YES if it's about the same specific event (not just same topic). Answer NO otherwise."
            ),
            max_tokens=5,
            temperature=0,
        )
        is_dup = result.strip().upper().startswith("YES")
        if is_dup:
            logger.info(f"GEMINI DEDUP: '{title}' flagged as duplicate")
        return is_dup
    except Exception as e:
        logger.warning(f"Gemini dedup failed: {e}")
        return False


def _is_duplicate(title: str) -> bool:
    """Two-tier dedup: fast Jaccard first, then Gemini for borderline cases."""
    if _jaccard_duplicate(title, threshold=0.60):
        logger.debug(f"JACCARD DEDUP: '{title}'")
        return True
    # Gemini catches semantic duplicates that word-overlap misses
    return _gemini_duplicate(title)


def configure_callback(fn):
    global _callback
    _callback = fn


def poll_once() -> list[str]:
    if not settings.NEWSAPI_KEY or settings.NEWSAPI_KEY == "your_key_here":
        return []
    try:
        with httpx.Client(timeout=5.0) as c:
            r = c.get(NEWSAPI_URL, params={
                "q": (
                    "geopolitics OR sanctions OR earthquake OR trade OR "
                    "war OR bombing OR airstrike OR missile OR military OR "
                    "oil OR crisis OR conflict OR attack OR explosion OR "
                    "recession OR inflation OR tariff"
                ),
                "language": "en", "sortBy": "publishedAt", "pageSize": 30,
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
        if not title or title == "[Removed]" or _is_duplicate(title):
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
