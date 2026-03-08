from __future__ import annotations
"""
Market Data -- GET /api/v1/market-data?tickers=AAPL,NVDA
Returns live stock quotes via yfinance (no API key required).
Includes 1-day, 7-day, and 30-day change percentages.
"""

import time
import logging
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger("riskterrain.routes.market")

router = APIRouter(prefix="/api/v1", tags=["market-data"])

# In-memory cache: cache_key -> (timestamp, quotes)
_cache: dict[str, tuple[float, list]] = {}
CACHE_TTL = 60  # seconds


class StockQuote(BaseModel):
    ticker: str
    price: float
    change: float
    change_pct: float
    change_7d: Optional[float] = None
    change_30d: Optional[float] = None


def _pct(current: float, prev: float) -> float:
    if prev == 0:
        return 0.0
    return round((current - prev) / prev * 100, 2)


@router.get("/market-data", response_model=list[StockQuote])
def get_market_data(tickers: str = Query(..., max_length=4000)) -> list[dict]:
    """Return current price with 1d/7d/30d change percentages."""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()][:50]
    if not ticker_list:
        return []

    cache_key = ",".join(sorted(ticker_list))

    # Return cached result if still fresh
    if cache_key in _cache:
        ts, data = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return data

    quotes: list[dict] = []

    try:
        import yfinance as yf

        # Download 35 days to reliably cover 30 trading days + weekends/holidays
        raw = yf.download(
            ticker_list,
            period="35d",
            interval="1d",
            progress=False,
            threads=True,
        )

        for ticker in ticker_list:
            try:
                # Multi-ticker download has a MultiIndex; single-ticker does not
                if len(ticker_list) > 1:
                    close = raw["Close"][ticker]
                else:
                    close = raw["Close"]

                prices = close.dropna().values
                if len(prices) == 0:
                    continue

                current = float(prices[-1])

                # 1-day change (vs previous trading day)
                prev_1d = float(prices[-2]) if len(prices) >= 2 else current
                change_1d = current - prev_1d
                change_pct_1d = _pct(current, prev_1d)

                # 7-day change (vs ~5 trading days ago)
                idx_7d = min(5, len(prices) - 1)
                prev_7d = float(prices[-1 - idx_7d]) if idx_7d > 0 else None
                change_pct_7d = _pct(current, prev_7d) if prev_7d is not None else None

                # 30-day change (vs ~22 trading days ago)
                idx_30d = min(22, len(prices) - 1)
                prev_30d = float(prices[-1 - idx_30d]) if idx_30d > 0 else None
                change_pct_30d = _pct(current, prev_30d) if prev_30d is not None else None

                quotes.append({
                    "ticker": ticker,
                    "price": round(current, 2),
                    "change": round(change_1d, 2),
                    "change_pct": change_pct_1d,
                    "change_7d": change_pct_7d,
                    "change_30d": change_pct_30d,
                })
            except Exception as inner_exc:
                logger.debug(f"Skipping {ticker}: {inner_exc}")
                continue

    except ImportError:
        logger.warning("yfinance not installed -- market-data endpoint unavailable")
    except Exception as e:
        logger.warning(f"Market data fetch failed: {e}")

    _cache[cache_key] = (time.time(), quotes)
    return quotes
