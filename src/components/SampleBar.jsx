/**
 * SampleBar.jsx — Redesigned to match reference image
 * Cards: tinted bg, badge + play icon top row, label, desc, Analyse button
 */
import { useState } from 'react'

const SAMPLES = [
  { label: 'Interview',  file: '/samples/Real1.mp4',  type: 'real', desc: 'Authentic news footage'     },
  { label: 'News clip',  file: '/samples/Real.mp4',   type: 'real', desc: 'Unaltered broadcast clip'   },
  { label: 'Deepfake A', file: '/samples/Fake1.mp4',  type: 'fake', desc: 'Face-swap manipulation'     },
  { label: 'Deepfake B', file: '/samples/Fake.mp4',   type: 'fake', desc: 'Neural texture synthesis'   },
]

export default function SampleBar({ onUpload }) {
  const [loading, setLoading] = useState(null)
  const [preview, setPreview] = useState(null)

  async function runSample(sample) {
    setPreview(null)
    setLoading(sample.file)
    try {
      const res  = await fetch(sample.file)
      const blob = await res.blob()
      const file = new File([blob], sample.file.split('/').pop(), { type: 'video/mp4' })
      onUpload(file)
    } catch {
      alert('Could not load sample video.')
    } finally {
      setLoading(null)
    }
  }

  const isReal = (s) => s.type === 'real'
  const accent  = (s) => isReal(s) ? '#22c55e' : '#ef4444'
  const bgCard  = (s) => isReal(s) ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)'
  const border  = (s) => isReal(s) ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'
  const btnBg   = (s) => isReal(s) ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.1)'
  const btnTop  = (s) => isReal(s) ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'

  return (
    <>
      <div style={{ width: '100%', maxWidth: 760 }}>
        {/* Section label */}
        <p style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: 11,
          letterSpacing: '2.5px',
          color: '#000000',
          textAlign: 'center',
          marginBottom: 20,
          textTransform: 'uppercase',
        }}>
          TRY SAMPLE VIDEOS
        </p>

        {/* 4-column card grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {SAMPLES.map(s => (
            <div key={s.file} style={{
              background: bgCard(s),
              border: `1px solid ${border(s)}`,
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Card body — clickable to preview */}
              <button
                onClick={() => setPreview(s)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '14px 14px 12px',
                  textAlign: 'left',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {/* Top row: badge + play icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '1.5px',
                    color: accent(s),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: accent(s), display: 'inline-block', flexShrink: 0,
                    }} />
                    {s.type.toUpperCase()}
                  </span>
                  <span style={{
                    width: 24, height: 24,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6B7280',
                    fontSize: 10,
                    flexShrink: 0,
                  }}>▶</span>
                </div>

                {/* Label */}
                <p style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#000000',
                  margin: '2px 0 0',
                }}>
                  {s.label}
                </p>

                {/* Description */}
                <p style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: '#000000',
                  lineHeight: 1.4,
                }}>
                  {s.desc}
                </p>
              </button>

              {/* Analyse button */}
              <button
                onClick={() => runSample(s)}
                disabled={loading === s.file}
                style={{
                  background: btnBg(s),
                  borderTop: `1px solid ${btnTop(s)}`,
                  border: 'none',
                  borderTop: `1px solid ${btnTop(s)}`,
                  padding: '10px',
                  cursor: loading === s.file ? 'wait' : 'pointer',
                  color: accent(s),
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.2px',
                  opacity: loading === s.file ? 0.5 : 1,
                  transition: 'opacity 0.15s, background 0.15s',
                  width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.background = isReal(s) ? 'rgba(34,197,94,0.16)' : 'rgba(239,68,68,0.16)'}
                onMouseLeave={e => e.currentTarget.style.background = btnBg(s)}
              >
                {loading === s.file ? 'Loading…' : 'Analyse →'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Video preview modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0D1017',
              border: `1px solid ${isReal(preview) ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 16,
              overflow: 'hidden',
              maxWidth: 680, width: '100%',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 999,
                  fontFamily: '"DM Mono", monospace',
                  letterSpacing: '0.8px',
                  background: isReal(preview) ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: accent(preview),
                  border: `1px solid ${isReal(preview) ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}>
                  {preview.type.toUpperCase()}
                </span>
                <span style={{ fontSize: 14, color: '#9CA3AF' }}>{preview.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => runSample(preview)}
                  style={{
                    fontSize: 12, padding: '7px 16px', borderRadius: 8,
                    background: accent(preview),
                    color: isReal(preview) ? '#030712' : '#fff',
                    border: 'none', cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Analyse this video →
                </button>
                <button
                  onClick={() => setPreview(null)}
                  style={{
                    width: 32, height: 32,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, color: '#6B7280',
                    cursor: 'pointer', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            </div>
            <video src={preview.file} controls autoPlay
              style={{ width: '100%', display: 'block', maxHeight: '55vh', background: '#000' }} />
            <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)' }}>
              <p style={{ fontSize: 11, color: '#374151', fontFamily: '"DM Mono", monospace' }}>
                Ground truth: <span style={{ color: accent(preview) }}>{preview.type.toUpperCase()}</span> · Click outside to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}