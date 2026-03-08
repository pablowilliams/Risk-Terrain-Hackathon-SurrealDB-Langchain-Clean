import { useRef, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { GlobeMethods } from 'react-globe.gl'
import Globe3D from '../components/Globe3D'
import { SP500_SAMPLE, DEMO_EVENTS } from '../data/mockData'

// ── Design Tokens (matching riskterrain.jsx exactly) ──────────────────────────
const T = {
  bg0: '#080D1A',
  bg1: '#0A0F1E',
  card: 'rgba(15,23,42,0.8)',
  border: 'rgba(59,130,246,0.2)',
  blue: '#3B82F6',
  deepBlue: '#1D4ED8',
  text0: '#F8FAFC',
  text1: '#94A3B8',
  text2: '#64748B',
  text3: '#475569',
  text4: '#334155',
  red: '#EF4444',
  orange: '#F97316',
  yellow: '#EAB308',
  green: '#22C55E',
  mono: "'JetBrains Mono', monospace",
  syne: "'Syne', sans-serif",
} as const

// ── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (started.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count}</span>
}

// ── Ticker items ─────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { text: 'M7.4 EARTHQUAKE DETECTED — TAIWAN — 14:32 UTC', critical: true },
  { text: 'RISK SCORE UPDATE: TSMC 0.94 CRITICAL', critical: true },
  { text: 'LANGGRAPH AGENT: 8/8 NODES COMPLETE — 2.3s', critical: false },
  { text: 'SURREALDB: 847 GRAPH EDGES TRAVERSED', critical: false },
  { text: 'GEOPOLITICAL: EU SANCTIONS — ENERGY SECTOR EXPOSED', critical: true },
  { text: 'RISK SCORE UPDATE: NVDA 0.72 HIGH', critical: true },
  { text: 'EVENT CLASSIFIED: NATURAL_DISASTER SEV-5', critical: false },
  { text: 'CLAUDE SONNET: RISK SYNTHESIS COMPLETE — 18 COMPANIES SCORED', critical: false },
  { text: 'SUPPLY CHAIN ALERT: SECOND-ORDER EXPOSURE DETECTED — AMD, QCOM', critical: true },
  { text: 'HISTORICAL MATCH: 2011 TOHOKU EARTHQUAKE — 87% SIMILARITY', critical: false },
]

// ── Scroll-driven globe controller ───────────────────────────────────────────
function useScrollGlobe(globeRef: React.MutableRefObject<GlobeMethods | null>) {
  const [scrollY, setScrollY] = useState(0)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking.current = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return

    const vh = window.innerHeight
    const totalHeight = document.documentElement.scrollHeight - vh
    const progress = totalHeight > 0 ? Math.min(scrollY / totalHeight, 1) : 0

    // Start zoomed into the US, slowly zoom out as user scrolls
    const altitude = 1.8 + progress * 3.2
    // Tilt the view (lat sweeps 38 → 55)
    const lat = 38 + progress * 17
    // Start at US center (lng -95), slowly rotate eastward
    const lng = -95 + progress * 60

    globe.pointOfView({ lat, lng, altitude }, 0)
  }, [scrollY, globeRef])

  return scrollY
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const globeRef = useRef<GlobeMethods | null>(null)
  const scrollY = useScrollGlobe(globeRef)

  const handleGlobeReady = useCallback((globe: GlobeMethods) => {
    globeRef.current = globe
    // Set initial view: US-centered, zoomed in to show company clusters
    globe.pointOfView({ lat: 38, lng: -95, altitude: 1.8 }, 0)
    // Disable user drag so scroll works naturally
    const controls = globe.controls()
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableRotate = false
  }, [])

  const handleEnterDashboard = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 37.0, lng: -95.0, altitude: 0.5 }, 1200)
    }
    setTimeout(() => navigate('/dashboard'), 900)
  }, [navigate])

  // Globe stays visible but dims slightly as user scrolls
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900
  const globeOpacity = Math.max(0.25, 1 - scrollY / (vh * 2.5))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: T.bg0,
        fontFamily: T.syne,
        overflowX: 'hidden',
      }}
    >
      {/* Scanline */}
      <div className="scanline-overlay" style={{ position: 'fixed', zIndex: 0 }} />

      {/* ═══ GLOBE (fixed behind everything, responds to scroll) ═══ */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        opacity: globeOpacity,
        transition: 'opacity 0.1s linear',
        pointerEvents: globeOpacity > 0.3 ? 'auto' : 'none',
      }}>
        <Globe3D
          companies={SP500_SAMPLE}
          activeEvent={DEMO_EVENTS[0]}
          enableAutoRotate={false}
          onGlobeReady={handleGlobeReady}
          minimal
        />
      </div>

      {/* ═══ HERO ═══ */}
      <section style={{
        position: 'relative', height: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: `
            radial-gradient(ellipse at center, transparent 30%, ${T.bg0} 80%),
            linear-gradient(to bottom, ${T.bg0}60 0%, transparent 18%, transparent 70%, ${T.bg0}95 100%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          height: 60, display: 'flex', alignItems: 'center', padding: '0 clamp(16px, 4vw, 32px)',
          background: 'rgba(8,13,26,0.6)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <div style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800, color: T.text0, letterSpacing: -0.5, fontFamily: T.syne }}>
              RISK<span style={{ color: T.blue }}>TERRAIN</span>
            </div>
            <div style={{
              fontSize: 7, color: T.text4, letterSpacing: 3,
              fontFamily: T.mono, marginTop: -2,
            }}>
              S&amp;P 500 INTELLIGENCE PLATFORM
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['SURREALDB', 'LANGGRAPH'].map(badge => (
              <span key={badge} style={{
                fontSize: 'clamp(6px, 1.2vw, 8px)', fontFamily: T.mono, letterSpacing: 1,
                color: T.deepBlue,
                background: 'rgba(29,78,216,0.1)',
                border: '1px solid rgba(29,78,216,0.3)',
                padding: '3px 8px', borderRadius: 3,
              }}>{badge}</span>
            ))}
          </div>
        </header>

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center', padding: '0 24px', marginTop: 40,
        }}>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              fontSize: 9, fontFamily: T.mono, letterSpacing: 4,
              color: T.blue, marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}
          >
            <span style={{ width: 40, height: 1, background: T.blue, display: 'inline-block' }} />
            GEOSPATIAL INTELLIGENCE PLATFORM
            <span style={{ width: 40, height: 1, background: T.blue, display: 'inline-block' }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{
              fontSize: 'clamp(42px, 7vw, 90px)',
              fontWeight: 800, fontFamily: T.syne,
              color: T.text0, letterSpacing: -2,
              lineHeight: 1.0, marginBottom: 16,
            }}
          >
            RISK<span style={{ color: T.blue }}>TERRAIN</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{
              fontSize: 'clamp(11px, 1.8vw, 15px)',
              fontFamily: T.mono, color: T.text2,
              letterSpacing: 3, textTransform: 'uppercase',
              marginBottom: 44,
            }}
          >
            GEOSPATIAL RISK INTELLIGENCE FOR THE S&amp;P 500
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            style={{ display: 'flex', gap: 'clamp(20px, 5vw, 40px)', justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}
          >
            {[
              { value: <AnimatedCounter target={SP500_SAMPLE.length} />, label: 'COMPANIES TRACKED', color: T.blue },
              { value: 'LIVE', label: 'EVENT MONITORING', color: T.green },
              { value: 'AI', label: 'RISK SCORING', color: T.orange },
            ].map(({ value, label, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 28, fontWeight: 800, fontFamily: T.mono,
                  color, lineHeight: 1,
                }}>{value}</div>
                <div style={{
                  fontSize: 7, fontFamily: T.mono, letterSpacing: 2,
                  color: T.text4, marginTop: 6,
                }}>{label}</div>
              </div>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            onClick={handleEnterDashboard}
            whileHover={{ scale: 1.04, boxShadow: `0 0 50px ${T.blue}60` }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: `linear-gradient(135deg, ${T.deepBlue}, ${T.blue})`,
              border: `1px solid ${T.blue}`,
              color: T.text0, padding: '14px 44px',
              borderRadius: 6, fontSize: 11, fontFamily: T.mono,
              fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
              boxShadow: `0 0 30px ${T.blue}40, 0 0 60px ${T.blue}20`,
              transition: 'box-shadow 0.2s',
            }}
          >
            ENTER DASHBOARD &rarr;
          </motion.button>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 28, left: '50%',
            transform: 'translateX(-50%)', zIndex: 2,
            color: T.text4, fontSize: 8, fontFamily: T.mono,
            letterSpacing: 3, textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 6 }}>SCROLL TO EXPLORE</div>
          <div style={{ fontSize: 16, color: T.text3 }}>&darr;</div>
        </motion.div>
      </section>

      {/* ═══ LIVE TICKER ═══ */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: 'rgba(8,13,26,0.95)',
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        overflow: 'hidden',
        padding: '10px 0',
      }}>
        <div style={{
          display: 'flex', whiteSpace: 'nowrap' as const,
          animation: 'ticker 40s linear infinite',
        }}>
          {/* Duplicate content for seamless loop */}
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{
              fontSize: 8, fontFamily: T.mono, letterSpacing: 1,
              color: item.critical ? T.red : T.text3,
              padding: '0 24px',
              display: 'inline-flex', alignItems: 'center', gap: 24,
            }}>
              <span style={{
                width: 3, height: 3, borderRadius: '50%',
                background: item.critical ? T.red : T.blue,
                display: 'inline-block', flexShrink: 0,
              }} />
              {item.text}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{
        padding: 'clamp(60px, 10vw, 120px) clamp(16px, 4vw, 48px)', background: 'rgba(10,15,30,0.85)',
        position: 'relative', zIndex: 2,
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{
            fontSize: 8, fontFamily: T.mono, letterSpacing: 4,
            color: T.blue, marginBottom: 16,
          }}>CAPABILITIES</div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 700,
            color: T.text0, letterSpacing: 0.5,
            fontFamily: T.mono,
          }}>How It Works</h2>
          <div style={{
            width: 60, height: 2, background: T.blue,
            margin: '16px auto 0', borderRadius: 1,
          }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 28, maxWidth: 1200, margin: '0 auto',
        }}>
          {[
            {
              step: '01',
              title: 'Real-Time Event Monitoring',
              subtitle: 'Continuous global surveillance across multiple data feeds',
              desc: 'The system ingests geopolitical shocks, natural disasters, and macroeconomic shifts from three primary sources in real time. Events are automatically classified by type, severity, and geographic footprint, then routed into the analysis pipeline within seconds of detection.',
              details: [
                'GDELT Project for geopolitical events and conflict monitoring',
                'USGS ShakeAlert for seismic activity and natural disaster tracking',
                'NewsAPI for breaking financial and corporate news aggregation',
                'Automatic event classification by type, severity, and affected regions',
              ],
              color: T.red,
              tags: ['GDELT', 'USGS', 'NEWSAPI', 'REAL-TIME'],
            },
            {
              step: '02',
              title: 'Knowledge Graph Traversal',
              subtitle: 'Multi-hop supply chain exposure analysis via graph database',
              desc: 'S&P 500 companies and their supply chain relationships are encoded as a knowledge graph in SurrealDB. When an event occurs, LangGraph agents traverse the graph to map direct and second-order exposure paths across sectors and geographies.',
              details: [
                'SurrealDB multi-model database storing company nodes and supply chain edges',
                'LangGraph orchestrates multi-step agent traversal across the graph',
                'Second-order risk detection through supplier-of-supplier chain analysis',
                'Geographic and sector-based exposure clustering for downstream scoring',
              ],
              color: T.blue,
              tags: ['SURREALDB', 'LANGGRAPH', 'GRAPH RAG', 'MULTI-HOP'],
            },
            {
              step: '03',
              title: 'AI-Powered Risk Scoring',
              subtitle: 'Contextual risk synthesis with natural language reasoning',
              desc: 'Claude receives the graph traversal output, sector exposure data, and historical event parallels. It produces ranked risk scores from 0 to 1.0 for each affected company, accompanied by natural language explanations detailing the causal chain from event to impact.',
              details: [
                'Claude Sonnet synthesizes graph data with sector exposure analysis',
                'Risk scores from 0.0 to 1.0 with confidence intervals per company',
                'Natural language reasoning explains the causal chain from event to impact',
                'Historical event comparison for precedent-based severity calibration',
              ],
              color: T.orange,
              tags: ['CLAUDE', 'ANTHROPIC', 'SONNET', 'NLR'],
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              style={{
                background: T.card, border: `1px solid ${f.color}25`,
                borderRadius: 8, padding: '36px 30px',
                backdropFilter: 'blur(12px)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`,
              }} />

              {/* Step number watermark */}
              <div style={{
                fontSize: 48, fontWeight: 800, fontFamily: T.mono,
                color: `${f.color}15`, lineHeight: 1,
                position: 'absolute', top: 16, right: 20,
              }}>{f.step}</div>

              <h3 style={{
                fontSize: 16, fontWeight: 700,
                fontFamily: T.mono,
                color: T.text0, marginBottom: 6,
                letterSpacing: 0.3,
              }}>{f.title}</h3>

              <p style={{
                fontSize: 10, fontFamily: T.mono,
                color: f.color, letterSpacing: 0.5,
                marginBottom: 16, textTransform: 'uppercase',
              }}>{f.subtitle}</p>

              <p style={{
                color: T.text1, fontSize: 13, lineHeight: 1.75, marginBottom: 20,
              }}>{f.desc}</p>

              <ul style={{
                listStyle: 'none', padding: 0, margin: '0 0 22px 0',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {f.details.map((d, j) => (
                  <li key={j} style={{
                    fontSize: 11, color: T.text2, lineHeight: 1.5,
                    paddingLeft: 14, position: 'relative',
                  }}>
                    <span style={{
                      position: 'absolute', left: 0, top: 6,
                      width: 4, height: 4, borderRadius: '50%',
                      background: f.color, opacity: 0.6,
                    }} />
                    {d}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {f.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 7, fontFamily: T.mono, letterSpacing: 1,
                    color: f.color,
                    background: `${f.color}12`,
                    border: `1px solid ${f.color}30`,
                    padding: '3px 8px', borderRadius: 3,
                  }}>{tag}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ AGENT PIPELINE ═══ */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 48px)', background: 'rgba(8,13,26,0.85)',
        position: 'relative', zIndex: 2,
        borderTop: `1px solid ${T.border}`,
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            fontSize: 8, fontFamily: T.mono, letterSpacing: 4,
            color: T.blue, marginBottom: 16,
          }}>ARCHITECTURE</div>
          <h2 style={{
            fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 700,
            color: T.text0, letterSpacing: 0.3,
            fontFamily: T.mono, marginBottom: 12,
          }}>Agent Pipeline</h2>
          <p style={{
            fontSize: 12, color: T.text2, fontFamily: T.mono,
            maxWidth: 600, margin: '0 auto', lineHeight: 1.6,
          }}>
            Eight specialized LangGraph nodes process each event sequentially,
            from raw intake through to a complete executive risk report.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: 900, margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 8,
          }}
        >
          {[
            { step: '01', label: 'EVENT_INTAKE', desc: 'Ingest, classify, and validate incoming event data' },
            { step: '02', label: 'GEO_RESOLVER', desc: 'Map event to affected countries and regions' },
            { step: '03', label: 'GRAPH_TRAVERSER', desc: 'Walk supply chain edges in SurrealDB graph' },
            { step: '04', label: 'RISK_SCORER', desc: 'Claude AI produces per-company risk scores' },
            { step: '05', label: 'HISTORICAL_REASONER', desc: 'Retrieve past event parallels for context' },
            { step: '06', label: 'NEWS_ENRICHER', desc: 'Augment with latest breaking news headlines' },
            { step: '07', label: 'HEDGE_SUGGESTER', desc: 'Generate risk mitigation strategies' },
            { step: '08', label: 'REPORT_GENERATOR', desc: 'Compile executive summary and risk brief' },
          ].map((node, i) => (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              style={{
                background: 'rgba(29,78,216,0.08)',
                border: '1px solid rgba(29,78,216,0.25)',
                borderRadius: 4, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{
                fontSize: 9, fontFamily: T.mono, fontWeight: 800,
                color: T.deepBlue, opacity: 0.6,
              }}>{node.step}</span>
              <div>
                <div style={{
                  fontSize: 9, fontFamily: T.mono, fontWeight: 700,
                  color: T.blue, letterSpacing: 0.5,
                }}>{node.label}</div>
                <div style={{
                  fontSize: 8, fontFamily: T.mono, color: T.text3,
                  lineHeight: 1.4,
                }}>{node.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ TECH STACK + FOOTER ═══ */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 48px) 60px', background: 'rgba(10,15,30,0.85)',
        textAlign: 'center', position: 'relative', zIndex: 2,
        borderTop: `1px solid ${T.border}`,
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{
          fontSize: 8, fontFamily: T.mono, letterSpacing: 4,
          color: T.blue, marginBottom: 16,
        }}>BUILT WITH</div>
        <h2 style={{
          fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 700,
          color: T.text0, letterSpacing: 0.3,
          fontFamily: T.mono, marginBottom: 48,
        }}>Technology Stack</h2>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 16,
          justifyContent: 'center', maxWidth: 800, margin: '0 auto 64px',
        }}>
          {[
            { name: 'Claude', desc: 'Anthropic AI for risk synthesis and natural language reasoning', color: T.orange },
            { name: 'SurrealDB', desc: 'Multi-model graph database for supply chain relationships', color: T.blue },
            { name: 'LangGraph', desc: 'Stateful agent orchestration framework for pipeline control', color: T.green },
            { name: 'React + Vite', desc: 'Frontend rendering and fast HMR build tooling', color: T.text1 },
            { name: 'react-globe.gl', desc: 'WebGL 3D globe visualization with real-time data overlays', color: T.yellow },
          ].map(({ name, desc, color }) => (
            <motion.div
              key={name}
              whileHover={{ scale: 1.03, borderColor: `${color}60` }}
              style={{
                background: T.card, border: `1px solid ${color}30`,
                borderRadius: 6, padding: '16px 22px',
                backdropFilter: 'blur(8px)', textAlign: 'left',
                minWidth: 'min(170px, 100%)', flex: '1 1 150px', transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                fontSize: 14, fontWeight: 700, fontFamily: T.mono,
                color, marginBottom: 4,
              }}>{name}</div>
              <div style={{
                fontSize: 9, color: T.text2, fontFamily: T.mono,
                lineHeight: 1.5,
              }}>{desc}</div>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={handleEnterDashboard}
          whileHover={{ scale: 1.04, boxShadow: `0 0 50px ${T.blue}60` }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'transparent',
            border: `1px solid ${T.border}`,
            color: T.text0, padding: '14px 48px',
            borderRadius: 6, fontSize: 11, fontFamily: T.mono,
            fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          LAUNCH INTELLIGENCE DASHBOARD &rarr;
        </motion.button>

        <div style={{
          marginTop: 80, paddingTop: 32,
          borderTop: `1px solid ${T.border}`,
          fontSize: 8, fontFamily: T.mono, letterSpacing: 2,
          color: T.text4,
        }}>
          RISKTERRAIN &middot; BUILT WITH CLAUDE + SURREALDB + LANGGRAPH
        </div>
      </section>
    </motion.div>
  )
}
