import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const STORAGE_KEY = "riskterrain-tracker-favorites";
const MAX_FAVORITES = 15;
const YAHOO_URL = "https://finance.yahoo.com/quote/";

const riskColor = (score) => {
  if (score >= 0.8) return "#EF4444";
  if (score >= 0.6) return "#F97316";
  if (score >= 0.4) return "#EAB308";
  if (score >= 0.2) return "#22C55E";
  return "#3B82F6";
};

const riskLbl = (score) => {
  if (score >= 0.8) return "CRIT";
  if (score >= 0.6) return "HIGH";
  if (score >= 0.4) return "MED";
  if (score >= 0.2) return "LOW";
  return "";
};

export default function CustomTracker({ events = [], companies = [] }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_FAVORITES);
      }
    } catch { /* ignore */ }
    return [];
  });
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const intervalRef = useRef(null);
  const searchRef = useRef(null);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    if (favorites.length === 0) { setMarketData({}); return; }
    setLoading(true);
    try {
      const query = favorites.join(",");
      const res = await fetch(`/api/v1/market-data?tickers=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const map = {};
      if (Array.isArray(json)) json.forEach(q => { map[q.ticker] = q; });
      setMarketData(map);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [favorites]);

  useEffect(() => {
    fetchMarketData();
    intervalRef.current = setInterval(fetchMarketData, 60_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchMarketData]);

  // Risk scores from events
  const riskScores = useMemo(() => {
    const scores = {};
    favorites.forEach(ticker => {
      let max = 0;
      events.forEach(evt => {
        const r = evt.risks?.[ticker];
        if (r && r.score > max) max = r.score;
      });
      scores[ticker] = max;
    });
    return scores;
  }, [favorites, events]);

  // Search autocomplete
  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toUpperCase();
    return companies
      .filter(c =>
        (c.ticker.includes(q) || c.name.toUpperCase().includes(q)) &&
        !favorites.includes(c.ticker)
      )
      .slice(0, 5);
  }, [search, companies, favorites]);

  const addFavorite = useCallback((ticker) => {
    setFavorites(prev => {
      if (prev.includes(ticker) || prev.length >= MAX_FAVORITES) return prev;
      return [...prev, ticker];
    });
    setSearch("");
    setSearchFocused(false);
  }, []);

  const removeFavorite = useCallback((ticker) => {
    setFavorites(prev => prev.filter(t => t !== ticker));
  }, []);

  // Close autocomplete on outside click
  useEffect(() => {
    if (!searchFocused) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchFocused]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 10px", borderBottom: "1px solid rgba(59,130,246,0.08)",
        flexShrink: 0,
      }}>
        <span style={{
          color: favorites.length >= MAX_FAVORITES ? "#F59E0B" : "#475569",
          fontSize: 8, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 1, fontWeight: 700,
        }}>
          {favorites.length}/{MAX_FAVORITES} TRACKED
        </span>
        {loading && (
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "#22C55E", animation: "pulse 0.6s infinite",
          }} />
        )}
      </div>

      {/* Search bar */}
      <div ref={searchRef} style={{
        padding: "6px 10px", borderBottom: "1px solid rgba(59,130,246,0.08)",
        position: "relative", flexShrink: 0,
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={(e) => {
            setSearchFocused(true);
            e.target.style.borderColor = "rgba(245,158,11,0.5)";
          }}
          onBlur={e => { e.target.style.borderColor = "rgba(59,130,246,0.15)"; }}
          placeholder="Search ticker or name..."
          style={{
            width: "100%", background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(59,130,246,0.15)",
            color: "#F8FAFC", borderRadius: 3, padding: "5px 8px",
            fontSize: 9, fontFamily: "JetBrains Mono, monospace",
            outline: "none", boxSizing: "border-box",
          }}
        />
        {/* Autocomplete dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div style={{
            position: "absolute", left: 10, right: 10, top: "100%",
            background: "rgba(8,13,26,0.98)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 4, zIndex: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}>
            {searchResults.map(c => (
              <div key={c.ticker}
                onMouseDown={(e) => { e.preventDefault(); addFavorite(c.ticker); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 10px", cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ color: "#F8FAFC", fontSize: 9,
                  fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
                  minWidth: 40 }}>{c.ticker}</span>
                <span style={{ color: "#475569", fontSize: 8,
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", flex: 1 }}>{c.name}</span>
                <span style={{ color: "#334155", fontSize: 7,
                  fontFamily: "JetBrains Mono, monospace",
                  flexShrink: 0 }}>{c.sector}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tracked stocks list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
        {favorites.length === 0 ? (
          <div style={{
            padding: "22px 12px", textAlign: "center", color: "#334155",
            fontSize: 9, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
          }}>
            SEARCH AND ADD STOCKS TO TRACK
          </div>
        ) : (
          favorites.map(ticker => {
            const quote = marketData[ticker];
            const risk = riskScores[ticker] || 0;
            const changePct = quote?.change_pct;
            const isPositive = changePct != null && changePct >= 0;
            const changeColor = changePct == null ? "#475569"
              : isPositive ? "#22C55E" : "#EF4444";

            return (
              <div key={ticker} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Ticker — clickable to Yahoo Finance */}
                <span
                  onClick={() => window.open(`${YAHOO_URL}${ticker}`, "_blank")}
                  style={{
                    color: "#F59E0B", fontSize: 9,
                    fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700, minWidth: 40, flexShrink: 0,
                    cursor: "pointer", transition: "color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#FBBF24"}
                  onMouseLeave={e => e.currentTarget.style.color = "#F59E0B"}
                  title={`View ${ticker} on Yahoo Finance`}
                >{ticker}</span>

                <span style={{ color: "#1E293B", fontSize: 9 }}>|</span>

                {/* Price */}
                <span style={{
                  color: "#E2E8F0", fontSize: 9,
                  fontFamily: "JetBrains Mono, monospace", minWidth: 52,
                }}>
                  {quote ? `$${typeof quote.price === "number" ? quote.price.toFixed(2) : quote.price}` : "--"}
                </span>

                <span style={{ color: "#1E293B", fontSize: 9 }}>|</span>

                {/* 1D change */}
                <span style={{
                  color: changeColor, fontSize: 8,
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700, minWidth: 44, textAlign: "right",
                }}>
                  {changePct != null
                    ? `${isPositive ? "+" : ""}${typeof changePct === "number" ? changePct.toFixed(2) : changePct}%`
                    : "--"}
                </span>

                {/* Risk indicator */}
                {risk > 0 ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 3,
                    marginLeft: "auto", flexShrink: 0,
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: riskColor(risk),
                      boxShadow: `0 0 4px ${riskColor(risk)}80`,
                    }} />
                    <span style={{
                      color: riskColor(risk), fontSize: 7,
                      fontFamily: "JetBrains Mono, monospace",
                      fontWeight: 700, minWidth: 30,
                    }}>{Math.round(risk * 100)}% {riskLbl(risk)}</span>
                  </div>
                ) : (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 3,
                    marginLeft: "auto", flexShrink: 0,
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "#1E293B",
                    }} />
                    <span style={{
                      color: "#1E293B", fontSize: 7,
                      fontFamily: "JetBrains Mono, monospace",
                      minWidth: 30,
                    }}>SAFE</span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeFavorite(ticker)}
                  style={{
                    background: "none", border: "none", color: "#334155",
                    cursor: "pointer", fontSize: 11, lineHeight: 1,
                    padding: "0 2px", flexShrink: 0, transition: "color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                  onMouseLeave={e => e.currentTarget.style.color = "#334155"}
                >&times;</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
