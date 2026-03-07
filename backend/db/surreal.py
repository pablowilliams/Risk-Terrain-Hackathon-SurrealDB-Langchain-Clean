from __future__ import annotations
"""
SurrealDB Connection Manager — Fix #6 #7 #54 #55 #56
"""

import time
import logging
from surrealdb import Surreal
from config import settings

logger = logging.getLogger("riskterrain.db")

_db: Surreal | None = None


def connect(max_retries: int = 3) -> Surreal:
    """Establish connection with retry. Supports ws://, http://, and mem:// (embedded)."""
    global _db
    url = settings.SURREAL_URL
    logger.info(f"Connecting to SurrealDB at {url}")

    for attempt in range(max_retries):
        try:
            db = Surreal(url)

            # Embedded mode (mem://, file://) doesn't need signin — just use()
            is_embedded = url.startswith("mem://") or url.startswith("file://")
            if is_embedded:
                db.use(settings.SURREAL_NAMESPACE, settings.SURREAL_DATABASE)
                logger.info("Embedded mode: skipping signin")
            else:
                db.signin({"username": settings.SURREAL_USER, "password": settings.SURREAL_PASS})
                db.use(settings.SURREAL_NAMESPACE, settings.SURREAL_DATABASE)

            # Verify
            db.query("RETURN true")
            _db = db
            logger.info(f"SurrealDB connected: ns={settings.SURREAL_NAMESPACE}, db={settings.SURREAL_DATABASE}")
            return db
        except Exception as e:
            logger.warning(f"Connection attempt {attempt+1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise


def get_db() -> Surreal:
    if _db is None:
        raise RuntimeError("SurrealDB not connected. Call connect() first.")
    return _db


def close():
    """Fix #7: safe close that handles both context-manager and direct patterns."""
    global _db
    if _db is not None:
        try:
            _db.close()
        except AttributeError:
            try:
                _db.__exit__(None, None, None)
            except Exception:
                pass
        except Exception:
            pass
        _db = None
        logger.info("SurrealDB connection closed.")


# Fix #56: split schema into individual statements for better error reporting
_SCHEMA_STATEMENTS = [
    "DEFINE TABLE IF NOT EXISTS company SCHEMAFULL",
    "DEFINE FIELD IF NOT EXISTS ticker ON company TYPE string",
    "DEFINE FIELD IF NOT EXISTS name ON company TYPE string",
    "DEFINE FIELD IF NOT EXISTS sector ON company TYPE string",
    "DEFINE FIELD IF NOT EXISTS lat ON company TYPE float",
    "DEFINE FIELD IF NOT EXISTS lng ON company TYPE float",
    "DEFINE FIELD IF NOT EXISTS mc ON company TYPE int",
    "DEFINE FIELD IF NOT EXISTS country ON company TYPE string DEFAULT 'USA'",
    "DEFINE INDEX IF NOT EXISTS idx_ticker ON company FIELDS ticker UNIQUE",

    "DEFINE TABLE IF NOT EXISTS supplies TYPE RELATION SCHEMAFULL",
    "DEFINE FIELD IF NOT EXISTS relationship ON supplies TYPE string",
    "DEFINE FIELD IF NOT EXISTS weight ON supplies TYPE float",
    "DEFINE FIELD IF NOT EXISTS description ON supplies TYPE string",

    "DEFINE TABLE IF NOT EXISTS event SCHEMAFULL",
    "DEFINE FIELD IF NOT EXISTS type ON event TYPE string",
    "DEFINE FIELD IF NOT EXISTS title ON event TYPE string",
    "DEFINE FIELD IF NOT EXISTS description ON event TYPE string",
    "DEFINE FIELD IF NOT EXISTS severity ON event TYPE int",
    "DEFINE FIELD IF NOT EXISTS source ON event TYPE string",
    "DEFINE FIELD IF NOT EXISTS affected_countries ON event TYPE array",
    "DEFINE FIELD IF NOT EXISTS affected_sectors ON event TYPE array",
    "DEFINE FIELD IF NOT EXISTS lat ON event TYPE float",
    "DEFINE FIELD IF NOT EXISTS lng ON event TYPE float",
    "DEFINE FIELD IF NOT EXISTS created_at ON event TYPE datetime",
    "DEFINE FIELD IF NOT EXISTS risks ON event TYPE object DEFAULT {}",

    "DEFINE TABLE IF NOT EXISTS risk_score SCHEMAFULL",
    "DEFINE FIELD IF NOT EXISTS event_id ON risk_score TYPE string",
    "DEFINE FIELD IF NOT EXISTS ticker ON risk_score TYPE string",
    "DEFINE FIELD IF NOT EXISTS score ON risk_score TYPE float",
    "DEFINE FIELD IF NOT EXISTS reasoning ON risk_score TYPE string",
    "DEFINE FIELD IF NOT EXISTS created_at ON risk_score TYPE datetime",
]


def run_schema():
    """Fix #56: execute schema one statement at a time for clear error reporting."""
    db = get_db()
    for stmt in _SCHEMA_STATEMENTS:
        try:
            db.query(stmt + ";")
        except Exception as e:
            logger.warning(f"Schema statement failed (may already exist): {stmt[:60]}... → {e}")
    logger.info(f"Schema verified ({len(_SCHEMA_STATEMENTS)} statements)")
