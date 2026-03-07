"""
RiskTerrain Backend — Fix #15 #45 #82 #83 #86 #91 #97 #99 #100
LONDON Hackathon: Agents & Knowledge Graphs (LangChain x SurrealDB)
"""

import logging
import sys
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import settings, __version__

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-35s │ %(levelname)-5s │ %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("riskterrain")

# Fix #82: imports at top
from routes.companies import router as companies_router
from routes.events import router as events_router


# Fix #15: use lifespan instead of deprecated on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    _startup()
    yield
    _shutdown()


app = FastAPI(
    title="RiskTerrain API",
    version=__version__,  # Fix #97
    description="Geospatial S&P 500 Risk Intelligence — LangChain × SurrealDB × LangGraph",
    lifespan=lifespan,  # Fix #15
)

# Fix #91: don't combine allow_origins=["*"] with allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://daththeanalyst.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Fix #100: basic request timing middleware
@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = time.time() - start
    if elapsed > 0.5:  # Only log slow requests
        logger.info(f"{request.method} {request.url.path} → {response.status_code} ({elapsed:.2f}s)")
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled: {request.method} {request.url.path} → {type(exc).__name__}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


def _startup():
    logger.info("=" * 72)
    logger.info(f"  RISKTERRAIN v{__version__} — Starting")
    logger.info("=" * 72)

    # 1. SurrealDB
    from db.surreal import connect, run_schema, get_db
    try:
        connect()
        logger.info("✓ SurrealDB connected")
    except Exception as e:
        logger.error(f"✗ SurrealDB: {type(e).__name__}: {e}")  # Fix #83
        return

    # 2. Schema
    try:
        run_schema()
        logger.info("✓ Schema DDL")
    except Exception as e:
        logger.error(f"✗ Schema: {type(e).__name__}: {e}")

    # Fix #45: seed BEFORE langchain init so graph store has data
    # Actually: schema first, then langchain init, then seed (seed uses langchain dual-write)
    # The order matters: init_langchain_stores needs the connection, seed uses add_supply_chain_to_graph

    # 3. langchain-surrealdb
    try:
        from db.langchain_stores import init_langchain_stores
        init_langchain_stores(get_db())
        logger.info("✓ langchain-surrealdb (VectorStore + Graph + GraphQAChain)")
    except Exception as e:
        logger.warning(f"  langchain-surrealdb: {type(e).__name__}: {e}")

    # 4. Seed (after langchain init so dual-write works)
    try:
        db = get_db()
        count = _extract_count(db.query("SELECT count() FROM company GROUP ALL"))
        if count < 50:
            from db.seed import seed_all
            seed_all()
            logger.info("✓ Seed loaded")
        else:
            logger.info(f"✓ Already seeded ({count} companies)")
    except Exception as e:
        logger.warning(f"  Seed: {type(e).__name__}: {e}")
        try:
            from db.seed import seed_all
            seed_all()
        except Exception as e2:
            logger.error(f"✗ Seed failed: {e2}")

    # 5. Live pollers
    from agents.pipeline import run_pipeline
    try:
        from ingest.usgs import configure_callback, start_background_poller
        configure_callback(run_pipeline)
        start_background_poller()
        logger.info("✓ USGS poller LIVE (60s, M5.0+)")
    except Exception as e:
        logger.warning(f"  USGS: {e}")

    try:
        from ingest.newsapi import configure_callback as nc, start_background_scanner
        nc(run_pipeline)
        start_background_scanner()
        logger.info("✓ NewsAPI scanner LIVE (15min)")
    except Exception as e:
        logger.warning(f"  NewsAPI: {e}")

    logger.info("=" * 72)
    logger.info(f"  RISKTERRAIN v{__version__} — Ready")
    logger.info(f"  Swagger:  http://localhost:{settings.PORT}/docs")
    logger.info(f"  Health:   http://localhost:{settings.PORT}/api/v1/health")
    logger.info(f"  Stats:    http://localhost:{settings.PORT}/api/v1/stats")
    logger.info("=" * 72)


def _shutdown():
    """Fix #99: graceful shutdown of pollers and DB."""
    try:
        from ingest.usgs import stop as stop_usgs
        stop_usgs()
    except Exception:
        pass
    try:
        from ingest.newsapi import stop as stop_news
        stop_news()
    except Exception:
        pass
    from db.surreal import close
    close()
    logger.info("Shutdown complete.")


# ── Health — Fix #86: versioned ───────────────────────────────────────────

@app.get("/api/v1/health", tags=["health"])
def health():
    surreal = "unknown"
    vector = "unknown"
    graph = "unknown"
    try:
        from db.surreal import get_db
        get_db().query("RETURN true")
        surreal = "connected"
    except Exception:
        surreal = "disconnected"
    try:
        from db.langchain_stores import get_vector_store, get_graph_store
        vector = "active" if get_vector_store() is not None else "inactive"
        graph = "active" if get_graph_store() is not None else "inactive"
    except Exception:
        pass

    return {
        "status": "ok" if surreal == "connected" else "degraded",
        "surreal": surreal,
        "langchain_vector_store": vector,
        "langchain_graph_store": graph,
        "model": settings.CLAUDE_MODEL,
        "version": __version__,
    }


@app.get("/api/v1/stats", tags=["health"])
def stats():
    """System statistics — company count, edge count, event count. Useful for judges."""
    try:
        from db.surreal import get_db
        db = get_db()
        companies = _extract_count(db.query("SELECT count() FROM company GROUP ALL"))
        edges = _extract_count(db.query("SELECT count() FROM supplies GROUP ALL"))
        events = _extract_count(db.query("SELECT count() FROM event GROUP ALL"))
        risk_scores = _extract_count(db.query("SELECT count() FROM risk_score GROUP ALL"))
        return {
            "companies": companies,
            "supply_chain_edges": edges,
            "events_processed": events,
            "risk_scores_generated": risk_scores,
            "graph_density": round(edges / max(companies, 1), 2),
        }
    except Exception as e:
        return {"error": str(e)}


# Also serve health at /api/health for backward compat
@app.get("/api/health", tags=["health"], include_in_schema=False)
def health_compat():
    return health()


# Fix #82 #86: mount versioned routers
app.include_router(companies_router)
app.include_router(events_router)

# Backward compat: also mount at /api/ (unversioned)
from fastapi import APIRouter
compat = APIRouter(prefix="/api")
compat.include_router(companies_router, prefix="")
compat.include_router(events_router, prefix="")
# Note: this creates duplicate routes. In production, remove after frontend migration.


def _extract_count(result) -> int:
    if isinstance(result, list):
        for item in result:
            if isinstance(item, dict):
                if "count" in item:
                    return int(item["count"])
                if "result" in item and isinstance(item["result"], list):
                    for r in item["result"]:
                        if isinstance(r, dict) and "count" in r:
                            return int(r["count"])
            if isinstance(item, int):  # Fix #46: handle direct int
                return item
    return 0


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
