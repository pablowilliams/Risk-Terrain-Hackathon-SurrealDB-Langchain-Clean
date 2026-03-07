#!/usr/bin/env python3
"""
RiskTerrain Integration Test — Runs OFFLINE (no external services needed except Claude)
Boots SurrealDB in-memory, seeds data, runs the pipeline, verifies graph traversal.

Usage:
  python test_integration.py           # Full test (needs ANTHROPIC_API_KEY in .env)
  python test_integration.py --no-llm  # Graph-only test (no Claude needed)
"""

import sys
import os
import json
import time
import logging

# Setup path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
logging.basicConfig(level=logging.INFO, format="%(asctime)s │ %(name)-30s │ %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger("test")

P = "\033[92m✓ PASS\033[0m"
F = "\033[91m✗ FAIL\033[0m"
W = "\033[93m⚠ SKIP\033[0m"
results = []
no_llm = "--no-llm" in sys.argv


def test(name, fn, skip_if_no_llm=False):
    if skip_if_no_llm and no_llm:
        print(f"  {W}  {name} (skipped: --no-llm)")
        return
    try:
        fn()
        print(f"  {P}  {name}")
        results.append(True)
    except Exception as e:
        print(f"  {F}  {name}")
        print(f"       {type(e).__name__}: {e}")
        results.append(False)


def main():
    print(f"\n{'='*65}")
    print(f"  RiskTerrain Integration Test {'(no-LLM mode)' if no_llm else '(full)'}")
    print(f"{'='*65}\n")

    # ── 1. Connect to SurrealDB ───────────────────────────────────────
    def t1():
        # Force embedded mode for integration test
        import config
        config.settings.SURREAL_URL = "mem://"
        from db.surreal import connect, get_db
        connect()
        db = get_db()
        result = db.query("RETURN 'hello'")
        assert result is not None, "Query returned None"
    test("SurrealDB connection (embedded mem://)", t1)

    # ── 2. Schema DDL ─────────────────────────────────────────────────
    def t2():
        from db.surreal import run_schema
        run_schema()
    test("Schema DDL (4 tables)", t2)

    # ── 3. Seed companies ─────────────────────────────────────────────
    def t3():
        from db.seed import seed_companies, SP500_COMPANIES
        seed_companies()
        from db.surreal import get_db
        db = get_db()
        result = db.query("SELECT count() FROM company GROUP ALL")
        # Extract count
        count = 0
        if isinstance(result, list):
            for item in result:
                if isinstance(item, dict):
                    if "count" in item:
                        count = int(item["count"])
                    elif "result" in item:
                        for r in item["result"]:
                            if isinstance(r, dict) and "count" in r:
                                count = int(r["count"])
        assert count >= 100, f"Only {count} companies seeded (expected 100+)"
        print(f"       {count} companies in DB")
    test("Seed companies (154)", t3)

    # ── 4. Verify TSMC has country=Taiwan ─────────────────────────────
    def t4():
        from db.surreal import get_db
        db = get_db()
        result = db.query("SELECT ticker, country FROM company:TSMC")
        rows = _extract(result)
        assert rows, "company:TSMC not found"
        country = rows[0].get("country", "MISSING")
        assert country == "Taiwan", f"TSMC country={country}, expected Taiwan"
        print(f"       TSMC country={country} ✓")
    test("TSMC country = Taiwan (Fix #1-3)", t4)

    # ── 5. Seed supply chain edges ────────────────────────────────────
    def t5():
        from db.seed import seed_supply_chain
        seed_supply_chain()
        from db.surreal import get_db
        db = get_db()
        result = db.query("SELECT count() FROM supplies GROUP ALL")
        count = _extract_count(result)
        assert count >= 50, f"Only {count} edges (expected 50+)"
        print(f"       {count} supply chain edges")
    test("Seed supply chain (~90 RELATE edges)", t5)

    # ── 6. Verify TSMC→NVDA graph edge ────────────────────────────────
    def t6():
        from db.surreal import get_db
        db = get_db()
        result = db.query("SELECT *, out AS to_rec FROM supplies WHERE in = company:TSMC")
        rows = _extract(result)
        assert rows, "No edges from company:TSMC"
        customers = [_ticker(r.get("to_rec", "")) for r in rows]
        assert "NVDA" in customers, f"NVDA not in TSMC customers: {customers}"
        # Check weight
        nvda_edge = [r for r in rows if _ticker(r.get("to_rec", "")) == "NVDA"]
        weight = float(nvda_edge[0].get("weight", 0))
        assert weight >= 0.85, f"TSMC→NVDA weight={weight}, expected ≥0.85"
        print(f"       TSMC→NVDA edge: weight={weight}, relationship={nvda_edge[0].get('relationship')}")
        print(f"       TSMC supplies: {customers}")
    test("TSMC→NVDA graph edge (weight=0.90)", t6)

    # ── 7. Verify reverse edge (NVDA downstream) ─────────────────────
    def t7():
        from db.surreal import get_db
        db = get_db()
        result = db.query("SELECT *, out AS to_rec FROM supplies WHERE in = company:NVDA")
        rows = _extract(result)
        customers = [_ticker(r.get("to_rec", "")) for r in rows]
        assert "MSFT" in customers, f"MSFT not in NVDA customers: {customers}"
        print(f"       NVDA supplies: {customers}")
    test("NVDA→MSFT graph edge (2nd-order path)", t7)

    # ── 8. Graph traversal (Taiwan earthquake scenario) ───────────────
    def t8():
        from db.surreal import get_db
        db = get_db()

        # Step A: find companies in Taiwan
        result = db.query("SELECT ticker FROM company WHERE country = 'Taiwan'")
        taiwan = [r.get("ticker") for r in _extract(result) if r.get("ticker")]
        assert "TSMC" in taiwan, f"TSMC not found in Taiwan companies: {taiwan}"

        # Step B: find who TSMC supplies (1-hop downstream)
        result = db.query("SELECT *, out AS to_rec FROM supplies WHERE in = company:TSMC")
        hop1 = [_ticker(r.get("to_rec", "")) for r in _extract(result)]
        assert len(hop1) >= 5, f"TSMC only supplies {len(hop1)} companies: {hop1}"
        assert "NVDA" in hop1

        # Step C: find who NVDA supplies (2-hop)
        result = db.query("SELECT *, out AS to_rec FROM supplies WHERE in = company:NVDA")
        hop2 = [_ticker(r.get("to_rec", "")) for r in _extract(result)]
        assert "MSFT" in hop2 or "GOOGL" in hop2, f"Expected MSFT/GOOGL in NVDA customers: {hop2}"

        print(f"       Taiwan companies: {taiwan}")
        print(f"       TSMC 1-hop: {hop1}")
        print(f"       NVDA 2-hop: {hop2}")
        print(f"       Full path: Taiwan→TSMC→NVDA→MSFT ✓")
    test("Graph traversal: Taiwan→TSMC→NVDA→MSFT path", t8)

    # ── 9. Event intake (USGS JSON parse) ─────────────────────────────
    def t9():
        from agents.nodes.event_intake import event_intake
        usgs_json = json.dumps({
            "properties": {"mag": 7.4, "place": "Hualien County, Taiwan"},
            "geometry": {"coordinates": [121.6, 24.0, 10.0]}
        })
        result = event_intake({"raw_input": usgs_json, "source_hint": "USGS"})
        assert result["event_type"] == "natural_disaster"
        assert result["severity"] == 5
        assert result["source"] == "USGS"
        assert abs(result["event_lat"] - 24.0) < 0.1
        print(f"       {result['title']} (sev={result['severity']})")
    test("Event intake: USGS JSON parse (no LLM)", t9)

    # ── 10. Event intake (Claude classification) ──────────────────────
    def t10():
        from agents.nodes.event_intake import event_intake
        result = event_intake({
            "raw_input": "M7.4 earthquake strikes Taiwan. TSMC halts production.",
            "source_hint": "manual",
        })
        assert result.get("event_type") in ("natural_disaster", "geopolitical")
        assert result.get("severity", 0) >= 3
        print(f"       {result.get('title')} (sev={result.get('severity')})")
    test("Event intake: Claude classification", t10, skip_if_no_llm=True)

    # ── 11. Geo resolver ──────────────────────────────────────────────
    def t11():
        from agents.nodes.geo_resolver import geo_resolver
        result = geo_resolver({
            "raw_input": "",
            "event_type": "natural_disaster",
            "title": "M7.4 Earthquake — Taiwan",
            "description": "Major earthquake strikes Hualien County, Taiwan. TSMC pauses.",
            "severity": 5,
        })
        assert "Taiwan" in result.get("affected_countries", [])
        assert any("Tech" in s for s in result.get("affected_sectors", []))
        print(f"       Countries: {result['affected_countries']}")
        print(f"       Sectors: {result['affected_sectors']}")
    test("Geo resolver: Taiwan earthquake", t11, skip_if_no_llm=True)

    # ── 12. Graph traverser node ──────────────────────────────────────
    def t12():
        from agents.nodes.graph_traverser import graph_traverser
        result = graph_traverser({
            "raw_input": "",
            "affected_countries": ["Taiwan"],
            "affected_sectors": ["Technology"],
            "title": "Taiwan Earthquake",
            "description": "TSMC halts production",
        })
        exposed = result.get("exposed_companies", [])
        tickers = [c.get("ticker") for c in exposed]
        assert "TSMC" in tickers, f"TSMC not in exposed: {tickers[:10]}"

        # Check that NVDA is found via supply chain
        nvda = [c for c in exposed if c.get("ticker") == "NVDA"]
        if nvda:
            assert nvda[0].get("max_weight", 0) >= 0.8, f"NVDA weight={nvda[0].get('max_weight')}"
            print(f"       NVDA weight={nvda[0]['max_weight']:.2f} ✓")
        else:
            # NVDA might be found via 1-hop supply chain
            paths = result.get("supply_chain_paths", [])
            nvda_paths = [p for p in paths if "NVDA" in p]
            assert nvda_paths, f"NVDA not found in exposed or paths: {tickers[:10]}"
            print(f"       NVDA found in paths: {nvda_paths[0][:80]}")

        print(f"       {len(exposed)} exposed, {len(result.get('supply_chain_paths', []))} paths")
        print(f"       Top 8: {tickers[:8]}")
    test("Graph traverser: Taiwan→exposed companies", t12)

    # ── 13. Full pipeline (end-to-end) ────────────────────────────────
    def t13():
        from agents.pipeline import run_pipeline
        start = time.time()
        result = run_pipeline(
            raw_input="M7.4 earthquake strikes Hualien County, Taiwan. TSMC reports major damage to fabs.",
            source="manual",
        )
        elapsed = time.time() - start

        assert "risks" in result, f"No risks in result: {list(result.keys())}"
        assert len(result["risks"]) >= 3, f"Only {len(result['risks'])} risk scores"
        assert result.get("severity", 0) >= 4

        # NVDA should be high-scored
        nvda_score = result["risks"].get("NVDA", {}).get("score", 0)
        top5 = list(result["risks"].keys())[:5]

        print(f"       {result.get('title')} (sev={result.get('severity')})")
        print(f"       {len(result['risks'])} companies scored in {elapsed:.1f}s")
        print(f"       NVDA score: {nvda_score:.2f}")
        print(f"       Top 5: {top5}")

        if nvda_score < 0.5:
            print(f"       ⚠ NVDA score low — check graph traversal")
    test("FULL PIPELINE: Taiwan earthquake E2E", t13, skip_if_no_llm=True)

    # ── 14. Event persistence ─────────────────────────────────────────
    def t14():
        from db.surreal import get_db
        db = get_db()
        result = db.query("SELECT * FROM event ORDER BY created_at DESC LIMIT 1")
        rows = _extract(result)
        assert rows, "No events persisted"
        evt = rows[0]
        assert evt.get("risks") and len(evt["risks"]) >= 3
        assert evt.get("created_at", "").endswith("Z"), f"created_at doesn't end with Z: {evt.get('created_at')}"
        print(f"       Persisted: {evt.get('title','?')[:50]}")
        print(f"       created_at ends with Z: ✓")
    test("Event persisted to SurrealDB (Write 1)", t14, skip_if_no_llm=True)

    # ── 15. Risk scores persisted ─────────────────────────────────────
    def t15():
        from db.surreal import get_db
        db = get_db()
        result = db.query("SELECT count() FROM risk_score GROUP ALL")
        count = _extract_count(result)
        assert count >= 3, f"Only {count} risk_score records"
        print(f"       {count} risk_score records (Write 2)")
    test("Risk scores persisted (Write 2)", t15, skip_if_no_llm=True)

    # ── Summary ───────────────────────────────────────────────────────
    passed = sum(results)
    total = len(results)
    print(f"\n{'='*65}")
    color = "\033[92m" if passed == total else ("\033[93m" if passed >= total * 0.7 else "\033[91m")
    print(f"  {color}{passed}/{total} PASSED\033[0m")
    if passed == total:
        print(f"  \033[92m🎉 Ready for demo!\033[0m")
    print(f"{'='*65}\n")
    sys.exit(0 if passed == total else 1)


# ── Helpers ───────────────────────────────────────────────────────────────

def _extract(result) -> list[dict]:
    if not isinstance(result, list):
        return []
    rows = []
    for item in result:
        if isinstance(item, dict):
            if "result" in item and isinstance(item["result"], list):
                rows.extend(r for r in item["result"] if isinstance(r, dict))
            elif any(k in item for k in ("ticker", "out", "in", "weight", "title", "country", "count")):
                rows.append(item)
    return rows if rows else [r for r in result if isinstance(r, dict)]


def _extract_count(result) -> int:
    for item in (result if isinstance(result, list) else []):
        if isinstance(item, dict):
            if "count" in item:
                return int(item["count"])
            if "result" in item and isinstance(item["result"], list):
                for r in item["result"]:
                    if isinstance(r, dict) and "count" in r:
                        return int(r["count"])
        if isinstance(item, int):
            return item
    return 0


def _ticker(val) -> str:
    """Extract ticker from RecordID, string, or dict."""
    if hasattr(val, 'id') and not isinstance(val, dict):
        return str(val.id)
    if isinstance(val, str):
        return val.split(":")[-1] if ":" in val else val
    if isinstance(val, dict):
        return (val.get("ticker") or str(val.get("id", ""))).split(":")[-1]
    s = str(val)
    return s.split(":")[-1] if ":" in s else ""


if __name__ == "__main__":
    main()
