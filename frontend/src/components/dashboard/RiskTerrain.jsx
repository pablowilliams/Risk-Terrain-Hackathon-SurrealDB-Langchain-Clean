import { useState, useEffect, useRef, useCallback } from "react";
import Globe3D from "../Globe3D";
import { SP500_SAMPLE as SHARED_COMPANIES, RELATIONSHIP_COLORS } from "../../data/mockData";
import SupplyChainPanel from "./SupplyChainPanel";

// Use shared company data (155 companies including international)
const SP500_SAMPLE = SHARED_COMPANIES;

// ── Utilities ─────────────────────────────────────────────────────────────────
const riskColor = (score) => {
  if (score >= 0.8) return "#EF4444";
  if (score >= 0.6) return "#F97316";
  if (score >= 0.4) return "#EAB308";
  if (score >= 0.2) return "#22C55E";
  return "#3B82F6";
};

const riskLabel = (score) => {
  if (score >= 0.8) return "CRITICAL";
  if (score >= 0.6) return "HIGH";
  if (score >= 0.4) return "MEDIUM";
  if (score >= 0.2) return "LOW";
  return "MINIMAL";
};

const severityColor = (s) => ["","#22C55E","#84CC16","#EAB308","#F97316","#EF4444"][s] || "#64748B";

const timeAgo = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins/60)}h ${mins%60}m ago`;
};

// ── Event Feed ────────────────────────────────────────────────────────────────
function EventFeed({ events, activeEvent, onEventSelect, onTrigger, processing }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: processing ? "#22C55E" : "#3B82F6",
            boxShadow: processing ? "0 0 8px #22C55E" : "none",
            animation: processing ? "pulse 1s infinite" : "none" }} />
          <span style={{ color: "#94A3B8", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2 }}>
            {processing ? "PROCESSING EVENT" : "MONITOR ACTIVE"}
          </span>
        </div>
        <div style={{ color: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>
          SIMULATE EVENT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { label: "M7.4 TAIWAN EARTHQUAKE", idx: 0, color: "#EF4444" },
            { label: "US-CHINA EXPORT CONTROLS", idx: 1, color: "#F97316" },
            { label: "FED RATE HIKE +75BPS", idx: 2, color: "#EAB308" },
          ].map(({ label, idx, color }) => (
            <button key={idx} onClick={() => onTrigger(idx)}
              style={{
                background: "rgba(15,23,42,0.8)", border: `1px solid ${color}40`,
                color: color, borderRadius: 4, padding: "6px 10px",
                fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.background = `${color}15`; e.target.style.borderColor = color; }}
              onMouseLeave={e => { e.target.style.background = "rgba(15,23,42,0.8)"; e.target.style.borderColor = `${color}40`; }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 16px 6px" }}>
        <div style={{ color: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2 }}>
          EVENT FEED — {events.length} DETECTED
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
        {events.map(event => {
          const isActive = activeEvent?.id === event.id;
          return (
            <div key={event.id} onClick={() => onEventSelect(event)}
              style={{
                padding: "10px 12px", marginBottom: 4, borderRadius: 6, cursor: "pointer",
                background: isActive ? "rgba(29,78,216,0.15)" : "rgba(15,23,42,0.5)",
                border: `1px solid ${isActive ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.1)"}`,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(29,78,216,0.08)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "rgba(15,23,42,0.5)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: severityColor(event.severity),
                    boxShadow: `0 0 6px ${severityColor(event.severity)}` }} />
                  <span style={{ color: "#F8FAFC", fontSize: 10, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>
                    {event.title}
                  </span>
                </div>
                <span style={{ color: "#475569", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>
                  {timeAgo(event.created_at)}
                </span>
              </div>
              <div style={{ color: "#64748B", fontSize: 9, lineHeight: 1.5, marginBottom: 4 }}>
                {event.description.slice(0, 90)}...
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {event.affected_countries.map(c => (
                  <span key={c} style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5",
                    fontSize: 8, padding: "1px 5px", borderRadius: 3, fontFamily: "JetBrains Mono, monospace" }}>
                    {c}
                  </span>
                ))}
                {event.affected_sectors.map(s => (
                  <span key={s} style={{ background: "rgba(59,130,246,0.1)", color: "#93C5FD",
                    fontSize: 8, padding: "1px 5px", borderRadius: 3, fontFamily: "JetBrains Mono, monospace" }}>
                    {s}
                  </span>
                ))}
                {event.news_articles && event.news_articles.length > 0 && (
                  <span style={{ background: "rgba(34,197,94,0.1)", color: "#86EFAC",
                    fontSize: 8, padding: "1px 5px", borderRadius: 3, fontFamily: "JetBrains Mono, monospace" }}>
                    {event.news_articles.length} SOURCES
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div style={{ textAlign: "center", color: "#334155", padding: "30px 0", fontSize: 10,
            fontFamily: "JetBrains Mono, monospace" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6",
              margin: "0 auto 10px", animation: "pulse 2s infinite" }} />
            AWAITING SIGNAL<br />
            <span style={{ fontSize: 9, color: "#1E293B" }}>MONITORING GDELT + USGS + NEWSAPI</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Risk Panel ────────────────────────────────────────────────────────────────
function RiskPanel({ event, onClose, supplyChainEdges = [] }) {
  const sorted = Object.entries(event.risks).sort((a, b) => b[1].score - a[1].score);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), 600);
    return () => clearTimeout(t);
  }, [event.id]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "none",
      transition: "all 0.4s ease",
    }}>
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%",
                background: severityColor(event.severity),
                boxShadow: `0 0 10px ${severityColor(event.severity)}` }} />
              <span style={{ color: "#F8FAFC", fontSize: 12, fontWeight: 800,
                fontFamily: "JetBrains Mono, monospace" }}>
                {event.title}
              </span>
            </div>
            <div style={{ color: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>
              SOURCE: {event.source} · SEV: {event.severity}/5 · {timeAgo(event.created_at)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid rgba(100,116,139,0.3)",
            color: "#64748B", cursor: "pointer", borderRadius: 4,
            width: 24, height: 24, fontSize: 12, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
        <div style={{ marginTop: 8, color: "#94A3B8", fontSize: 9.5, lineHeight: 1.6,
          background: "rgba(15,23,42,0.5)", padding: "8px 10px", borderRadius: 4,
          borderLeft: "3px solid rgba(59,130,246,0.4)" }}>
          {event.description}
        </div>

        {/* News Sources */}
        {event.news_articles && event.news_articles.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: "#64748B", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
              letterSpacing: 2, marginBottom: 4 }}>SOURCES</div>
            {event.news_articles.slice(0, 5).map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 3,
                  padding: "4px 8px", borderRadius: 3,
                  background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.1)",
                  textDecoration: "none", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.12)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.05)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.1)"; }}
              >
                <span style={{ color: "#3B82F6", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700, minWidth: 50, flexShrink: 0 }}>
                  {article.source}
                </span>
                <span style={{ color: "#93C5FD", fontSize: 8.5, lineHeight: 1.3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {article.title}
                </span>
                <span style={{ color: "#475569", fontSize: 10, flexShrink: 0, marginLeft: "auto" }}>&#x2197;</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "8px 16px 4px" }}>
        <div style={{ color: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 2, marginBottom: 6 }}>
          EXPOSURE ANALYSIS — {sorted.length} COMPANIES FLAGGED
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["CRITICAL","#EF4444"], ["HIGH","#F97316"], ["MEDIUM","#EAB308"]].map(([label, color]) => {
            const count = sorted.filter(([,v]) => riskLabel(v.score) === label).length;
            return (
              <div key={label} style={{ flex: 1, textAlign: "center", padding: "4px 0",
                background: `${color}10`, borderRadius: 4, border: `1px solid ${color}30` }}>
                <div style={{ color, fontSize: 14, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>{count}</div>
                <div style={{ color, fontSize: 7, letterSpacing: 1 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
        {sorted.map(([ticker, data], i) => {
          const color = riskColor(data.score);
          const pct = Math.round(data.score * 100);
          return (
            <div key={ticker} style={{
              padding: "8px 12px", marginBottom: 3, borderRadius: 5,
              background: "rgba(15,23,42,0.6)",
              border: `1px solid ${color}20`,
              animation: `slideIn 0.3s ease ${i * 0.04}s both`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ color: "#F8FAFC", fontSize: 11, fontWeight: 800,
                  fontFamily: "JetBrains Mono, monospace", minWidth: 50 }}>
                  {ticker}
                </span>
                <div style={{ flex: 1, height: 4, background: "rgba(15,23,42,0.8)",
                  borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%",
                    background: `linear-gradient(90deg, ${color}80, ${color})`,
                    borderRadius: 2, transition: "width 0.8s ease",
                  }} />
                </div>
                <span style={{ color, fontSize: 11, fontWeight: 800,
                  fontFamily: "JetBrains Mono, monospace", minWidth: 36, textAlign: "right" }}>
                  {pct}%
                </span>
                <span style={{ color, fontSize: 7, fontFamily: "JetBrains Mono, monospace",
                  minWidth: 48, letterSpacing: 0.5 }}>
                  {riskLabel(data.score)}
                </span>
              </div>
              <div style={{ color: "#64748B", fontSize: 8.5, lineHeight: 1.5 }}>
                {data.reasoning}
              </div>
            </div>
          );
        })}

        {/* Disrupted Supply Chain section */}
        {supplyChainEdges.length > 0 && (() => {
          const affectedTickers = Object.keys(event.risks);
          const disrupted = supplyChainEdges.filter(e =>
            affectedTickers.includes(e.from_ticker) || affectedTickers.includes(e.to_ticker)
          );
          if (disrupted.length === 0) return null;
          return (
            <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 5,
              background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <div style={{ color: "#8B5CF6", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                letterSpacing: 2, marginBottom: 8 }}>
                DISRUPTED SUPPLY CHAIN — {disrupted.length} LINKS
              </div>
              {disrupted.slice(0, 12).map((edge, i) => {
                const relColor = RELATIONSHIP_COLORS[edge.relationship] || "#3B82F6";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
                    padding: "3px 6px", borderRadius: 3, background: "rgba(15,23,42,0.5)" }}>
                    <span style={{ color: "#F8FAFC", fontSize: 9, fontWeight: 700,
                      fontFamily: "JetBrains Mono, monospace", minWidth: 36 }}>
                      {edge.from_ticker}
                    </span>
                    <span style={{ color: relColor, fontSize: 10 }}>&rarr;</span>
                    <span style={{ color: "#F8FAFC", fontSize: 9, fontWeight: 700,
                      fontFamily: "JetBrains Mono, monospace", minWidth: 36 }}>
                      {edge.to_ticker}
                    </span>
                    <span style={{ color: relColor, fontSize: 7, fontFamily: "JetBrains Mono, monospace",
                      background: `${relColor}15`, padding: "1px 4px", borderRadius: 2 }}>
                      {edge.relationship.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span style={{ color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                      marginLeft: "auto" }}>
                      {(edge.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
              {disrupted.length > 12 && (
                <div style={{ color: "#64748B", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                  textAlign: "center", marginTop: 4 }}>
                  +{disrupted.length - 12} MORE LINKS
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Status Bar ────────────────────────────────────────────────────────────────
function StatusBar({ companies, activeEvent, processing, isMobile }) {
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const exposed = activeEvent ? Object.keys(activeEvent.risks).length : 0;
  const critical = activeEvent ? Object.values(activeEvent.risks).filter(r => r.score >= 0.8).length : 0;

  return (
    <div style={{
      height: 32, background: "rgba(15,23,42,0.95)", borderTop: "1px solid rgba(59,130,246,0.2)",
      display: "flex", alignItems: "center", padding: isMobile ? "0 10px" : "0 16px", gap: isMobile ? 10 : 24,
      fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#475569",
      flexShrink: 0, overflow: "hidden", whiteSpace: "nowrap",
    }}>
      <span style={{ color: "#22C55E" }}>● LIVE</span>
      {!isMobile && <span>S&P 500: {companies.length} TRACKED</span>}
      {activeEvent && (
        <>
          {!isMobile && <span style={{ color: "#EF4444" }}>ACTIVE EVENT: {activeEvent.title}</span>}
          <span style={{ color: "#F97316" }}>{exposed} EXPOSED</span>
          <span style={{ color: "#EF4444" }}>{critical} CRITICAL</span>
        </>
      )}
      {processing && <span style={{ color: "#3B82F6" }}>PROCESSING...</span>}
      <div style={{ flex: 1 }} />
      {!isMobile && <span>SURREALDB ● CONNECTED</span>}
      {!isMobile && <span>LANGGRAPH ● READY</span>}
      <span style={{ color: "#F8FAFC" }}>{clock.toUTCString().slice(17, 25)} UTC</span>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function RiskTerrain() {
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [view, setView] = useState("feed"); // "feed" | "report" | "graph"
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [supplyChain, setSupplyChain] = useState([]);
  const [graphTicker, setGraphTicker] = useState(null);
  const globeRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch existing events from backend on mount
  useEffect(() => {
    fetch('/api/v1/events')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setActiveEvent(data[0]);
          setView("report");
        }
      })
      .catch(err => console.warn('Backend not available, using empty feed:', err));
  }, []);

  // Fetch supply chain edges on mount
  useEffect(() => {
    fetch('/api/v1/supply-chain')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSupplyChain(data);
      })
      .catch(err => console.warn('Supply chain not available:', err));
  }, []);

  // Fly globe to event location when activeEvent changes
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !activeEvent) return;
    // Fly to event epicenter
    globe.pointOfView({ lat: activeEvent.lat, lng: activeEvent.lng, altitude: 2.0 }, 1200);
    // Return to US overview after 4 seconds
    const t = setTimeout(() => {
      globe.pointOfView({ lat: 38, lng: -95, altitude: 1.6 }, 2000);
    }, 4000);
    return () => clearTimeout(t);
  }, [activeEvent]);

  const handleTrigger = useCallback(async (idx) => {
    const prompts = [
      "M7.4 earthquake strikes Hualien County, Taiwan. TSMC reports damage to advanced fabs and pauses chip production.",
      "US Treasury announces sweeping new export controls on semiconductor technology to China, targeting EUV equipment.",
      "Federal Reserve raises interest rates by 75 basis points, signaling continued tightening amid persistent inflation.",
    ];
    setProcessing(true);
    try {
      const res = await fetch('/api/v1/events/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: prompts[idx], source: 'manual' }),
      });
      const evt = await res.json();
      setEvents(prev => [evt, ...prev]);
      setActiveEvent(evt);
      setView("report");
    } catch (err) {
      console.error('Pipeline failed:', err);
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleEventSelect = useCallback((event) => {
    setActiveEvent(event);
    setView("report");
  }, []);

  const handleCompanyClick = useCallback((company) => {
    setSelectedCompany(prev => prev?.ticker === company.ticker ? null : company);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0F1E; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(15,23,42,0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 2px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:none; } }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      <div style={{
        width: "100vw", height: "100vh",
        background: "#080D1A",
        display: "flex", flexDirection: "column",
        fontFamily: "Syne, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Scanline effect */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none", zIndex: 1,
        }} />

        {/* Header */}
        <div style={{
          height: 52, background: "rgba(8,13,26,0.98)",
          borderBottom: "1px solid rgba(59,130,246,0.2)",
          display: "flex", alignItems: "center", padding: isMobile ? "0 12px" : "0 20px",
          zIndex: 10, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: "#F8FAFC",
                fontFamily: "Syne, sans-serif", letterSpacing: -0.5 }}>
                RISK<span style={{ color: "#3B82F6" }}>TERRAIN</span>
              </div>
              {!isMobile && (
                <div style={{ fontSize: 7, color: "#334155", letterSpacing: 3,
                  fontFamily: "JetBrains Mono, monospace", marginTop: -1 }}>
                  S&P 500 INTELLIGENCE PLATFORM
                </div>
              )}
            </div>
            {!isMobile && (
              <>
                <div style={{ width: 1, height: 30, background: "rgba(59,130,246,0.2)", margin: "0 4px" }} />
                <div style={{ fontSize: 8, color: "#1D4ED8", fontFamily: "JetBrains Mono, monospace",
                  background: "rgba(29,78,216,0.1)", border: "1px solid rgba(29,78,216,0.3)",
                  padding: "2px 8px", borderRadius: 3, letterSpacing: 1 }}>
                  LANGCHAIN × SURREALDB
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", gap: isMobile ? 10 : 20, alignItems: "center" }}>
            {!isMobile && [
              { label: "COMPANIES", value: SP500_SAMPLE.length, color: "#3B82F6" },
              { label: "EDGES", value: supplyChain.length, color: "#8B5CF6" },
              { label: "EVENTS", value: events.length, color: "#F97316" },
              { label: "CRITICAL", value: activeEvent ? Object.values(activeEvent.risks).filter(r => r.score >= 0.8).length : 0, color: "#EF4444" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ color, fontSize: 16, fontWeight: 800,
                  fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>{value}</div>
                <div style={{ color: "#334155", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
            {!isMobile && <div style={{ width: 1, height: 30, background: "rgba(59,130,246,0.2)" }} />}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "feed", label: "EVENTS" },
                { id: "report", label: "ANALYSIS" },
                { id: "graph", label: "GRAPH" },
              ].map(tab => (
                <button key={tab.id} onClick={() => { setView(tab.id); if (isMobile) setPanelOpen(true); }}
                  style={{
                    background: view === tab.id ? "rgba(29,78,216,0.2)" : "none",
                    border: `1px solid ${view === tab.id ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.1)"}`,
                    color: view === tab.id ? "#93C5FD" : "#475569",
                    padding: "4px 12px", borderRadius: 4, cursor: "pointer",
                    fontSize: 9, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
                    transition: "all 0.15s",
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {isMobile && (
              <button onClick={() => setPanelOpen(!panelOpen)} style={{
                background: panelOpen ? "rgba(29,78,216,0.2)" : "none",
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#93C5FD", borderRadius: 4, cursor: "pointer",
                width: 32, height: 32, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{panelOpen ? "×" : "☰"}</button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", zIndex: 2, position: "relative" }}>

          {/* 3D Globe */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <Globe3D
              companies={SP500_SAMPLE}
              activeEvent={view !== "graph" ? activeEvent : null}
              supplyChainEdges={supplyChain}
              showSupplyChain={view === "graph" || (view === "report" && !!activeEvent)}
              highlightTicker={view === "graph" ? graphTicker : null}
              affectedTickers={view === "report" && activeEvent ? Object.keys(activeEvent.risks) : null}
              onCompanyClick={(company) => {
                if (view === "graph") {
                  setGraphTicker(prev => prev === company.ticker ? null : company.ticker);
                } else {
                  handleCompanyClick(company);
                }
              }}
              enableAutoRotate={true}
              onGlobeReady={(globe) => {
                globeRef.current = globe;
                globe.pointOfView({ lat: 38, lng: -95, altitude: isMobile ? 2.2 : 1.6 }, 0);
                const controls = globe.controls();
                controls.autoRotateSpeed = 0.2;
              }}
            />

            {/* Legend */}
            {!isMobile && (
              <div style={{
                position: "absolute", bottom: 16, left: 16,
                background: "rgba(8,13,26,0.9)", border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: 6, padding: "10px 14px", backdropFilter: "blur(8px)",
              }}>
                {view === "graph" ? (
                  <>
                    <div style={{ color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                      letterSpacing: 2, marginBottom: 8 }}>SUPPLY CHAIN</div>
                    {Object.entries(RELATIONSHIP_COLORS).map(([rel, color]) => (
                      <div key={rel} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color,
                          boxShadow: `0 0 6px ${color}` }} />
                        <span style={{ color, fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}>
                          {rel.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div style={{ color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                      letterSpacing: 2, marginBottom: 8 }}>RISK LEVEL</div>
                    {[
                      ["CRITICAL", "#EF4444", ">= 80%"],
                      ["HIGH",     "#F97316", "60-79%"],
                      ["MEDIUM",   "#EAB308", "40-59%"],
                      ["LOW",      "#22C55E", "20-39%"],
                      ["NONE",     "#3B82F6", "< 20%"],
                    ].map(([label, color, range]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color,
                          boxShadow: `0 0 6px ${color}` }} />
                        <span style={{ color, fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                          minWidth: 52 }}>{label}</span>
                        <span style={{ color: "#334155", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}>
                          {range}
                        </span>
                      </div>
                    ))}
                    {activeEvent && supplyChain.length > 0 && (
                      <>
                        <div style={{ height: 1, background: "rgba(59,130,246,0.15)", margin: "8px 0" }} />
                        <div style={{ color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                          letterSpacing: 2, marginBottom: 6 }}>DISRUPTED SUPPLY</div>
                        {Object.entries(RELATIONSHIP_COLORS).slice(0, 4).map(([rel, color]) => (
                          <div key={rel} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <div style={{ width: 12, height: 2, background: color, borderRadius: 1 }} />
                            <span style={{ color: `${color}CC`, fontSize: 7, fontFamily: "JetBrains Mono, monospace" }}>
                              {rel.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Processing overlay */}
            {processing && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(8,13,26,0.7)", display: "flex",
                alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(2px)",
              }}>
                <div style={{ textAlign: "center", padding: isMobile ? "0 20px" : 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#3B82F6",
                    margin: "0 auto 16px", boxShadow: "0 0 20px rgba(59,130,246,0.6)",
                    animation: "pulse 0.8s infinite" }} />
                  <div style={{ color: "#3B82F6", fontSize: isMobile ? 11 : 13, fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700, letterSpacing: 2 }}>AGENT PROCESSING</div>
                  <div style={{ color: "#334155", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                    marginTop: 6 }}>TRAVERSING S&P 500 KNOWLEDGE GRAPH</div>
                  <div style={{ display: "flex", gap: isMobile ? 4 : 6, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                    {["INGEST","GEO_RESOLVE","GRAPH_TRAVERSE","SCORE","REPORT"].map((n, i) => (
                      <div key={n} style={{
                        color: "#1D4ED8", fontSize: isMobile ? 7 : 8, fontFamily: "JetBrains Mono, monospace",
                        background: "rgba(29,78,216,0.1)", border: "1px solid rgba(29,78,216,0.3)",
                        padding: "3px 7px", borderRadius: 3,
                        animation: `pulse 0.8s ease ${i * 0.15}s infinite`,
                      }}>{n}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Selected company detail */}
            {selectedCompany && (
              <div style={{
                position: "absolute", top: 16, left: isMobile ? 12 : 16, right: isMobile ? 12 : "auto",
                background: "rgba(8,13,26,0.95)", border: "1px solid rgba(59,130,246,0.4)",
                borderRadius: 8, padding: "12px 16px", maxWidth: isMobile ? "none" : 280,
                backdropFilter: "blur(12px)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 800,
                    fontFamily: "JetBrains Mono, monospace" }}>
                    {selectedCompany.ticker}
                  </span>
                  <button onClick={() => setSelectedCompany(null)}
                    style={{ background: "none", border: "none", color: "#475569",
                      cursor: "pointer", fontSize: 14 }}>×</button>
                </div>
                <div style={{ color: "#94A3B8", fontSize: 10, marginBottom: 3 }}>{selectedCompany.name}</div>
                <div style={{ color: "#475569", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>
                  {selectedCompany.sector} · ${(selectedCompany.mc / 1000).toFixed(1)}T
                </div>
                {activeEvent?.risks[selectedCompany.ticker] && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(59,130,246,0.15)" }}>
                    <div style={{ color: riskColor(activeEvent.risks[selectedCompany.ticker].score),
                      fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>
                      RISK SCORE: {(activeEvent.risks[selectedCompany.ticker].score * 100).toFixed(0)}%
                    </div>
                    <div style={{ color: "#64748B", fontSize: 9, lineHeight: 1.5 }}>
                      {activeEvent.risks[selectedCompany.ticker].reasoning}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile: floating panel toggle */}
            {isMobile && !panelOpen && (
              <button onClick={() => setPanelOpen(true)} style={{
                position: "absolute", bottom: 16, right: 16,
                background: "rgba(29,78,216,0.9)", border: "1px solid rgba(59,130,246,0.5)",
                color: "#F8FAFC", borderRadius: 24, cursor: "pointer",
                padding: "10px 18px", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                fontWeight: 700, letterSpacing: 1,
                boxShadow: "0 4px 20px rgba(29,78,216,0.4)",
              }}>
                {view === "graph" ? `${supplyChain.length} EDGES` : `${events.length} EVENTS`} · VIEW PANEL
              </button>
            )}
          </div>

          {/* Side Panel — desktop: always visible; mobile: slide-over overlay */}
          {(!isMobile || panelOpen) && (
            <div style={{
              width: isMobile ? "100%" : 340,
              background: "rgba(8,13,26,0.98)",
              borderLeft: isMobile ? "none" : "1px solid rgba(59,130,246,0.15)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              flexShrink: 0,
              ...(isMobile ? {
                position: "absolute", top: 0, right: 0, bottom: 0,
                zIndex: 20, maxWidth: 360,
                boxShadow: "-4px 0 30px rgba(0,0,0,0.6)",
              } : {}),
            }}>
              {isMobile && (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 16px", borderBottom: "1px solid rgba(59,130,246,0.15)",
                }}>
                  <span style={{ color: "#93C5FD", fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                    letterSpacing: 1 }}>
                    {view === "graph" ? "SUPPLY CHAIN" : view === "feed" ? "EVENT FEED" : "RISK ANALYSIS"}
                  </span>
                  <button onClick={() => setPanelOpen(false)} style={{
                    background: "none", border: "1px solid rgba(100,116,139,0.3)",
                    color: "#64748B", cursor: "pointer", borderRadius: 4,
                    width: 28, height: 28, fontSize: 14, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>×</button>
                </div>
              )}
              {view === "graph" ? (
                <SupplyChainPanel
                  edges={supplyChain}
                  companies={SP500_SAMPLE}
                  selectedTicker={graphTicker}
                  onTickerSelect={setGraphTicker}
                />
              ) : view === "feed" || !activeEvent ? (
                <EventFeed
                  events={events}
                  activeEvent={activeEvent}
                  onEventSelect={(event) => { handleEventSelect(event); if (isMobile) setPanelOpen(false); }}
                  onTrigger={(idx) => { handleTrigger(idx); if (isMobile) setPanelOpen(false); }}
                  processing={processing}
                />
              ) : (
                <RiskPanel
                  event={activeEvent}
                  onClose={() => setView("feed")}
                  supplyChainEdges={supplyChain}
                />
              )}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <StatusBar
          companies={SP500_SAMPLE}
          activeEvent={activeEvent}
          processing={processing}
          isMobile={isMobile}
        />
      </div>
    </>
  );
}
