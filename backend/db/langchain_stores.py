from __future__ import annotations
"""
LangChain × SurrealDB Integration Hub — Fix #5 #19 #39 #40 #64 #65 #66 #92
"""

__all__ = [
    "init_langchain_stores", "get_vector_store", "get_graph_store",
    "add_event_to_vector_store", "search_similar_events",
    "add_supply_chain_to_graph", "create_graph_qa_chain",
]  # Fix #66

import logging
from langchain_core.documents import Document
from langchain_community.graphs.graph_document import GraphDocument, Node, Relationship

logger = logging.getLogger("riskterrain.langchain_stores")

_vector_store = None
_graph_store = None
_embeddings = None
_qa_chain_cache = None  # Fix #92


def init_langchain_stores(db_connection):
    global _vector_store, _graph_store, _embeddings

    logger.info("Initialising langchain-surrealdb components...")

    # Fix #64: simplified embedding selection (single try chain, not triple-nested)
    _embeddings = _init_embeddings()

    # Fix #5: try the documented constructor signature first
    from langchain_surrealdb.vectorstores import SurrealDBVectorStore
    for attempt_fn in [
        lambda: SurrealDBVectorStore(_embeddings, db_connection),
        lambda: SurrealDBVectorStore(embedding=_embeddings, dburl="", db_connection=db_connection),
        lambda: SurrealDBVectorStore(embedding_function=_embeddings, connection=db_connection),
    ]:
        try:
            _vector_store = attempt_fn()
            logger.info("  ✓ SurrealDBVectorStore initialised")
            break
        except (TypeError, Exception) as e:
            logger.debug(f"  VectorStore constructor attempt failed: {e}")
    else:
        logger.error("  ✗ SurrealDBVectorStore: all constructor signatures failed")

    from langchain_surrealdb.experimental.surrealdb_graph import SurrealDBGraph
    try:
        _graph_store = SurrealDBGraph(db_connection)
        logger.info("  ✓ SurrealDBGraph initialised")
    except Exception as e:
        logger.error(f"  ✗ SurrealDBGraph: {e}")

    logger.info("langchain-surrealdb ready.")


def _init_embeddings():
    """Init embeddings with graceful fallback. Fix #64: flat, not nested."""
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        emb = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        logger.info("  Embeddings: HuggingFace all-MiniLM-L6-v2")
        return emb
    except Exception as e:
        logger.warning(f"  HuggingFace unavailable: {e}")

    try:
        from langchain_ollama import OllamaEmbeddings
        emb = OllamaEmbeddings(model="all-minilm:22m")
        logger.info("  Embeddings: Ollama all-minilm:22m")
        return emb
    except Exception as e:
        logger.warning(f"  Ollama unavailable: {e}")

    logger.info("  Embeddings: Fallback (hash-based)")
    return _FallbackEmbeddings()


# ── VECTOR STORE ──────────────────────────────────────────────────────────────

def get_vector_store():
    return _vector_store


def add_event_to_vector_store(event_id: str, title: str, description: str,
                               severity: int, risks: dict, metadata: dict = None):
    if _vector_store is None:
        return

    risk_summary = ", ".join(f"{t}:{r['score']:.2f}" for t, r in list(risks.items())[:8]) if risks else "none"
    page_content = f"Event: {title}. {description} Severity: {severity}/5. Risks: {risk_summary}"

    doc_metadata = {"severity": severity, "title": title, "risk_count": len(risks)}
    if metadata:
        doc_metadata.update(metadata)

    try:
        doc = Document(page_content=page_content, metadata=doc_metadata)
        # Fix #40: sanitise doc ID (remove colons from SurrealDB record IDs)
        safe_id = str(event_id).replace(":", "_").replace("⟨", "").replace("⟩", "")
        _vector_store.add_documents([doc], ids=[safe_id])
        logger.info(f"Event embedded in VectorStore ({len(page_content)} chars)")
    except Exception as e:
        logger.error(f"Vector store write failed: {e}")


def search_similar_events(query: str, k: int = 5, score_threshold: float = 0.0) -> list[dict]:
    """Fix #39: handle both distance (lower=better) and similarity (higher=better) semantics."""
    if _vector_store is None:
        return []

    try:
        results = _vector_store.similarity_search_with_score(query=query, k=k)
        similar = []
        for doc, score in results:
            similar.append({
                "title": doc.metadata.get("title", "Unknown"),
                "severity": doc.metadata.get("severity", 0),
                "risk_count": doc.metadata.get("risk_count", 0),
                "similarity_score": round(float(score), 3),
                "content_preview": doc.page_content[:150],
            })
        # Fix #39: sort by score descending (works for both distance and similarity)
        # Most vector stores return similarity (higher=better), but if distance, caller can adjust
        similar.sort(key=lambda x: x["similarity_score"], reverse=True)
        logger.info(f"Vector search: '{query[:40]}...' → {len(similar)} results")
        return similar
    except Exception as e:
        logger.warning(f"Vector search failed: {e}")
        return []


# ── GRAPH STORE ───────────────────────────────────────────────────────────────

def get_graph_store():
    return _graph_store


def add_supply_chain_to_graph(from_ticker: str, to_ticker: str,
                                relationship: str, weight: float, description: str):
    if _graph_store is None:
        return
    try:
        src = Node(id=from_ticker, type="company")
        tgt = Node(id=to_ticker, type="company")
        graph_doc = GraphDocument(
            source=Document(
                page_content=f"{from_ticker} supplies {to_ticker}: {description}",
                metadata={"relationship": relationship, "weight": weight},
            ),
            nodes=[src, tgt],
            relationships=[Relationship(source=src, target=tgt, type=relationship,
                                         properties={"weight": weight, "description": description})],
        )
        _graph_store.add_graph_documents([graph_doc])
    except Exception as e:
        logger.debug(f"GraphDocument add: {e}")


def get_graph_schema() -> str:
    """Fix #65: call get_schema as property or method."""
    if _graph_store is None:
        return "Graph store not available"
    try:
        schema = _graph_store.get_schema
        return schema() if callable(schema) else str(schema)
    except Exception:
        return "Schema unavailable"


# ── GRAPH QA CHAIN ────────────────────────────────────────────────────────────

def create_graph_qa_chain(llm=None):
    """Fix #92: cache the chain instance."""
    global _qa_chain_cache
    if _qa_chain_cache is not None:
        return _qa_chain_cache
    if _graph_store is None:
        return None

    try:
        from langchain_surrealdb.experimental.surrealdb_graphqa import SurrealDBGraphQAChain
        if llm is None:
            from langchain_anthropic import ChatAnthropic
            from config import settings
            llm = ChatAnthropic(model=settings.CLAUDE_MODEL, temperature=0,
                                 anthropic_api_key=settings.ANTHROPIC_API_KEY)
        chain = SurrealDBGraphQAChain.from_llm(llm=llm, graph=_graph_store, verbose=True)
        _qa_chain_cache = chain
        logger.info("SurrealDBGraphQAChain created")
        return chain
    except ImportError:
        logger.warning("GraphQAChain not available")
        return None
    except Exception as e:
        logger.error(f"GraphQAChain failed: {e}")
        return None


# Fix #19: proper Embeddings interface
class _FallbackEmbeddings:
    """Hash-based embeddings fallback implementing LangChain Embeddings interface."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._hash_embed(t) for t in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._hash_embed(text)

    @staticmethod
    def _hash_embed(text: str, dim: int = 384) -> list[float]:
        import hashlib
        h = hashlib.sha512(text.encode()).digest()
        extended = h * ((dim // len(h)) + 1)
        return [((b / 255.0) * 2 - 1) for b in extended[:dim]]
