import { useState } from "react";

// ── Local Utilities ───────────────────────────────────────────────────────────
const riskColor = (score) => {
  if (score > 0.8) return "#EF4444";
  if (score > 0.6) return "#F97316";
  if (score > 0.4) return "#EAB308";
  if (score > 0.2) return "#22C55E";
  return "#3B82F6";
};

const riskLabel = (score) => {
  if (score > 0.8) return "CRITICAL";
  if (score > 0.6) return "HIGH";
  if (score > 0.4) return "MEDIUM";
  if (score > 0.2) return "LOW";
  return "MINIMAL";
};

// ── PortfolioRisk ─────────────────────────────────────────────────────────────
// Pure content widget — no container chrome (FloatingWidget provides that).
// AI-powered portfolio risk analysis. POST /api/v1/portfolio/risk

const DEFAULT_PORTFOLIO = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "JPM"];

export default function PortfolioRisk({ watchlistTickers }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const customTickers = watchlistTickers ? [...watchlistTickers] : [];
  const tickers = (customTickers.length > 0 ? customTickers : DEFAULT_PORTFOLIO).slice(0, 50);
  const tickerCount = tickers.length;

  async function analyzePortfolio() {
    if (tickerCount === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/portfolio/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAnalysis(json);
    } catch (err) {
      setError(err.message || "ANALYSIS FAILED");
    } finally {
      setLoading(false);
    }
  }

  const hasAnalysis = !!analysis && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Slim toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 10px", borderBottom: "1px solid rgba(59,130,246,0.08)",
        flexShrink: 0,
      }}>
        <span style={{
          color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 1,
        }}>
          {tickerCount} TICKER{tickerCount !== 1 ? "S" : ""}
        </span>
        {hasAnalysis && (
          <button
            onClick={analyzePortfolio}
            style={{
              background: "none", border: "1px solid rgba(59,130,246,0.25)",
              color: "#64748B", borderRadius: 3, padding: "1px 8px",
              fontSize: 7, fontFamily: "JetBrains Mono, monospace",
              letterSpacing: 1, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
              e.currentTarget.style.color = "#93C5FD";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)";
              e.currentTarget.style.color = "#64748B";
            }}
          >REFRESH</button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

        {/* Loading */}
        {loading && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 0", justifyContent: "center",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#3B82F6", boxShadow: "0 0 10px rgba(59,130,246,0.7)",
              animation: "pulse 0.7s infinite",
            }} />
            <span style={{
              color: "#3B82F6", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
              letterSpacing: 1,
            }}>
              ANALYSING {tickerCount} TICKERS...
            </span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            padding: "8px 10px", background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4,
            marginBottom: 8,
          }}>
            <span style={{
              color: "#EF4444", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
            }}>
              ERROR: {error}
            </span>
          </div>
        )}

        {/* Empty / pre-analysis state */}
        {!loading && !hasAnalysis && (
          <div style={{ textAlign: "center", paddingBottom: 4 }}>
            <button
              onClick={analyzePortfolio}
              style={{
                background: "rgba(29,78,216,0.15)", border: "1px solid rgba(59,130,246,0.35)",
                color: "#93C5FD", borderRadius: 4, padding: "7px 14px",
                fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                letterSpacing: 1, cursor: "pointer", fontWeight: 700,
                transition: "all 0.15s", marginTop: 4,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(29,78,216,0.25)";
                e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(29,78,216,0.15)";
                e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)";
              }}
            >
              ANALYZE {tickerCount} TICKER{tickerCount !== 1 ? "S" : ""}
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {hasAnalysis && (
          <div>
            {/* Score + Level */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{
                color: riskColor(analysis.portfolio_score ?? 0),
                fontSize: 28, fontFamily: "JetBrains Mono, monospace",
                fontWeight: 800, lineHeight: 1,
              }}>
                {Math.round((analysis.portfolio_score ?? 0) * 100)}%
              </span>
              <div>
                <div style={{
                  color: riskColor(analysis.portfolio_score ?? 0),
                  fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700, letterSpacing: 1, marginBottom: 2,
                }}>
                  {analysis.risk_level || riskLabel(analysis.portfolio_score ?? 0)}
                </div>
                <div style={{
                  color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                }}>PORTFOLIO RISK</div>
              </div>
            </div>

            {/* Score bar */}
            <div style={{
              height: 3, background: "rgba(15,23,42,0.8)", borderRadius: 2,
              overflow: "hidden", marginBottom: 10,
            }}>
              <div style={{
                width: `${Math.round((analysis.portfolio_score ?? 0) * 100)}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${riskColor(analysis.portfolio_score ?? 0)}60, ${riskColor(analysis.portfolio_score ?? 0)})`,
                borderRadius: 2, transition: "width 0.8s ease",
              }} />
            </div>

            {/* Reasoning */}
            {analysis.reasoning && (
              <div style={{
                color: "#94A3B8", fontSize: 9, lineHeight: 1.6, marginBottom: 10,
                padding: "7px 9px", background: "rgba(15,23,42,0.5)", borderRadius: 4,
                borderLeft: "3px solid rgba(59,130,246,0.35)",
              }}>
                {analysis.reasoning}
              </div>
            )}

            {/* Sector breakdown */}
            {analysis.sector_breakdown && Object.keys(analysis.sector_breakdown).length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{
                  color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: 2, marginBottom: 5,
                }}>SECTOR EXPOSURE</div>
                {Object.entries(analysis.sector_breakdown).map(([sector, val]) => {
                  const score = typeof val === "object" ? (val.score ?? 0) : (val ?? 0);
                  return (
                    <div key={sector} style={{
                      display: "flex", alignItems: "center", gap: 8, marginBottom: 3,
                    }}>
                      <span style={{
                        color: "#64748B", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                        minWidth: 70, flexShrink: 0,
                      }}>{String(sector).toUpperCase().slice(0, 8)}</span>
                      <div style={{
                        flex: 1, height: 3, background: "rgba(15,23,42,0.8)",
                        borderRadius: 2, overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${Math.round(score * 100)}%`, height: "100%",
                          background: riskColor(score), borderRadius: 2,
                        }} />
                      </div>
                      <span style={{
                        color: riskColor(score), fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                        minWidth: 28, textAlign: "right", flexShrink: 0,
                      }}>{Math.round(score * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vulnerabilities */}
            {analysis.supply_chain_vulnerabilities && analysis.supply_chain_vulnerabilities.length > 0 && (
              <div>
                <div style={{
                  color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: 2, marginBottom: 5,
                }}>KEY VULNERABILITIES</div>
                {analysis.supply_chain_vulnerabilities.map((vuln, i) => (
                  <div key={i} style={{
                    padding: "5px 8px", marginBottom: 3, borderRadius: 3,
                    background: "rgba(239,68,68,0.06)",
                    borderLeft: "2px solid rgba(239,68,68,0.4)",
                    color: "#94A3B8", fontSize: 9, lineHeight: 1.5,
                  }}>
                    {vuln}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
