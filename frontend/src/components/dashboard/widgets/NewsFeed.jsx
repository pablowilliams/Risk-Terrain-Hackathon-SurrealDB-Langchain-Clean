import { useState, useEffect, useRef } from "react";

// ── NewsFeed ──────────────────────────────────────────────────────────────────
// Pure content widget — no container chrome (FloatingWidget provides that).
// Fetches live news filtered by watchlist tickers.
// GET /api/v1/news?tickers=AAPL,NVDA,...
// Auto-refreshes every 2 minutes.

const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  return `${Math.floor(hrs / 24)}D AGO`;
}

export default function NewsFeed({ watchlistTickers }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const tickers = watchlistTickers ? [...watchlistTickers] : [];
  const isEmpty = tickers.length === 0;

  async function fetchNews() {
    if (tickers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const query = tickers.join(",");
      const res = await fetch(`/api/v1/news?tickers=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setArticles(Array.isArray(json) ? json : (json.articles ?? []));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "FETCH FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
    intervalRef.current = setInterval(fetchNews, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlistTickers]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Slim status bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 10px", borderBottom: "1px solid rgba(59,130,246,0.08)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isEmpty && articles.length > 0 && (
            <span style={{
              color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
            }}>
              {articles.length} ARTICLE{articles.length !== 1 ? "S" : ""}
            </span>
          )}
          {lastUpdated && !isEmpty && (
            <span style={{
              color: "#334155", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
            }}>
              {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        {loading && (
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "#22C55E", animation: "pulse 0.6s infinite",
          }} />
        )}
      </div>

      {/* Articles */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isEmpty ? (
          <div style={{
            padding: "22px 12px", textAlign: "center", color: "#334155",
            fontSize: 9, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
          }}>
            SELECT TICKERS TO VIEW NEWS
          </div>
        ) : error ? (
          <div style={{
            padding: "10px 12px", color: "#EF4444", fontSize: 9,
            fontFamily: "JetBrains Mono, monospace",
          }}>
            ERROR: {error}
          </div>
        ) : articles.length === 0 && !loading ? (
          <div style={{
            padding: "16px 12px", textAlign: "center", color: "#475569",
            fontSize: 9, fontFamily: "JetBrains Mono, monospace",
          }}>
            NO ARTICLES FOUND
          </div>
        ) : (
          articles.map((article, i) => (
            <a
              key={article.url || i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", padding: "8px 12px",
                borderBottom: "1px solid rgba(59,130,246,0.07)",
                textDecoration: "none", transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {/* Source + tickers + date */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
              }}>
                <span style={{
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                  color: "#93C5FD", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
                  padding: "1px 5px", borderRadius: 3, fontWeight: 700,
                  letterSpacing: 0.5, flexShrink: 0,
                }}>
                  {article.source || "UNKNOWN"}
                </span>
                {article.tickers && article.tickers.slice(0, 3).map(t => (
                  <span key={t} style={{
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                    color: "#C4B5FD", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
                    padding: "1px 4px", borderRadius: 3, fontWeight: 700, flexShrink: 0,
                  }}>{t}</span>
                ))}
                <div style={{ flex: 1 }} />
                {article.published_at && (
                  <span style={{
                    color: "#475569", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
                    flexShrink: 0,
                  }}>
                    {timeAgo(article.published_at)}
                  </span>
                )}
                <span style={{ color: "#334155", fontSize: 9, flexShrink: 0 }}>&#x2197;</span>
              </div>
              {/* Title */}
              <div style={{
                color: "#94A3B8", fontSize: 9, lineHeight: 1.5, overflow: "hidden",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {article.title}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
