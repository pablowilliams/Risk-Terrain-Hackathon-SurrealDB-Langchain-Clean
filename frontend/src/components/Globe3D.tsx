import { useRef, useEffect, useCallback, useMemo } from 'react'
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

  const points: GlobePoint[] = useMemo(() =>
    companies.map(c => {
      const riskScore = activeEvent?.risks[c.ticker]?.score ?? 0
      return {
        lat: c.lat,
        lng: c.lng,
        color: riskColor(riskScore),
        size: riskScore > 0 ? 0.3 + riskScore * 0.7 : 0.2,
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

  useEffect(() => {
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
    const mat = (globe as any).globeMaterial() as THREE.MeshPhongMaterial
    mat.color = new THREE.Color('#050a14')
    mat.emissive = new THREE.Color('#0a1628')
    mat.emissiveIntensity = 0.15
    mat.shininess = 15
    mat.specular = new THREE.Color('#0a2040')

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
    <Globe
      ref={globeRef}
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
  )
}
