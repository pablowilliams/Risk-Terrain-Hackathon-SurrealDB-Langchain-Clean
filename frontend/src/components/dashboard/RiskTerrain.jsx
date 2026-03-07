import { useState, useEffect, useRef, useCallback } from "react";
import Globe3D from "../Globe3D";
import { SP500_SAMPLE as SHARED_COMPANIES } from "../../data/mockData";

// Use shared company data (154 companies)
const SP500_SAMPLE = SHARED_COMPANIES;

const DEMO_EVENTS = [
  {
    id: "evt_001",
    type: "natural_disaster",
    title: "M7.4 Earthquake — Taiwan",
    description: "Major earthquake strikes Hualien County, Taiwan. TSMC has paused operations at Fab 18. Aftershocks continuing.",
    severity: 5,
    source: "USGS",
    affected_countries: ["Taiwan"],
    affected_sectors: ["Technology", "Semiconductors"],
    lat: 24.0, lng: 121.6,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    risks: {
      NVDA: { score: 0.94, reasoning: "90% of supply chain routed through TSMC Taiwan fabs" },
      AAPL: { score: 0.88, reasoning: "25% supply chain + 19% revenue exposure to Taiwan/China" },
      AMD:  { score: 0.85, reasoning: "TSMC manufactures >80% of AMD chips at Taiwan fabs" },
      QCOM: { score: 0.81, reasoning: "Heavy reliance on TSMC for 5G modem production" },
      INTC: { score: 0.61, reasoning: "Partial exposure through TSMC advanced packaging" },
      MSFT: { score: 0.42, reasoning: "Azure hardware supply chain partially affected" },
      TSLA: { score: 0.38, reasoning: "Semiconductor shortage risk for vehicle production" },
      GOOGL:{ score: 0.35, reasoning: "TPU chip supply chain indirectly exposed" },
      AMZN: { score: 0.28, reasoning: "AWS custom silicon supply partially affected" },
      META: { score: 0.22, reasoning: "AI accelerator procurement mildly impacted" },
    }
  },
  {
    id: "evt_002",
    type: "geopolitical",
    title: "US Sanctions — Chinese Tech Firms",
    description: "US Treasury announces sweeping new export controls on advanced semiconductor technology to China. 47 entities added to Entity List.",
    severity: 4,
    source: "NewsAPI",
    affected_countries: ["China"],
    affected_sectors: ["Technology", "Consumer Electronics"],
    lat: 39.9, lng: 116.4,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    risks: {
      AAPL: { score: 0.79, reasoning: "19% revenue from China at direct risk from consumer retaliation" },
      NVDA: { score: 0.76, reasoning: "China represents 25% of data centre revenue, now blocked" },
      QCOM: { score: 0.71, reasoning: "Major Chinese smartphone OEM customer base threatened" },
      INTC: { score: 0.65, reasoning: "China manufacturing and sales both impacted by controls" },
      AMD:  { score: 0.58, reasoning: "Chinese cloud and HPC customers face export restrictions" },
      TSLA: { score: 0.55, reasoning: "Shanghai Gigafactory and Chinese sales under pressure" },
      AMZN: { score: 0.31, reasoning: "AWS China operations and Alibaba partnership at risk" },
      MSFT: { score: 0.28, reasoning: "Azure China JV and LinkedIn operations affected" },
      GM:   { score: 0.45, reasoning: "SAIC-GM joint venture represents 30% of global sales" },
      F:    { score: 0.38, reasoning: "China manufacturing and Changan Ford JV exposed" },
    }
  },
  {
    id: "evt_003",
    type: "macro",
    title: "Fed Raises Rates +75bps",
    description: "Federal Reserve raises interest rates by 75 basis points, largest single hike since 1994. Chair signals further hikes likely.",
    severity: 4,
    source: "NewsAPI",
    affected_countries: ["USA"],
    affected_sectors: ["Financials", "Real Estate", "Technology"],
    lat: 38.9, lng: -77.0,
    created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    risks: {
      JPM:  { score: 0.31, reasoning: "Higher rates improve NIM but loan default risk rises" },
      BAC:  { score: 0.38, reasoning: "Large mortgage book exposed to housing market slowdown" },
      GS:   { score: 0.29, reasoning: "Deal flow likely to slow in higher rate environment" },
      NFLX: { score: 0.67, reasoning: "High debt load expensive to refinance at elevated rates" },
      TSLA: { score: 0.59, reasoning: "Auto loans become less affordable, EV demand softens" },
      AMZN: { score: 0.52, reasoning: "Consumer spending sensitivity and high capex financing costs" },
      HD:   { score: 0.71, reasoning: "Housing market directly impacted, renovation spend falls" },
      V:    { score: 0.24, reasoning: "Transaction volumes resilient but credit risk rises" },
      XOM:  { score: 0.18, reasoning: "Energy sector relatively insulated from rate sensitivity" },
      PG:   { score: 0.21, reasoning: "Consumer staples provide some defensiveness" },
    }
  }
];

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

// ── Map Component ─────────────────────────────────────────────────────────────
function WorldMap({ companies, activeEvent, onCompanyClick, selectedCompany }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const [tooltip, setTooltip] = useState(null);

  // Mercator-like projection
  const project = useCallback((lat, lng, w, h) => {
    const x = (lng + 180) / 360 * w;
    const latRad = lat * Math.PI / 180;
    const mercN = Math.log(Math.tan(Math.PI/4 + latRad/2));
    const y = h/2 - (mercN * h / (2 * Math.PI));
    return [x, y];
  }, []);

  const getRiskScore = useCallback((ticker) => {
    if (!activeEvent) return 0;
    return activeEvent.risks[ticker]?.score || 0;
  }, [activeEvent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = (t) => {
      timeRef.current = t;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.strokeStyle = "rgba(30,58,138,0.15)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Continent outlines (simplified)
      const continents = [
        // North America
        [[49,25],[49,-125],[14,-117],[14,-83],[25,-77],[32,-80],[47,-52],[49,25]],
        // Europe
        [[71,28],[71,30],[55,37],[42,28],[36,14],[44,0],[48,-5],[58,-5],[58,5],[55,10],[57,12],[60,5],[65,14],[71,28]],
        // Asia (simplified)
        [[71,180],[71,30],[55,37],[42,28],[12,44],[22,60],[28,65],[25,85],[8,77],[1,104],[22,121],[38,121],[53,135],[66,170],[71,180]],
        // Africa
        [[37,10],[37,37],[22,37],[8,44],[-35,26],[-35,18],[-18,12],[0,9],[15,0],[37,10]],
        // South America
        [[12,-72],[12,-62],[0,-50],[-55,-68],[-55,-72],[-18,-70],[-5,-81],[8,-77],[12,-72]],
        // Australia
        [[-15,130],[-15,141],[-38,147],[-38,115],[-22,114],[-15,130]],
      ];

      ctx.fillStyle = "rgba(15,23,42,0.8)";
      ctx.strokeStyle = "rgba(30,64,175,0.3)";
      ctx.lineWidth = 0.8;

      continents.forEach(pts => {
        ctx.beginPath();
        pts.forEach(([lat, lng], i) => {
          const [x, y] = project(lat, lng, W, H);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // Event epicentre pulse
      if (activeEvent?.lat && activeEvent?.lng) {
        const [ex, ey] = project(activeEvent.lat, activeEvent.lng, W, H);
        const pulse = (Math.sin(t * 0.003) + 1) / 2;
        const maxR = 60;
        for (let r = 0; r < 3; r++) {
          const radius = ((pulse + r * 0.33) % 1) * maxR;
          const alpha = (1 - radius / maxR) * 0.4;
          ctx.beginPath();
          ctx.arc(ex, ey, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#EF4444";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#FCA5A5";
        ctx.fill();
      }

      // Company dots
      companies.forEach(company => {
        const [cx, cy] = project(company.lat, company.lng, W, H);
        const score = getRiskScore(company.ticker);
        const color = riskColor(score);
        const isSelected = selectedCompany?.ticker === company.ticker;
        const baseR = score > 0 ? 3 + score * 7 : 3;
        const r = isSelected ? baseR + 3 : baseR;

        // Glow for high risk
        if (score > 0.5) {
          const glowPulse = 0.5 + 0.5 * Math.sin(t * 0.004 + company.lat);
          ctx.beginPath();
          ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
          ctx.fillStyle = `${color}${Math.floor(glowPulse * 25).toString(16).padStart(2,"0")}`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = score > 0 ? color : "rgba(100,116,139,0.6)";
        ctx.fill();

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = "#F8FAFC";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Ticker label for high risk companies
        if (score > 0.6 || isSelected) {
          ctx.fillStyle = "#F8FAFC";
          ctx.font = `bold 9px 'JetBrains Mono', monospace`;
          ctx.fillText(company.ticker, cx + r + 3, cy + 3);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [companies, activeEvent, getRiskScore, project, selectedCompany]);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, []);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width; const H = canvas.height;

    let found = null;
    companies.forEach(company => {
      const [cx, cy] = project(company.lat, company.lng, W, H);
      const dist = Math.hypot(mx - cx, my - cy);
      if (dist < 12) found = { company, x: mx, y: my };
    });
    setTooltip(found);
  }, [companies, project]);

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width; const H = canvas.height;

    companies.forEach(company => {
      const [cx, cy] = project(company.lat, company.lng, W, H);
      if (Math.hypot(mx - cx, my - cy) < 12) onCompanyClick(company);
    });
  }, [companies, project, onCompanyClick]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleClick}
        style={{ width: "100%", height: "100%", cursor: "crosshair", display: "block" }}
      />
      {tooltip && (
        <div style={{
          position: "absolute",
          left: tooltip.x + 14, top: tooltip.y - 10,
          background: "rgba(15,23,42,0.95)",
          border: "1px solid rgba(59,130,246,0.5)",
          borderRadius: 6, padding: "8px 12px",
          pointerEvents: "none", zIndex: 100,
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ color: "#F8FAFC", fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700 }}>
            {tooltip.company.ticker}
          </div>
          <div style={{ color: "#94A3B8", fontSize: 10, marginTop: 2 }}>{tooltip.company.name}</div>
          <div style={{ color: "#64748B", fontSize: 10 }}>{tooltip.company.sector}</div>
          {activeEvent && activeEvent.risks[tooltip.company.ticker] && (
            <>
              <div style={{ marginTop: 6, height: 1, background: "rgba(59,130,246,0.2)" }} />
              <div style={{ marginTop: 4, color: riskColor(activeEvent.risks[tooltip.company.ticker].score), fontSize: 10, fontWeight: 700 }}>
                RISK: {(activeEvent.risks[tooltip.company.ticker].score * 100).toFixed(0)}% — {riskLabel(activeEvent.risks[tooltip.company.ticker].score)}
              </div>
              <div style={{ color: "#94A3B8", fontSize: 9, marginTop: 2, maxWidth: 200, lineHeight: 1.4 }}>
                {activeEvent.risks[tooltip.company.ticker].reasoning}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
          TRIGGER DEMO EVENT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { label: "🌏 M7.4 Taiwan EQ", idx: 0, color: "#EF4444" },
            { label: "🚫 China Sanctions", idx: 1, color: "#F97316" },
            { label: "📈 Fed +75bps Hike", idx: 2, color: "#EAB308" },
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
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div style={{ textAlign: "center", color: "#334155", padding: "30px 0", fontSize: 10,
            fontFamily: "JetBrains Mono, monospace" }}>
            NO EVENTS DETECTED<br />
            <span style={{ fontSize: 9, color: "#1E293B" }}>MONITORING GDELT + USGS + NEWSAPI</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Risk Panel ────────────────────────────────────────────────────────────────
function RiskPanel({ event, onClose }) {
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
      </div>
    </div>
  );
}

// ── Status Bar ────────────────────────────────────────────────────────────────
function StatusBar({ companies, activeEvent, processing }) {
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
      display: "flex", alignItems: "center", padding: "0 16px", gap: 24,
      fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#475569",
    }}>
      <span style={{ color: "#22C55E" }}>● LIVE</span>
      <span>S&P 500: {companies.length} TRACKED</span>
      {activeEvent && (
        <>
          <span style={{ color: "#EF4444" }}>⚡ ACTIVE EVENT: {activeEvent.title}</span>
          <span style={{ color: "#F97316" }}>{exposed} EXPOSED</span>
          <span style={{ color: "#EF4444" }}>{critical} CRITICAL</span>
        </>
      )}
      {processing && <span style={{ color: "#3B82F6" }}>◌ AGENT PROCESSING...</span>}
      <div style={{ flex: 1 }} />
      <span>SURREALDB ● CONNECTED</span>
      <span>LANGGRAPH ● READY</span>
      <span style={{ color: "#F8FAFC" }}>{clock.toUTCString().slice(17, 25)} UTC</span>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function RiskTerrain() {
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [view, setView] = useState("feed"); // "feed" | "report"
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleTrigger = useCallback((idx) => {
    const evt = { ...DEMO_EVENTS[idx], id: `evt_${Date.now()}`, created_at: new Date().toISOString() };
    setProcessing(true);
    setTimeout(() => {
      setEvents(prev => [evt, ...prev]);
      setActiveEvent(evt);
      setView("report");
      setProcessing(false);
    }, 2200);
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
          display: "flex", alignItems: "center", padding: "0 20px",
          zIndex: 10, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC",
                fontFamily: "Syne, sans-serif", letterSpacing: -0.5 }}>
                RISK<span style={{ color: "#3B82F6" }}>TERRAIN</span>
              </div>
              <div style={{ fontSize: 7, color: "#334155", letterSpacing: 3,
                fontFamily: "JetBrains Mono, monospace", marginTop: -1 }}>
                S&P 500 INTELLIGENCE PLATFORM
              </div>
            </div>
            <div style={{ width: 1, height: 30, background: "rgba(59,130,246,0.2)", margin: "0 4px" }} />
            <div style={{ fontSize: 8, color: "#1D4ED8", fontFamily: "JetBrains Mono, monospace",
              background: "rgba(29,78,216,0.1)", border: "1px solid rgba(29,78,216,0.3)",
              padding: "2px 8px", borderRadius: 3, letterSpacing: 1 }}>
              LANGCHAIN × SURREALDB
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {[
              { label: "COMPANIES", value: SP500_SAMPLE.length, color: "#3B82F6" },
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
            <div style={{ width: 1, height: 30, background: "rgba(59,130,246,0.2)" }} />
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "feed", label: "EVENTS" },
                { id: "report", label: "ANALYSIS" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id)}
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
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", zIndex: 2 }}>

          {/* 3D Globe */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <Globe3D
              companies={SP500_SAMPLE}
              activeEvent={activeEvent}
              onCompanyClick={handleCompanyClick}
              enableAutoRotate={true}
              onGlobeReady={(globe) => {
                // Zoom into the US on load
                globe.pointOfView({ lat: 38, lng: -95, altitude: 1.6 }, 0);
                const controls = globe.controls();
                controls.autoRotateSpeed = 0.2;
              }}
            />

            {/* Legend */}
            <div style={{
              position: "absolute", bottom: 16, left: 16,
              background: "rgba(8,13,26,0.9)", border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 6, padding: "10px 14px", backdropFilter: "blur(8px)",
            }}>
              <div style={{ color: "#475569", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                letterSpacing: 2, marginBottom: 8 }}>RISK LEVEL</div>
              {[
                ["CRITICAL", "#EF4444", "≥ 80%"],
                ["HIGH",     "#F97316", "60–79%"],
                ["MEDIUM",   "#EAB308", "40–59%"],
                ["LOW",      "#22C55E", "20–39%"],
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
            </div>

            {/* Processing overlay */}
            {processing && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(8,13,26,0.7)", display: "flex",
                alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(2px)",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                  <div style={{ color: "#3B82F6", fontSize: 13, fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700, letterSpacing: 2 }}>AGENT PROCESSING</div>
                  <div style={{ color: "#334155", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                    marginTop: 6 }}>TRAVERSING S&P 500 KNOWLEDGE GRAPH</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
                    {["EVENT_INTAKE","GEO_RESOLVER","GRAPH_TRAVERSER","RISK_SCORER"].map((n, i) => (
                      <div key={n} style={{
                        color: "#1D4ED8", fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                        background: "rgba(29,78,216,0.1)", border: "1px solid rgba(29,78,216,0.3)",
                        padding: "3px 7px", borderRadius: 3,
                        animation: `pulse 0.8s ease ${i * 0.2}s infinite`,
                      }}>{n}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Selected company detail */}
            {selectedCompany && (
              <div style={{
                position: "absolute", top: 16, left: 16,
                background: "rgba(8,13,26,0.95)", border: "1px solid rgba(59,130,246,0.4)",
                borderRadius: 8, padding: "12px 16px", maxWidth: 280,
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
          </div>

          {/* Side Panel */}
          <div style={{
            width: 340, background: "rgba(8,13,26,0.95)",
            borderLeft: "1px solid rgba(59,130,246,0.15)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            flexShrink: 0,
          }}>
            {view === "feed" || !activeEvent ? (
              <EventFeed
                events={events}
                activeEvent={activeEvent}
                onEventSelect={handleEventSelect}
                onTrigger={handleTrigger}
                processing={processing}
              />
            ) : (
              <RiskPanel
                event={activeEvent}
                onClose={() => setView("feed")}
              />
            )}
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar
          companies={SP500_SAMPLE}
          activeEvent={activeEvent}
          processing={processing}
        />
      </div>
    </>
  );
}
