from __future__ import annotations
"""
RiskTerrain Agent Pipeline -- LangGraph StateGraph
6-node DAG: intake -> geo -> graph -> news -> score -> report
(news before scoring so Claude has headline context)
"""

import time
import logging
from langgraph.graph import StateGraph, END
from agents.state import RiskState
from utils import new_request_id, get_request_id

logger = logging.getLogger("riskterrain.pipeline")

_pipeline = None


def _timed_node(name: str, fn):
    """Wrap a node function with per-node timing and error logging."""
    def wrapper(state: RiskState) -> dict:
        rid = get_request_id()
        t0 = time.time()
        try:
            result = fn(state)
            elapsed = time.time() - t0
            logger.info(f"[{rid}] node {name}: {elapsed:.2f}s")
            return result
        except Exception as e:
            elapsed = time.time() - t0
            logger.error(f"[{rid}] node {name} FAILED ({elapsed:.2f}s): {type(e).__name__}: {e}")
            raise
    return wrapper


def _get_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    from agents.nodes import (event_intake, geo_resolver, graph_traverser,
                               risk_scorer, news_enricher, report_generator)

    workflow = StateGraph(RiskState)
    workflow.add_node("event_intake", _timed_node("event_intake", event_intake))
    workflow.add_node("geo_resolver", _timed_node("geo_resolver", geo_resolver))
    workflow.add_node("graph_traverser", _timed_node("graph_traverser", graph_traverser))
    workflow.add_node("news_enricher", _timed_node("news_enricher", news_enricher))
    workflow.add_node("risk_scorer", _timed_node("risk_scorer", risk_scorer))
    workflow.add_node("report_generator", _timed_node("report_generator", report_generator))

    # news_enricher runs BEFORE risk_scorer so headlines are available for scoring
    workflow.set_entry_point("event_intake")
    workflow.add_edge("event_intake", "geo_resolver")
    workflow.add_edge("geo_resolver", "graph_traverser")
    workflow.add_edge("graph_traverser", "news_enricher")
    workflow.add_edge("news_enricher", "risk_scorer")
    workflow.add_edge("risk_scorer", "report_generator")
    workflow.add_edge("report_generator", END)

    _pipeline = workflow.compile()
    logger.info("LangGraph pipeline compiled: 6 nodes (intake->geo->graph->news->score->report)")
    return _pipeline


def run_pipeline(raw_input: str, source: str = "manual") -> dict:
    """Invoke the full 6-node pipeline. Returns DemoEvent JSON."""
    rid = new_request_id()
    t0 = time.time()
    logger.info(f"[{rid}] Pipeline START: source={source}, len={len(raw_input)}")

    pipeline = _get_pipeline()
    result = pipeline.invoke({"raw_input": raw_input, "source_hint": source})

    final = result.get("final_output", {})
    elapsed = time.time() - t0
    logger.info(
        f"[{rid}] Pipeline DONE: {final.get('id','?')}, "
        f"{len(final.get('risks',{}))} risks, {elapsed:.1f}s total"
    )
    return final
