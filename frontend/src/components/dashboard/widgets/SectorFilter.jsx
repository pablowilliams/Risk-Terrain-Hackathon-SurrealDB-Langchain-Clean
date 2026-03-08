import { useState, useMemo } from "react";

// ── Sector abbreviations ─────────────────────────────────────────────────────
const SECTOR_SHORT = {
  'Technology': 'TECH', 'Financials': 'FIN', 'Healthcare': 'HC',
  'Energy': 'ENRG', 'Consumer Disc': 'DISC', 'Consumer Staples': 'STPL',
  'Industrials': 'IND', 'Communication': 'COMM', 'Materials': 'MATL',
  'Utilities': 'UTIL', 'Real Estate': 'RE',
};

// ── SectorFilter ─────────────────────────────────────────────────────────────
// Floating filter widget: sector checkboxes + individual ticker toggles + search.
// Props:
//   companies:          Company[]
//   watchlistTickers:   Set<string>
//   watchlistMode:      "all" | "custom"
//   onToggleSector:     (tickers: string[]) => void
//   onToggleTicker:     (ticker: string) => void
//   onReset:            () => void

const MAX_TICKERS = 30;

export default function SectorFilter({
  companies = [],
  watchlistTickers = new Set(),
  watchlistMode = "all",
  onToggleSector,
  onToggleTicker,
  onReset,
}) {
  const [search, setSearch] = useState("");
  const [expandedSector, setExpandedSector] = useState(null);

  // Group companies by sector
  const sectors = useMemo(() => {
    const map = {};
    companies.forEach(c => {
      if (!map[c.sector]) map[c.sector] = [];
      map[c.sector].push(c);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [companies]);

  // Search results
  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toUpperCase();
    return companies
      .filter(c => c.ticker.includes(q) || c.name.toUpperCase().includes(q))
      .slice(0, 8);
  }, [search, companies]);

  const selectedCount = watchlistTickers.size;
  const isAll = watchlistMode === "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Summary + Reset */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 10px", borderBottom: "1px solid rgba(59,130,246,0.12)",
      }}>
        <span style={{
          color: isAll ? "#64748B" : selectedCount >= MAX_TICKERS ? "#F59E0B" : "#C4B5FD",
          fontSize: 9, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 1, fontWeight: 700,
        }}>
          {isAll ? "ALL COMPANIES" : `${selectedCount}/${MAX_TICKERS} SELECTED`}
        </span>
        {!isAll && (
          <button onClick={onReset} style={{
            background: "none", border: "1px solid rgba(139,92,246,0.3)",
            color: "#A78BFA", borderRadius: 3, padding: "2px 8px",
            fontSize: 7, fontFamily: "JetBrains Mono, monospace",
            letterSpacing: 1, cursor: "pointer", fontWeight: 700,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)"; e.currentTarget.style.color = "#C4B5FD"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)"; e.currentTarget.style.color = "#A78BFA"; }}
          >RESET</button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid rgba(59,130,246,0.08)" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ticker or name..."
          style={{
            width: "100%", background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(59,130,246,0.15)",
            color: "#F8FAFC", borderRadius: 3, padding: "5px 8px",
            fontSize: 9, fontFamily: "JetBrains Mono, monospace",
            outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(59,130,246,0.15)"}
        />
      </div>

      {/* Content: search results or sector list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {/* Search results */}
        {search && searchResults.length > 0 && (
          <div style={{ padding: "0 6px 6px" }}>
            <div style={{
              color: "#475569", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
              letterSpacing: 2, padding: "4px 6px",
            }}>SEARCH RESULTS</div>
            {searchResults.map(c => {
              const selected = watchlistTickers.has(c.ticker);
              return (
                <div key={c.ticker} onClick={() => onToggleTicker(c.ticker)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 6px", cursor: "pointer", borderRadius: 3,
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: 2, flexShrink: 0,
                    border: `1px solid ${selected ? "#8B5CF6" : "rgba(100,116,139,0.3)"}`,
                    background: selected ? "rgba(139,92,246,0.25)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: "#C4B5FD", fontWeight: 800,
                  }}>{selected ? "\u2713" : ""}</div>
                  <span style={{
                    color: selected ? "#C4B5FD" : "#F8FAFC", fontSize: 9,
                    fontFamily: "JetBrains Mono, monospace", fontWeight: 700, minWidth: 36,
                  }}>{c.ticker}</span>
                  <span style={{
                    color: "#475569", fontSize: 7.5, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{c.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* No search results */}
        {search && searchResults.length === 0 && (
          <div style={{
            color: "#334155", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
            textAlign: "center", padding: "12px 0", letterSpacing: 1,
          }}>NO MATCHES</div>
        )}

        {/* Sector checkboxes (shown when not searching) */}
        {!search && sectors.map(([sector, sectorCompanies]) => {
          const tickers = sectorCompanies.map(c => c.ticker);
          const allSelected = tickers.every(t => watchlistTickers.has(t));
          const someSelected = tickers.some(t => watchlistTickers.has(t));
          const selectedInSector = tickers.filter(t => watchlistTickers.has(t)).length;
          const isExpanded = expandedSector === sector;
          const shortName = SECTOR_SHORT[sector] || sector;

          return (
            <div key={sector}>
              {/* Sector row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 10px", cursor: "pointer",
                transition: "background 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Checkbox */}
                <div onClick={(e) => { e.stopPropagation(); onToggleSector(tickers); }} style={{
                  width: 13, height: 13, borderRadius: 2, flexShrink: 0,
                  border: `1px solid ${allSelected ? "#8B5CF6" : someSelected ? "rgba(139,92,246,0.5)" : "rgba(100,116,139,0.3)"}`,
                  background: allSelected ? "rgba(139,92,246,0.3)" : someSelected ? "rgba(139,92,246,0.1)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#C4B5FD", fontWeight: 800, cursor: "pointer",
                }}>{allSelected ? "\u2713" : someSelected ? "\u2013" : ""}</div>

                {/* Label + expand toggle */}
                <div onClick={() => setExpandedSector(isExpanded ? null : sector)}
                  style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    color: allSelected ? "#C4B5FD" : someSelected ? "#A78BFA" : "#94A3B8",
                    fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700, letterSpacing: 0.5,
                  }}>{shortName}</span>
                  <span style={{
                    color: "#475569", fontSize: 7.5, fontFamily: "JetBrains Mono, monospace",
                  }}>
                    {someSelected && !allSelected ? `${selectedInSector}/` : ""}{tickers.length}
                  </span>
                  <span style={{
                    color: "#334155", fontSize: 8, marginLeft: "auto",
                    transform: isExpanded ? "rotate(90deg)" : "none",
                    transition: "transform 0.15s",
                  }}>{"\u25B6"}</span>
                </div>
              </div>

              {/* Expanded ticker list */}
              {isExpanded && (
                <div style={{
                  padding: "2px 10px 6px 28px",
                  display: "flex", flexWrap: "wrap", gap: 3,
                }}>
                  {sectorCompanies.map(c => {
                    const selected = watchlistTickers.has(c.ticker);
                    return (
                      <button key={c.ticker} onClick={() => onToggleTicker(c.ticker)} style={{
                        background: selected ? "rgba(139,92,246,0.2)" : "rgba(15,23,42,0.6)",
                        border: `1px solid ${selected ? "rgba(139,92,246,0.45)" : "rgba(59,130,246,0.1)"}`,
                        color: selected ? "#C4B5FD" : "#64748B",
                        padding: "2px 6px", borderRadius: 3, cursor: "pointer",
                        fontSize: 7.5, fontFamily: "JetBrains Mono, monospace",
                        fontWeight: selected ? 700 : 400, transition: "all 0.1s",
                      }}
                        onMouseEnter={e => {
                          if (!selected) {
                            e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)";
                            e.currentTarget.style.color = "#94A3B8";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!selected) {
                            e.currentTarget.style.borderColor = "rgba(59,130,246,0.1)";
                            e.currentTarget.style.color = "#64748B";
                          }
                        }}
                      >{c.ticker}</button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active tickers strip at bottom */}
      {selectedCount > 0 && (
        <div style={{
          borderTop: "1px solid rgba(139,92,246,0.15)",
          padding: "6px 8px",
          display: "flex", flexWrap: "wrap", gap: 3,
          maxHeight: 60, overflowY: "auto",
        }}>
          {[...watchlistTickers].map(ticker => (
            <span key={ticker} style={{
              display: "flex", alignItems: "center", gap: 3,
              background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
              color: "#C4B5FD", padding: "2px 5px", borderRadius: 3,
              fontSize: 7, fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
            }}>
              {ticker}
              <span onClick={() => onToggleTicker(ticker)}
                style={{ cursor: "pointer", color: "#8B5CF6", fontSize: 9, lineHeight: 1 }}>
                x
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
