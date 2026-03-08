"""
RiskState -- Fix #50 #51 #52: proper typing with Required fields.
"""

from typing import TypedDict, Required


class RiskEntry(TypedDict):
    score: float
    reasoning: str


class HistoricalEvent(TypedDict, total=False):
    title: str
    severity: int
    risk_count: int
    similarity_score: float
    content_preview: str


class ExposedCompany(TypedDict, total=False):
    ticker: str
    name: str
    sector: str
    exposure_type: str
    max_weight: float
    paths: list[str]


class RiskState(TypedDict, total=False):
    # Fix #50: mark input fields as Required
    raw_input: Required[str]
    source_hint: str

    # Node 1: event_intake
    event_type: str
    title: str
    description: str
    severity: int
    source: str
    event_lat: float
    event_lng: float

    # Node 2: geo_resolver
    affected_countries: list[str]
    affected_sectors: list[str]

    # Node 3: graph_traverser
    exposed_companies: list[ExposedCompany]  # Fix #52
    supply_chain_paths: list[str]
    similar_historical_events: list[HistoricalEvent]  # Fix #52

    # Node 4: risk_scorer
    risks: dict[str, RiskEntry]  # Fix #51

    # Node 5: news_enricher
    news_context: list[str]
    news_articles: list[dict]  # [{title, url, source, published_at}]

    # Node 6: report_generator
    event_id: str
    created_at: str
    final_output: dict
