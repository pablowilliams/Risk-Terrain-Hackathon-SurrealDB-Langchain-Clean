import { useState, useMemo } from 'react'
import type { SupplyChainEdge, Company } from '../../data/mockData'
import { RELATIONSHIP_COLORS } from '../../data/mockData'

interface SupplyChainPanelProps {
  edges: SupplyChainEdge[]
  companies: Company[]
  selectedTicker: string | null
  onTickerSelect: (ticker: string | null) => void
}

const REL_LABELS: Record<string, string> = {
  chip_fab: 'Chip Fabrication',
  component: 'Components',
  ai_compute: 'AI Compute',
  cloud_provider: 'Cloud Provider',
  sector_peer: 'Sector Peer',
  logistics: 'Logistics',
  semiconductor: 'Semiconductor',
  manufacturing: 'Manufacturing',
  raw_materials: 'Raw Materials',
  software: 'Software',
  licensing: 'Licensing',
  energy: 'Energy',
  financial: 'Financial',
  supplies: 'Supplies',
  cloud_infrastructure: 'Cloud Infra',
}

function relLabel(rel: string): string {
  return REL_LABELS[rel] || rel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function SupplyChainPanel({
  edges, companies, selectedTicker, onTickerSelect
}: SupplyChainPanelProps) {
  const [search, setSearch] = useState('')

  const companyMap = useMemo(() => {
    const map: Record<string, Company> = {}
    for (const c of companies) map[c.ticker] = c
    return map
  }, [companies])

  const filtered = useMemo(() => {
    if (!search) return edges
    const q = search.toUpperCase()
    return edges.filter(e =>
      e.from_ticker.includes(q) || e.to_ticker.includes(q) ||
      (companyMap[e.from_ticker]?.name || '').toUpperCase().includes(q) ||
      (companyMap[e.to_ticker]?.name || '').toUpperCase().includes(q)
    )
  }, [edges, search, companyMap])

  const grouped = useMemo(() => {
    const groups: Record<string, SupplyChainEdge[]> = {}
    for (const edge of filtered) {
      const key = edge.relationship
      if (!groups[key]) groups[key] = []
      groups[key].push(edge)
    }
    return groups
  }, [filtered])

  const upstream = useMemo(() =>
    selectedTicker ? edges.filter(e => e.to_ticker === selectedTicker) : [],
    [edges, selectedTicker]
  )

  const downstream = useMemo(() =>
    selectedTicker ? edges.filter(e => e.from_ticker === selectedTicker) : [],
    [edges, selectedTicker]
  )

  const selectedCompany = useMemo(() =>
    selectedTicker ? companies.find(c => c.ticker === selectedTicker) : null,
    [companies, selectedTicker]
  )

  // Count unique companies
  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>()
    for (const e of edges) { set.add(e.from_ticker); set.add(e.to_ticker) }
    return set.size
  }, [edges])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 8,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{
              color: '#3B82F6', fontSize: 14, fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
            }}>{uniqueCompanies}</span>
            <span style={{
              color: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1,
            }}>COMPANIES</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{
              color: '#3B82F6', fontSize: 14, fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
            }}>{edges.length}</span>
            <span style={{
              color: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1,
            }}>LINKS</span>
          </div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search company or ticker..."
          style={{
            width: '100%', background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 4, padding: '6px 10px', color: '#F8FAFC',
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
            outline: 'none', boxSizing: 'border-box',
          }}
        />

        {/* Relationship legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {Object.entries(RELATIONSHIP_COLORS).map(([rel, color]) => {
            const count = (grouped[rel] || []).length
            if (count === 0) return null
            return (
              <span key={rel} style={{
                background: `${color}15`, border: `1px solid ${color}40`,
                color, fontSize: 7, padding: '2px 6px', borderRadius: 3,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {relLabel(rel)} {count}
              </span>
            )
          })}
        </div>
      </div>

      {/* Selected company detail */}
      {selectedTicker && (
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid rgba(59,130,246,0.15)',
          background: 'rgba(29,78,216,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{
                color: '#F8FAFC', fontSize: 13, fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {selectedTicker}
              </span>
              {selectedCompany && (
                <span style={{ color: '#94A3B8', fontSize: 10, marginLeft: 8 }}>
                  {selectedCompany.name}
                </span>
              )}
            </div>
            <button onClick={() => onTickerSelect(null)} style={{
              background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.3)',
              color: '#94A3B8', cursor: 'pointer', borderRadius: 4,
              width: 22, height: 22, fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>x</button>
          </div>

          {selectedCompany?.sector && (
            <div style={{
              display: 'inline-block', background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.25)', borderRadius: 3,
              padding: '1px 6px', fontSize: 8, color: '#93C5FD',
              fontFamily: 'JetBrains Mono, monospace', marginBottom: 8,
            }}>
              {selectedCompany.sector}
            </div>
          )}

          {upstream.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{
                color: '#10B981', fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: 1, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8V2M5 2L2 5M5 2L8 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                WHO SUPPLIES {selectedTicker} ({upstream.length})
              </div>
              {upstream.map(e => (
                <EdgeRow key={`${e.from_ticker}-${e.to_ticker}`} edge={e}
                  companyMap={companyMap} onTickerClick={onTickerSelect}
                  highlightTicker={e.from_ticker} />
              ))}
            </div>
          )}

          {downstream.length > 0 && (
            <div>
              <div style={{
                color: '#F59E0B', fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: 1, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2V8M5 8L2 5M5 8L8 5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {selectedTicker} SUPPLIES TO ({downstream.length})
              </div>
              {downstream.map(e => (
                <EdgeRow key={`${e.from_ticker}-${e.to_ticker}`} edge={e}
                  companyMap={companyMap} onTickerClick={onTickerSelect}
                  highlightTicker={e.to_ticker} />
              ))}
            </div>
          )}

          {upstream.length === 0 && downstream.length === 0 && (
            <div style={{
              color: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
              padding: '4px 0',
            }}>
              No direct supply chain links found
            </div>
          )}
        </div>
      )}

      {/* Intro when no ticker selected */}
      {!selectedTicker && edges.length > 0 && (
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid rgba(59,130,246,0.08)',
          background: 'rgba(59,130,246,0.04)',
        }}>
          <div style={{
            color: '#64748B', fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
            lineHeight: 1.6,
          }}>
            Click any ticker below to see who supplies them and who they supply.
            The globe shows these links as arcs.
          </div>
        </div>
      )}

      {/* Scrollable edge list grouped by relationship type */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}>
        {Object.entries(grouped)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([rel, relEdges]) => (
          <div key={rel} style={{ marginBottom: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
              background: 'rgba(15,23,42,0.5)', borderRadius: 4, marginBottom: 4,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: RELATIONSHIP_COLORS[rel] || '#3B82F6',
                boxShadow: `0 0 6px ${RELATIONSHIP_COLORS[rel] || '#3B82F6'}`,
              }} />
              <span style={{
                color: RELATIONSHIP_COLORS[rel] || '#3B82F6',
                fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: 1,
              }}>
                {relLabel(rel).toUpperCase()} ({relEdges.length})
              </span>
            </div>
            {relEdges
              .sort((a, b) => b.weight - a.weight)
              .map(edge => (
              <EdgeRow key={`${edge.from_ticker}-${edge.to_ticker}`}
                edge={edge} companyMap={companyMap}
                onTickerClick={onTickerSelect} />
            ))}
          </div>
        ))}
        {edges.length === 0 && (
          <div style={{
            textAlign: 'center', color: '#334155', padding: '30px 0', fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            LOADING SUPPLY CHAIN...
          </div>
        )}
      </div>
    </div>
  )
}


function EdgeRow({ edge, companyMap, onTickerClick, highlightTicker }: {
  edge: SupplyChainEdge
  companyMap: Record<string, Company>
  onTickerClick: (ticker: string) => void
  highlightTicker?: string
}) {
  const color = RELATIONSHIP_COLORS[edge.relationship] || '#3B82F6'
  const pct = Math.round(edge.weight * 100)
  const fromName = companyMap[edge.from_ticker]?.name
  const toName = companyMap[edge.to_ticker]?.name

  // Weight label for clarity
  const strengthLabel = pct >= 80 ? 'Critical' : pct >= 50 ? 'Major' : pct >= 20 ? 'Moderate' : 'Minor'

  return (
    <div style={{
      padding: '6px 10px', marginBottom: 2, borderRadius: 4,
      background: 'rgba(15,23,42,0.6)', border: `1px solid ${color}15`,
      cursor: 'pointer',
    }}
      onClick={() => onTickerClick(highlightTicker || edge.from_ticker)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span onClick={ev => { ev.stopPropagation(); onTickerClick(edge.from_ticker) }} style={{
          color: '#F8FAFC', fontSize: 10, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
          minWidth: 42,
        }}>
          {edge.from_ticker}
        </span>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1 5H11M11 5L8 2M11 5L8 8" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span onClick={ev => { ev.stopPropagation(); onTickerClick(edge.to_ticker) }} style={{
          color: '#F8FAFC', fontSize: 10, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
          minWidth: 42,
        }}>
          {edge.to_ticker}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          color: `${color}CC`, fontSize: 7, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: 0.5,
        }}>
          {strengthLabel}
        </span>
        <div style={{
          width: 32, height: 3, background: 'rgba(15,23,42,0.8)',
          borderRadius: 1, overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: `linear-gradient(90deg, ${color}60, ${color})`,
            borderRadius: 1,
          }} />
        </div>
        <span style={{
          color, fontSize: 8, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', minWidth: 24, textAlign: 'right',
        }}>
          {pct}%
        </span>
      </div>
      {/* Company names + description */}
      <div style={{ marginTop: 3, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {(fromName || toName) && (
          <span style={{
            color: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
          }}>
            {fromName || edge.from_ticker} supplies {toName || edge.to_ticker}
          </span>
        )}
      </div>
      {edge.description && (
        <div style={{ color: '#475569', fontSize: 8, lineHeight: 1.4, marginTop: 2 }}>
          {edge.description}
        </div>
      )}
    </div>
  )
}
