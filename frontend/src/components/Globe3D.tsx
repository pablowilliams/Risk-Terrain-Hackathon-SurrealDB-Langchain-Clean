import { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import Globe from 'react-globe.gl'
import type { GlobeMethods } from 'react-globe.gl'
import * as THREE from 'three'
import type { Company, DemoEvent, SupplyChainEdge } from '../data/mockData'
import { riskColor, RELATIONSHIP_COLORS } from '../data/mockData'

interface GlobePoint {
  lat: number
  lng: number
  color: string
  size: number
  ticker: string
  name: string
  sector: string
  mc: number
  riskScore: number
  riskReasoning: string
  isHighlighted: boolean
  inWatchlist: boolean
}

interface HtmlLabel {
  lat: number
  lng: number
  ticker: string
  color: string
  riskScore: number
}

interface GlobeRing {
  lat: number
  lng: number
  maxR: number
  propagationSpeed: number
  repeatPeriod: number
  color: string
}

interface GlobeArc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  score: number
  _type: 'event'
}

interface SupplyArc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  relationship: string
  weight: number
  color: string
  _type: 'supply'
}

type AnyArc = GlobeArc | SupplyArc

interface Globe3DProps {
  companies: Company[]
  activeEvent?: DemoEvent | null
  supplyChainEdges?: SupplyChainEdge[]
  showSupplyChain?: boolean
  highlightTicker?: string | null
  affectedTickers?: string[] | null
  watchlistTickers?: Set<string> | null
  onCompanyClick?: (company: Company) => void
  enableAutoRotate?: boolean
  onGlobeReady?: (globe: GlobeMethods) => void
  minimal?: boolean
}

export default function Globe3D({
  companies,
  activeEvent,
  supplyChainEdges,
  showSupplyChain = false,
  highlightTicker,
  affectedTickers,
  watchlistTickers,
  onCompanyClick,
  enableAutoRotate = true,
  onGlobeReady,
  minimal = false,
}: Globe3DProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    ro.observe(el)
    setDimensions({ width: el.offsetWidth, height: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  const points: GlobePoint[] = useMemo(() =>
    companies.map(c => {
      const riskScore = activeEvent?.risks[c.ticker]?.score ?? 0
      const riskReasoning = activeEvent?.risks[c.ticker]?.reasoning ?? ''
      const isHighlighted = highlightTicker === c.ticker
      const inWatchlist = !watchlistTickers || watchlistTickers.size === 0 || watchlistTickers.has(c.ticker)
      return {
        lat: c.lat,
        lng: c.lng,
        color: !inWatchlist ? '#1E293B' : isHighlighted ? '#F8FAFC' : riskColor(riskScore),
        size: !inWatchlist ? 0.05 : isHighlighted ? 0.6 : (riskScore > 0 ? 0.2 + riskScore * 0.5 : 0.15),
        ticker: c.ticker,
        name: c.name,
        sector: c.sector,
        mc: c.mc,
        riskScore,
        riskReasoning,
        isHighlighted,
        inWatchlist,
      }
    }),
    [companies, activeEvent, highlightTicker, watchlistTickers]
  )

  // Persistent HTML labels for at-risk / highlighted companies (hidden in minimal mode)
  const htmlLabels: HtmlLabel[] = useMemo(() => {
    if (minimal) return []
    return points
      .filter(p => p.inWatchlist && (p.riskScore > 0 || p.isHighlighted))
      .map(p => ({
        lat: p.lat,
        lng: p.lng,
        ticker: p.ticker,
        color: p.color,
        riskScore: p.riskScore,
      }))
  }, [points, minimal])

  // Rings: event epicenter + pulsing rings around at-risk companies
  const rings: GlobeRing[] = useMemo(() => {
    const result: GlobeRing[] = []
    if (activeEvent) {
      // Main event epicenter ring
      result.push({
        lat: activeEvent.lat,
        lng: activeEvent.lng,
        maxR: 8,
        propagationSpeed: 2,
        repeatPeriod: 900,
        color: '#EF4444',
      })
      // Subtle pulse rings around at-risk companies
      for (const [ticker, risk] of Object.entries(activeEvent.risks)) {
        if (risk.score < 0.4) continue
        if (watchlistTickers && watchlistTickers.size > 0 && !watchlistTickers.has(ticker)) continue
        const company = companies.find(c => c.ticker === ticker)
        if (company) {
          result.push({
            lat: company.lat,
            lng: company.lng,
            maxR: 1 + risk.score * 1.5,
            propagationSpeed: 0.6 + risk.score * 0.8,
            repeatPeriod: 1400,
            color: riskColor(risk.score),
          })
        }
      }
    }
    return result
  }, [activeEvent, companies, watchlistTickers])

  // Event-to-company arcs
  const eventArcs: GlobeArc[] = useMemo(() => {
    if (!activeEvent) return []
    return Object.entries(activeEvent.risks)
      .map(([ticker, risk]) => {
        if (watchlistTickers && watchlistTickers.size > 0 && !watchlistTickers.has(ticker)) return null
        const company = companies.find(c => c.ticker === ticker)
        if (!company) return null
        return {
          startLat: activeEvent.lat,
          startLng: activeEvent.lng,
          endLat: company.lat,
          endLng: company.lng,
          score: risk.score,
          _type: 'event' as const,
        }
      })
      .filter((a): a is GlobeArc => a !== null)
  }, [activeEvent, companies, watchlistTickers])

  // Supply chain arcs (company-to-company)
  const supplyArcs: SupplyArc[] = useMemo(() => {
    if (!showSupplyChain || !supplyChainEdges || supplyChainEdges.length === 0) return []

    return supplyChainEdges
      .filter(edge => {
        if (watchlistTickers && watchlistTickers.size > 0) {
          if (!watchlistTickers.has(edge.from_ticker) && !watchlistTickers.has(edge.to_ticker)) return false
        }
        if (highlightTicker) {
          return edge.from_ticker === highlightTicker || edge.to_ticker === highlightTicker
        }
        if (affectedTickers && affectedTickers.length > 0) {
          return affectedTickers.includes(edge.from_ticker) || affectedTickers.includes(edge.to_ticker)
        }
        return edge.weight >= 0.25
      })
      .map(edge => {
        const fromCompany = companies.find(c => c.ticker === edge.from_ticker)
        const toCompany = companies.find(c => c.ticker === edge.to_ticker)
        if (!fromCompany || !toCompany) return null
        return {
          startLat: fromCompany.lat,
          startLng: fromCompany.lng,
          endLat: toCompany.lat,
          endLng: toCompany.lng,
          relationship: edge.relationship,
          weight: edge.weight,
          color: RELATIONSHIP_COLORS[edge.relationship] || '#3B82F6',
          _type: 'supply' as const,
        }
      })
      .filter((a): a is SupplyArc => a !== null)
  }, [showSupplyChain, supplyChainEdges, companies, highlightTicker, affectedTickers, watchlistTickers])

  const allArcs: AnyArc[] = useMemo(() => {
    return [...supplyArcs, ...eventArcs]
  }, [eventArcs, supplyArcs])

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return

    if (enableAutoRotate) {
      const controls = globe.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.4
      controls.enableDamping = true
      controls.dampingFactor = 0.05
    }

    try {
      const mat = (globe as any).globeMaterial() as THREE.MeshPhongMaterial
      mat.color = new THREE.Color('#050a14')
      mat.emissive = new THREE.Color('#0a1628')
      mat.emissiveIntensity = 0.15
      mat.shininess = 15
      mat.specular = new THREE.Color('#0a2040')
    } catch { /* globe material not ready yet */ }

    globe.scene().background = new THREE.Color('#080D1A')

    if (onGlobeReady) onGlobeReady(globe)
  }, [enableAutoRotate, onGlobeReady])

  const handlePointClick = useCallback(
    (point: object) => {
      const p = point as GlobePoint
      const company = companies.find(c => c.ticker === p.ticker)
      if (company && onCompanyClick) onCompanyClick(company)
    },
    [companies, onCompanyClick],
  )

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          onGlobeReady={handleGlobeReady}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#1a6bcc"
          atmosphereAltitude={0.18}
          showAtmosphere={true}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="size"
          pointLabel={(p: object) => {
            const pt = p as GlobePoint
            if (!pt.inWatchlist) return ''
            if (minimal) {
              return `<div style="
                background:rgba(8,13,26,0.95);
                border:1px solid rgba(59,130,246,0.5);
                border-radius:6px;
                padding:6px 10px;
                font-family:'JetBrains Mono',monospace;
                font-size:11px;
                font-weight:700;
                color:#F8FAFC;
                backdrop-filter:blur(8px);
              ">${pt.ticker}</div>`
            }
            const borderColor = pt.riskScore > 0 ? pt.color : 'rgba(59,130,246,0.5)'
            const riskPct = Math.round(pt.riskScore * 100)
            const riskLevel = pt.riskScore >= 0.8 ? 'CRITICAL'
              : pt.riskScore >= 0.6 ? 'HIGH'
              : pt.riskScore >= 0.4 ? 'MEDIUM'
              : pt.riskScore >= 0.2 ? 'LOW' : ''

            let riskHTML = ''
            if (pt.riskScore > 0) {
              const reason = pt.riskReasoning
                ? `<div style="color:#64748B;font-size:9px;line-height:1.5;max-width:200px;margin-top:4px;">${pt.riskReasoning.slice(0, 120)}${pt.riskReasoning.length > 120 ? '...' : ''}</div>`
                : ''
              riskHTML = `
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(59,130,246,0.15);">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:7px;height:7px;border-radius:50%;background:${pt.color};box-shadow:0 0 8px ${pt.color}80;flex-shrink:0;"></div>
                    <span style="color:${pt.color};font-size:11px;font-weight:800;letter-spacing:1px;">${riskPct}% ${riskLevel}</span>
                  </div>
                  ${reason}
                </div>`
            }

            const mcStr = pt.mc >= 1000 ? `$${(pt.mc / 1000).toFixed(1)}T` : `$${pt.mc}B`

            return `<div style="
              background:rgba(8,13,26,0.97);
              border:1px solid ${borderColor};
              border-radius:8px;
              padding:12px 16px;
              font-family:'JetBrains Mono',monospace;
              backdrop-filter:blur(12px);
              min-width:170px;
              max-width:250px;
              box-shadow:0 8px 32px rgba(0,0,0,0.6),0 0 20px ${borderColor}20;
            ">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                <span style="color:${pt.color};font-size:14px;font-weight:800;letter-spacing:1px;">${pt.ticker}</span>
                <span style="color:#334155;font-size:8px;letter-spacing:1px;margin-left:auto;">${pt.sector}</span>
              </div>
              <div style="color:#94A3B8;font-size:10px;margin-bottom:3px;">${pt.name}</div>
              <div style="color:#475569;font-size:9px;">MCap ${mcStr}</div>
              ${riskHTML}
            </div>`
          }}
          onPointClick={handlePointClick}
          htmlElementsData={htmlLabels}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.025}
          htmlElement={(d: object) => {
            const label = d as HtmlLabel
            const el = document.createElement('div')
            const pct = Math.round(label.riskScore * 100)
            el.style.cssText = `
              font-family:'JetBrains Mono',monospace;
              font-size:${label.riskScore > 0 ? 9 : 8}px;
              font-weight:700;
              color:${label.color};
              background:rgba(8,13,26,0.88);
              border:1px solid ${label.color}50;
              border-radius:4px;
              padding:2px 6px;
              pointer-events:none;
              white-space:nowrap;
              text-shadow:0 0 8px ${label.color}60;
              transform:translate(-50%,-140%);
              letter-spacing:0.5px;
            `
            if (label.riskScore > 0) {
              el.innerHTML = `${label.ticker} <span style="font-size:7px;opacity:0.7">${pct}%</span>`
            } else {
              el.textContent = label.ticker
            }
            return el
          }}
          arcsData={allArcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: object) => {
            const a = d as AnyArc
            if (a._type === 'supply') {
              const sa = a as SupplyArc
              return [`${sa.color}90`, `${sa.color}40`]
            }
            const ea = a as GlobeArc
            return ea.score >= 0.8
              ? ['rgba(239,68,68,0.6)', 'rgba(239,68,68,0.2)']
              : ['rgba(249,115,22,0.5)', 'rgba(249,115,22,0.15)']
          }}
          arcStroke={(d: object) => {
            const a = d as AnyArc
            if (a._type === 'supply') {
              return 0.2 + (a as SupplyArc).weight * 0.8
            }
            return 0.3 + (a as GlobeArc).score * 1.2
          }}
          arcDashLength={(d: object) => (d as AnyArc)._type === 'supply' ? 0.6 : 0.4}
          arcDashGap={(d: object) => (d as AnyArc)._type === 'supply' ? 0.3 : 0.2}
          arcDashAnimateTime={(d: object) => (d as AnyArc)._type === 'supply' ? 2500 : 1500}
          arcAltitudeAutoScale={0.4}
          arcsTransitionDuration={800}
          arcLabel={(d: object) => {
            const a = d as AnyArc
            if (a._type === 'supply') {
              const sa = a as SupplyArc
              return `<div style="
                background: rgba(8,13,26,0.95);
                border: 1px solid ${sa.color}80;
                border-radius: 6px;
                padding: 6px 10px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                color: #F8FAFC;
              ">
                <span style="color: ${sa.color}; font-weight: 700;">
                  ${sa.relationship.replace(/_/g, ' ').toUpperCase()}
                </span>
                <br/>Weight: ${(sa.weight * 100).toFixed(0)}%
              </div>`
            }
            return ''
          }}
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor={(d: object) => {
            const ring = d as GlobeRing
            const hex = ring.color
            const r = parseInt(hex.slice(1, 3), 16)
            const g = parseInt(hex.slice(3, 5), 16)
            const b = parseInt(hex.slice(5, 7), 16)
            return (t: number) => `rgba(${r},${g},${b},${1 - t})`
          }}
          ringAltitude={0.002}
        />
      )}
    </div>
  )
}
