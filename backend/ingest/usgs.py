"""
USGS Earthquake Poller -- Fix #30 #32 #33 #81 #99
"""

import json
import time
import logging
import threading
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
import httpx

logger = logging.getLogger("riskterrain.ingest.usgs")

USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
POLL_INTERVAL = 60
MIN_MAG = 5.0
MAX_CACHE = 500  # Fix #30: bounded

_processed: OrderedDict = OrderedDict()  # Fix #30: bounded LRU
_callback = None
_stop = threading.Event()  # Fix #99: graceful stop


def configure_callback(fn):
    global _callback
    _callback = fn


def fetch_recent(hours: int = 24) -> list[dict]:
    start = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%S")
    try:
        with httpx.Client(timeout=10.0) as c:
            r = c.get(USGS_URL, params={"format": "geojson", "minmagnitude": MIN_MAG,
                                         "orderby": "time", "limit": 10, "starttime": start})
            if r.status_code == 200:
                return r.json().get("features", [])
    except Exception as e:
        logger.error(f"USGS fetch: {e}")
    return []


def poll_once(process: bool = True) -> list[dict]:
    """Fix #32: process=False on first run to seed cache without triggering pipeline."""
    features = fetch_recent()
    new = []
    for f in features:
        qid = f.get("id", "")
        if qid and qid not in _processed:
            # Fix #30: bounded cache
            if len(_processed) >= MAX_CACHE:
                _processed.popitem(last=False)
            _processed[qid] = True
            if process:
                new.append(f)
                mag = f.get("properties", {}).get("mag", 0)
                place = f.get("properties", {}).get("place", "?")
                logger.info(f"NEW EARTHQUAKE: M{mag} -- {place}")
    return new


def _loop():
    logger.info(f"USGS poller: every {POLL_INTERVAL}s, M{MIN_MAG}+")
    # Fix #32: first poll seeds cache without processing
    poll_once(process=False)
    logger.info(f"USGS: cached {len(_processed)} recent earthquakes (not processing)")

    while not _stop.is_set():  # Fix #99
        try:
            for quake in poll_once(process=True):
                if _callback:
                    # Fix #33: run in separate thread to not block poller
                    raw = json.dumps(quake)
                    t = threading.Thread(target=_safe_callback, args=(raw,), daemon=True)
                    t.start()
        except Exception as e:
            logger.error(f"USGS poll error: {e}")
        _stop.wait(POLL_INTERVAL)


def _safe_callback(raw: str):
    try:
        _callback(raw, "USGS")
    except Exception as e:
        logger.error(f"Pipeline callback failed: {e}")


def start_background_poller():
    thread = threading.Thread(target=_loop, daemon=True, name="usgs-poller")
    thread.start()
    return thread


def stop():
    """Fix #99: graceful stop."""
    _stop.set()
