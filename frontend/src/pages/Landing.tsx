import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { GlobeMethods } from 'react-globe.gl'
import Globe3D from '../components/Globe3D'
import { SP500_SAMPLE } from '../data/mockData'

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

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const globeRef = useRef<GlobeMethods | null>(null)

  const handleGlobeReady = useCallback((globe: GlobeMethods) => {
    globeRef.current = globe
  }, [])

  const handleEnterDashboard = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 37.0, lng: -95.0, altitude: 0.5 }, 1200)
    }
    setTimeout(() => navigate('/dashboard'), 900)
  }, [navigate])

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

      {/* ═══ HERO ═══ */}
      <section style={{
        position: 'relative', height: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Globe background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Globe3D
            companies={SP500_SAMPLE}
            enableAutoRotate={true}
            onGlobeReady={handleGlobeReady}
          />
        </div>

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
          height: 60, display: 'flex', alignItems: 'center', padding: '0 32px',
          background: 'rgba(8,13,26,0.6)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text0, letterSpacing: -0.5 }}>
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
            {['CLAUDE', 'SURREALDB', 'LANGGRAPH'].map(badge => (
              <span key={badge} style={{
                fontSize: 8, fontFamily: T.mono, letterSpacing: 1,
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
          {/* Overline */}
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
            LONDON HACKATHON 2025
            <span style={{ width: 40, height: 1, background: T.blue, display: 'inline-block' }} />
          </motion.div>

          {/* Headline */}
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

          {/* Tagline */}
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

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            style={{
              display: 'flex', gap: 40, justifyContent: 'center', marginBottom: 48,
            }}
          >
            {[
              { value: String(SP500_SAMPLE.length), label: 'COMPANIES TRACKED', color: T.blue },
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

          {/* CTA */}
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
            ENTER DASHBOARD →
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
          <div style={{ fontSize: 16, color: T.text3 }}>↓</div>
        </motion.div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{
        padding: '120px 48px', background: T.bg1,
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{
            fontSize: 8, fontFamily: T.mono, letterSpacing: 4,
            color: T.blue, marginBottom: 16,
          }}>CAPABILITIES</div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800,
            color: T.text0, letterSpacing: -1,
          }}>HOW IT WORKS</h2>
          <div style={{
            width: 60, height: 2, background: T.blue,
            margin: '16px auto 0', borderRadius: 1,
          }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24, maxWidth: 1100, margin: '0 auto',
        }}>
          {[
            {
              icon: '⚡',
              title: 'REAL-TIME EVENT MONITORING',
              desc: 'Ingest geopolitical shocks, natural disasters, and macro events from GDELT, USGS, and NewsAPI. Classified and routed in seconds.',
              color: T.red,
              tags: ['GDELT', 'USGS', 'NEWSAPI'],
            },
            {
              icon: '🕸️',
              title: 'KNOWLEDGE GRAPH TRAVERSAL',
              desc: 'S&P 500 supply chain relationships encoded in SurrealDB. LangGraph agents traverse multi-hop exposure paths to identify second-order risks.',
              color: T.blue,
              tags: ['SURREALDB', 'LANGGRAPH', 'GRAPH RAG'],
            },
            {
              icon: '🧠',
              title: 'AI-POWERED RISK SCORING',
              desc: 'Claude synthesizes graph traversal outputs with sector exposure data to produce ranked risk scores with natural language reasoning.',
              color: T.orange,
              tags: ['CLAUDE', 'ANTHROPIC', 'SONNET'],
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              style={{
                background: T.card, border: `1px solid ${f.color}25`,
                borderRadius: 8, padding: '32px 28px',
                backdropFilter: 'blur(12px)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`,
              }} />
              <div style={{ fontSize: 32, marginBottom: 20 }}>{f.icon}</div>
              <h3 style={{
                fontSize: 11, fontFamily: T.mono, fontWeight: 700,
                letterSpacing: 1.5, color: f.color, marginBottom: 14,
              }}>{f.title}</h3>
              <p style={{
                color: T.text1, fontSize: 13, lineHeight: 1.7, marginBottom: 22,
              }}>{f.desc}</p>
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

      {/* ═══ DATA FLOW ═══ */}
      <section style={{
        padding: '100px 48px', background: T.bg0,
        position: 'relative', zIndex: 2,
        borderTop: `1px solid ${T.border}`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            fontSize: 8, fontFamily: T.mono, letterSpacing: 4,
            color: T.blue, marginBottom: 16,
          }}>ARCHITECTURE</div>
          <h2 style={{
            fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800,
            color: T.text0, letterSpacing: -0.5, marginBottom: 24,
          }}>EVENT → GRAPH → SCORE → MAP</h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: 900, margin: '0 auto',
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8,
          }}
        >
          {[
            { step: '01', label: 'EVENT_INTAKE', desc: 'Ingest & classify' },
            { step: '02', label: 'GEO_RESOLVER', desc: 'Map to countries' },
            { step: '03', label: 'GRAPH_TRAVERSER', desc: 'Walk exposure edges' },
            { step: '04', label: 'RISK_SCORER', desc: 'Claude AI scoring' },
            { step: '05', label: 'HISTORICAL_REASONER', desc: 'Past event context' },
            { step: '06', label: 'NEWS_ENRICHER', desc: 'Latest headlines' },
            { step: '07', label: 'HEDGE_SUGGESTER', desc: 'Mitigation strategies' },
            { step: '08', label: 'REPORT_GENERATOR', desc: 'Executive summary' },
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
                borderRadius: 4, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                minWidth: 200,
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
                }}>{node.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ TECH STACK + FOOTER ═══ */}
      <section style={{
        padding: '100px 48px 60px', background: T.bg1,
        textAlign: 'center', position: 'relative', zIndex: 2,
        borderTop: `1px solid ${T.border}`,
      }}>
        <div style={{
          fontSize: 8, fontFamily: T.mono, letterSpacing: 4,
          color: T.blue, marginBottom: 16,
        }}>BUILT WITH</div>
        <h2 style={{
          fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800,
          color: T.text0, letterSpacing: -0.5, marginBottom: 48,
        }}>TECHNOLOGY STACK</h2>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 16,
          justifyContent: 'center', maxWidth: 800, margin: '0 auto 64px',
        }}>
          {[
            { name: 'Claude', desc: 'Anthropic AI for risk synthesis', color: T.orange },
            { name: 'SurrealDB', desc: 'Multi-model graph database', color: T.blue },
            { name: 'LangGraph', desc: 'Agent orchestration framework', color: T.green },
            { name: 'React + Vite', desc: 'Frontend + build tooling', color: T.text1 },
            { name: 'react-globe.gl', desc: '3D globe visualization', color: T.yellow },
          ].map(({ name, desc, color }) => (
            <motion.div
              key={name}
              whileHover={{ scale: 1.03, borderColor: `${color}60` }}
              style={{
                background: T.card, border: `1px solid ${color}30`,
                borderRadius: 6, padding: '16px 22px',
                backdropFilter: 'blur(8px)', textAlign: 'left',
                minWidth: 170, transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                fontSize: 14, fontWeight: 700, fontFamily: T.mono,
                color, marginBottom: 4,
              }}>{name}</div>
              <div style={{
                fontSize: 9, color: T.text2, fontFamily: T.mono,
              }}>{desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
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
          LAUNCH INTELLIGENCE DASHBOARD →
        </motion.button>

        {/* Footer */}
        <div style={{
          marginTop: 80, paddingTop: 32,
          borderTop: `1px solid ${T.border}`,
          fontSize: 8, fontFamily: T.mono, letterSpacing: 2,
          color: T.text4,
        }}>
          RISKTERRAIN · LONDON HACKATHON 2025 · BUILT WITH CLAUDE + SURREALDB + LANGGRAPH
        </div>
      </section>
    </motion.div>
  )
}
