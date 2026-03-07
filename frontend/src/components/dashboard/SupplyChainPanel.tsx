import { useState, useMemo } from 'react'
import type { SupplyChainEdge, Company } from '../../data/mockData'
import { RELATIONSHIP_COLORS } from '../../data/mockData'

interface SupplyChainPanelProps {
  edges: SupplyChainEdge[]
  companies: Company[]
  selectedTicker: string | null
  onTickerSelect: (ticker: string | null) => void
}

export default function SupplyChainPanel({
  edges, companies, selectedTicker, onTickerSelect
}: SupplyChainPanelProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return edges
    const q = search.toUpperCase()
    return edges.filter(e =>
      e.from_ticker.includes(q) || e.to_ticker.includes(q)
    )
  }, [edges, search])

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header + Search */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
        <div style={{
          color: '#64748B', fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: 2, marginBottom: 8,
        }}>
          SUPPLY CHAIN GRAPH -- {edges.length} EDGES
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="SEARCH TICKER..."
          style={{
            width: '100%', background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 4, padding: '6px 10px', color: '#F8FAFC',
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {Object.entries(RELATIONSHIP_COLORS).map(([rel, color]) => {
            const count = (grouped[rel] || []).length
            if (count === 0) return null
            return (
              <span key={rel} style={{
                background: `${color}15`, border: `1px solid ${color}40`,
                color, fontSize: 8, padding: '2px 6px', borderRadius: 3,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {rel.replace(/_/g, ' ').toUpperCase()}: {count}
              </span>
            )
          })}
        </div>
      </div>

      {/* Selected company detail */}
      {selectedTicker && (
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid rgba(59,130,246,0.15)',
          background: 'rgba(29,78,216,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{
                color: '#F8FAFC', fontSize: 12, fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {selectedTicker}
              </span>
              {selectedCompany && (
                <span style={{ color: '#64748B', fontSize: 9, marginLeft: 8 }}>
                  {selectedCompany.name}
                </span>
              )}
            </div>
            <button onClick={() => onTickerSelect(null)} style={{
              background: 'none', border: '1px solid rgba(100,116,139,0.3)',
              color: '#64748B', cursor: 'pointer', borderRadius: 4,
              width: 20, height: 20, fontSize: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>x</button>
          </div>

          {upstream.length > 0 && (
            <>
              <div style={{
                color: '#10B981', fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: 1, marginTop: 4, marginBottom: 4,
              }}>
                SUPPLIERS ({upstream.length})
              </div>
              {upstream.map(e => (
                <EdgeRow key={`${e.from_ticker}-${e.to_ticker}`} edge={e}
                  onTickerClick={onTickerSelect} />
              ))}
            </>
          )}

          {downstream.length > 0 && (
            <>
              <div style={{
                color: '#F59E0B', fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: 1, marginTop: 6, marginBottom: 4,
              }}>
                CUSTOMERS ({downstream.length})
              </div>
              {downstream.map(e => (
                <EdgeRow key={`${e.from_ticker}-${e.to_ticker}`} edge={e}
                  onTickerClick={onTickerSelect} />
              ))}
            </>
          )}
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
                {rel.replace(/_/g, ' ').toUpperCase()} ({relEdges.length})
              </span>
            </div>
            {relEdges
              .sort((a, b) => b.weight - a.weight)
              .map(edge => (
              <EdgeRow key={`${edge.from_ticker}-${edge.to_ticker}`}
                edge={edge} onTickerClick={onTickerSelect} />
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


function EdgeRow({ edge, onTickerClick }: {
  edge: SupplyChainEdge
  onTickerClick: (ticker: string) => void
}) {
  const color = RELATIONSHIP_COLORS[edge.relationship] || '#3B82F6'
  const pct = Math.round(edge.weight * 100)

  return (
    <div style={{
      padding: '6px 10px', marginBottom: 2, borderRadius: 4,
      background: 'rgba(15,23,42,0.6)', border: `1px solid ${color}15`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span onClick={() => onTickerClick(edge.from_ticker)} style={{
          color: '#F8FAFC', fontSize: 10, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
          minWidth: 42,
        }}>
          {edge.from_ticker}
        </span>
        <span style={{ color, fontSize: 10 }}>{'->'}</span>
        <span onClick={() => onTickerClick(edge.to_ticker)} style={{
          color: '#F8FAFC', fontSize: 10, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
          minWidth: 42,
        }}>
          {edge.to_ticker}
        </span>
        <div style={{ flex: 1, height: 3, background: 'rgba(15,23,42,0.8)',
          borderRadius: 1, overflow: 'hidden', marginLeft: 4 }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: `linear-gradient(90deg, ${color}60, ${color})`,
            borderRadius: 1,
          }} />
        </div>
        <span style={{
          color, fontSize: 9, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', minWidth: 28, textAlign: 'right',
        }}>
          {pct}%
        </span>
      </div>
      <div style={{ color: '#64748B', fontSize: 8, lineHeight: 1.4, marginTop: 3 }}>
        {edge.description}
      </div>
    </div>
  )
}
