import { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import Globe from 'react-globe.gl'
import type { GlobeMethods } from 'react-globe.gl'
import * as THREE from 'three'
import type { Company, DemoEvent } from '../data/mockData'
import { riskColor } from '../data/mockData'

interface GlobePoint {
  lat: number
  lng: number
  color: string
  size: number
  label: string
  ticker: string
}

interface GlobeRing {
  lat: number
  lng: number
  maxR: number
  propagationSpeed: number
  repeatPeriod: number
}

interface GlobeArc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  score: number
}

interface Globe3DProps {
  companies: Company[]
  activeEvent?: DemoEvent | null
  onCompanyClick?: (company: Company) => void
  enableAutoRotate?: boolean
  onGlobeReady?: (globe: GlobeMethods) => void
}

export default function Globe3D({
  companies,
  activeEvent,
  onCompanyClick,
  enableAutoRotate = true,
  onGlobeReady,
}: Globe3DProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Measure container so globe renders at correct size (not window size)
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
      return {
        lat: c.lat,
        lng: c.lng,
        color: riskColor(riskScore),
        size: riskScore > 0 ? 0.2 + riskScore * 0.5 : 0.12,
        label: c.ticker,
        ticker: c.ticker,
      }
    }),
    [companies, activeEvent]
  )

  const rings: GlobeRing[] = useMemo(() =>
    activeEvent
      ? [{
          lat: activeEvent.lat,
          lng: activeEvent.lng,
          maxR: 8,
          propagationSpeed: 2,
          repeatPeriod: 900,
        }]
      : [],
    [activeEvent]
  )

  const arcs: GlobeArc[] = useMemo(() => {
    if (!activeEvent) return []
    return Object.entries(activeEvent.risks)
      .map(([ticker, risk]) => {
        const company = companies.find(c => c.ticker === ticker)
        if (!company) return null
        return {
          startLat: activeEvent.lat,
          startLng: activeEvent.lng,
          endLat: company.lat,
          endLng: company.lng,
          score: risk.score,
        }
      })
      .filter((a): a is GlobeArc => a !== null)
  }, [activeEvent, companies])

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

    // Dark ocean material
    try {
      const mat = (globe as any).globeMaterial() as THREE.MeshPhongMaterial
      mat.color = new THREE.Color('#050a14')
      mat.emissive = new THREE.Color('#0a1628')
      mat.emissiveIntensity = 0.15
      mat.shininess = 15
      mat.specular = new THREE.Color('#0a2040')
    } catch { /* globe material not ready yet */ }

    // Scene background
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
          // Points
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="size"
          pointLabel={(p: object) => {
            const pt = p as GlobePoint
            return `<div style="
              background: rgba(8,13,26,0.95);
              border: 1px solid rgba(59,130,246,0.5);
              border-radius: 6px;
              padding: 6px 10px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              font-weight: 700;
              color: #F8FAFC;
              backdrop-filter: blur(8px);
            ">${pt.ticker}</div>`
          }}
          onPointClick={handlePointClick}
          // Arcs
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: object) => {
            const a = d as GlobeArc
            return a.score >= 0.8
              ? ['rgba(239,68,68,0.6)', 'rgba(239,68,68,0.2)']
              : ['rgba(249,115,22,0.5)', 'rgba(249,115,22,0.15)']
          }}
          arcStroke={(d: object) => {
            const a = d as GlobeArc
            return 0.3 + a.score * 1.2
          }}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={1500}
          arcAltitudeAutoScale={0.4}
          arcsTransitionDuration={800}
          // Rings
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor={() => (t: number) => `rgba(239,68,68,${1 - t})`}
          ringAltitude={0.002}
        />
      )}
    </div>
  )
}
