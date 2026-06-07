import { useState } from 'react'

function tier(prob) {
  if (prob >= 0.80) return { label: 'High',   color: '#dc2626', bg: '#fff0f0', accent: '#dc2626' }
  if (prob >= 0.50) return { label: 'Medium', color: '#b45309', bg: '#fffbeb', accent: '#f59e0b' }
  return                   { label: 'Low',    color: '#166534', bg: '#f0fdf4', accent: '#16a34a' }
}

export default function FrameCard({ frame }) {
  const [open, setOpen] = useState(false)
  const isFake = frame.prediction === 'FAKE'
  const pct    = (frame.fake_prob * 100).toFixed(1)
  const t      = tier(frame.fake_prob)
  const src    = `data:image/png;base64,${frame.heatmap_b64}`

  return (
    <>
      <div style={{
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderLeft: `3px solid ${isFake ? t.accent : '#16a34a'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
        onClick={() => setOpen(true)}
      >
        <div style={{ position: 'relative', aspectRatio: '4/3', background: '#111', overflow: 'hidden' }}>
          <img src={src} alt={`Frame ${frame.frame_index + 1} heatmap`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: isFake ? '#dc2626' : '#16a34a', color: '#fff', letterSpacing: '0.3px' }}>
              {frame.prediction}
            </span>
          </div>
          {isFake && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 6, background: t.bg, color: t.color, border: `1px solid ${t.color}20` }}>
                {t.label}
              </span>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Frame {frame.frame_index + 1}</p>
          </div>
        </div>

        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#aaa' }}>P(fake)</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: isFake ? '#dc2626' : '#16a34a' }}>{pct}%</span>
          </div>
          <div style={{ height: 4, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: isFake ? t.accent : '#16a34a', borderRadius: 999 }} />
          </div>
        </div>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', maxWidth: 600, width: '100%' }}>
            <img src={src} alt="Full size heatmap" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 2 }}>Frame {frame.frame_index + 1} — {frame.prediction}</p>
                <p style={{ fontSize: 12, color: '#888' }}>P(fake) = {pct}% · Grad-CAM attention map</p>
              </div>
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, background: isFake ? '#fff0f0' : '#f0fdf4', color: isFake ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
                {isFake ? `${t.label} risk` : 'Authentic'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}