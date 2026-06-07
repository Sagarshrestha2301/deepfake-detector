import { useState } from 'react'
import FrameCard from './FrameCard.jsx'

const SORTS = [
  { key: 'risk-desc', label: 'Highest risk' },
  { key: 'risk-asc',  label: 'Lowest risk'  },
  { key: 'index',     label: 'Frame order'  },
]

export default function FrameGrid({ frames }) {
  const [filter, setFilter] = useState('All')
  const [sort, setSort]     = useState('risk-desc')

  const filtered = filter === 'All' ? frames : frames.filter(f => f.prediction === filter)
  const sorted   = [...filtered].sort((a, b) => {
    if (sort === 'risk-desc') return b.fake_prob - a.fake_prob
    if (sort === 'risk-asc')  return a.fake_prob - b.fake_prob
    return a.frame_index - b.frame_index
  })

  const fakeCount = frames.filter(f => f.prediction === 'FAKE').length
  const realCount = frames.length - fakeCount

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{
            fontSize: 15, fontWeight: 500,
            color: '#F0EDE6', marginBottom: 4,
            letterSpacing: '-0.2px',
          }}>
            Frame analysis
          </h2>
          <p style={{ fontSize: 12, color: '#4B5563', fontFamily: '"DM Mono", monospace' }}>
            <span style={{ color: '#EF4444' }}>{fakeCount} fake</span>
            {' · '}
            <span style={{ color: '#4AFF91' }}>{realCount} real</span>
            {' · '}
            {frames.length} total
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filter pills */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 999, padding: 3, gap: 2,
          }}>
            {['All', 'FAKE', 'REAL'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '4px 14px', fontSize: 11,
                fontWeight: 500, borderRadius: 999,
                border: 'none', cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif',
                background: filter === f
                  ? (f === 'FAKE' ? 'rgba(239,68,68,0.15)' : f === 'REAL' ? 'rgba(74,255,145,0.15)' : 'rgba(255,255,255,0.08)')
                  : 'transparent',
                color: filter === f
                  ? (f === 'FAKE' ? '#EF4444' : f === 'REAL' ? '#4AFF91' : '#F0EDE6')
                  : '#4B5563',
                transition: 'all 0.15s',
              }}>
                {f}
              </button>
            ))}
          </div>

          {/* Sort select */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              fontSize: 11, color: '#9CA3AF',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '6px 10px',
              cursor: 'pointer', outline: 'none',
              fontFamily: '"DM Mono", monospace',
            }}
          >
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Heatmap legend */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: '10px 14px',
        marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center',
        gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: '#4B5563', fontFamily: '"DM Mono", monospace' }}>
          Grad-CAM legend:
        </span>
        {[
          { color: '#EF4444', label: 'High attention (suspicious)' },
          { color: '#F59E0B', label: 'Medium attention' },
          { color: '#3B82F6', label: 'Low attention' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: '#374151', marginLeft: 'auto' }}>
          Click any frame to enlarge
        </span>
      </div>

      {sorted.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem',
          color: '#374151', fontSize: 13,
          fontFamily: '"DM Mono", monospace',
        }}>
          No frames match this filter.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {sorted.map(frame => <FrameCard key={frame.frame_index} frame={frame} />)}
        </div>
      )}
    </div>
  )
}