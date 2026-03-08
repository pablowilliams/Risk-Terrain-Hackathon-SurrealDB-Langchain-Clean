import { useState, useEffect, useRef } from "react";

// ── MarketTicker ──────────────────────────────────────────────────────────────
// Pure content widget — no container chrome (FloatingWidget provides that).
// Fetches live stock prices from GET /api/v1/market-data?tickers=...
// Shows 1D / 7D / 30D change. Auto-refreshes every 60 seconds.

const DEFAULT_TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "JPM"];
const TIMEFRAMES = [
  { key: "1d", label: "1D", field: "changePct" },
  { key: "7d", label: "7D", field: "change7d" },
  { key: "30d", label: "30D", field: "change30d" },
];

export default function MarketTicker({ watchlistTickers }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeframe, setTimeframe] = useState("1d");
  const intervalRef = useRef(null);

  const customTickers = watchlistTickers ? [...watchlistTickers] : [];
  const tickers = (customTickers.length > 0 ? customTickers : DEFAULT_TICKERS).slice(0, 50);

  async function fetchMarketData() {
    if (tickers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const query = tickers.join(",");
      const res = await fetch(`/api/v1/market-data?tickers=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const map = {};
      if (Array.isArray(json)) {
        json.forEach(q => {
          map[q.ticker] = {
            price: q.price,
            change: q.change,
            changePct: q.change_pct,
            change7d: q.change_7d,
            change30d: q.change_30d,
          };
        });
      }
      setData(map);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "FETCH FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMarketData();
    intervalRef.current = setInterval(fetchMarketData, 60_000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlistTickers]);

  const activeTimeframe = TIMEFRAMES.find(t => t.key === timeframe) || TIMEFRAMES[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar: timestamp + timeframe pills */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 10px", borderBottom: "1px solid rgba(59,130,246,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {lastUpdated && (
            <span style={{ color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}>
              {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          {loading && (
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "#22C55E", animation: "pulse 0.6s infinite",
            }} />
          )}
        </div>
        {/* Timeframe pills */}
        <div style={{ display: "flex", gap: 2 }}>
          {TIMEFRAMES.map(tf => {
            const isActive = timeframe === tf.key;
            return (
              <button key={tf.key} onClick={() => setTimeframe(tf.key)} style={{
                background: isActive ? "rgba(59,130,246,0.2)" : "transparent",
                border: `1px solid ${isActive ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.1)"}`,
                color: isActive ? "#93C5FD" : "#475569",
                borderRadius: 3, padding: "1px 6px", cursor: "pointer",
                fontSize: 7, fontFamily: "JetBrains Mono, monospace",
                fontWeight: isActive ? 700 : 400, letterSpacing: 0.5,
                transition: "all 0.15s",
              }}>{tf.label}</button>
            );
          })}
        </div>
      </div>

      {/* Ticker rows */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
        {error ? (
          <div style={{
            padding: "10px 12px", color: "#EF4444", fontSize: 9,
            fontFamily: "JetBrains Mono, monospace",
          }}>
            ERROR: {error}
          </div>
        ) : tickers.length > 0 && Object.keys(data).length === 0 && !loading ? (
          <div style={{
            padding: "14px 12px", textAlign: "center", color: "#475569",
            fontSize: 9, fontFamily: "JetBrains Mono, monospace",
          }}>
            NO DATA
          </div>
        ) : (
          tickers.map((ticker) => {
            const entry = data[ticker];
            if (!entry) {
              return (
                <div key={ticker} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "4px 12px",
                }}>
                  <span style={{
                    color: "#475569", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700, minWidth: 44,
                  }}>{ticker}</span>
                  <span style={{ color: "#334155", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>
                    —
                  </span>
                </div>
              );
            }

            const changePctValue = entry[activeTimeframe.field];
            const hasValue = changePctValue != null;
            const isPositive = hasValue && changePctValue >= 0;
            const changeColor = !hasValue ? "#475569" : isPositive ? "#22C55E" : "#EF4444";
            const changeSign = hasValue && isPositive ? "+" : "";

            return (
              <div key={ticker} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "3px 12px", transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span
                  onClick={() => window.open(`https://finance.yahoo.com/quote/${ticker}`, "_blank")}
                  style={{
                    color: "#F8FAFC", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700, minWidth: 44, flexShrink: 0, cursor: "pointer",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#F59E0B"}
                  onMouseLeave={e => e.currentTarget.style.color = "#F8FAFC"}
                  title={`View ${ticker} on Yahoo Finance`}
                >{ticker}</span>
                <span style={{ color: "#1E293B", fontSize: 9 }}>|</span>
                <span style={{
                  color: "#E2E8F0", fontSize: 9, fontFamily: "JetBrains Mono, monospace", flex: 1,
                }}>
                  ${typeof entry.price === "number" ? entry.price.toFixed(2) : entry.price}
                </span>
                <span style={{ color: "#1E293B", fontSize: 9 }}>|</span>
                <span style={{
                  color: changeColor, fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700, minWidth: 54, textAlign: "right", flexShrink: 0,
                }}>
                  {hasValue
                    ? `${changeSign}${typeof changePctValue === "number" ? changePctValue.toFixed(2) : changePctValue}%`
                    : "—"
                  }
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
