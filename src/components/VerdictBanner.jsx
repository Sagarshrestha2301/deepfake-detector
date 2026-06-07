export default function VerdictBanner({ result }) {
  const isFake   = result.verdict === 'FAKE'
  const confPct  = (result.confidence * 100).toFixed(1)
  const ratioPct = (result.fake_frame_ratio * 100).toFixed(0)

  const accent   = isFake ? '#EF4444' : '#4AFF91'
  const accentBg = isFake ? 'rgba(239,68,68,0.08)' : 'rgba(74,255,145,0.08)'
  const accentBorder = isFake ? 'rgba(239,68,68,0.2)' : 'rgba(74,255,145,0.2)'

  const riskLabel = result.confidence >= 0.80
    ? 'High confidence'
    : result.confidence >= 0.50
    ? 'Medium confidence'
    : 'Low confidence'

  return (
    <div style={{ padding: '2rem 0 0' }}>

      {/* ── Big verdict ── */}
      <div style={{
        background: accentBg,
        border: `1px solid ${accentBorder}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 16,
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{
              fontSize: 10, letterSpacing: '1.5px', color: '#4B5563',
              textTransform: 'uppercase', marginBottom: 10,
              fontFamily: '"DM Mono", monospace',
            }}>
              Verdict
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 'clamp(2.8rem, 10vw, 5rem)',
                fontWeight: 600,
                color: accent,
                letterSpacing: '-3px',
                lineHeight: 1,
                fontFamily: '"DM Sans", sans-serif',
              }}>
                {result.verdict}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500,
                padding: '4px 12px', borderRadius: 999,
                background: accentBg,
                color: accent,
                border: `1px solid ${accentBorder}`,
                fontFamily: '"DM Mono", monospace',
                letterSpacing: '0.5px',
                alignSelf: 'center',
              }}>
                {riskLabel}
              </span>
            </div>
          </div>

          {/* Circular confidence gauge */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="45" cy="45" r="38" fill="none"
                stroke={accent} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - result.confidence)}`}
                transform="rotate(-90 45 45)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x="45" y="41" textAnchor="middle" fill={accent} fontSize="16" fontWeight="600" fontFamily="DM Mono, monospace">
                {confPct}%
              </text>
              <text x="45" y="56" textAnchor="middle" fill="#4B5563" fontSize="9" fontFamily="DM Mono, monospace">
                P(fake)
              </text>
            </svg>
          </div>
        </div>

        {/* Plain-English summary */}
        <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7, maxWidth: 600 }}>
          {isFake
            ? `${ratioPct}% of analysed frames show signs of manipulation. The Grad-CAM heatmaps below highlight exactly which facial regions the model found suspicious — look for red areas around the mouth, eyes, and hairline.`
            : `Only ${ratioPct}% of frames were flagged. The video appears authentic. Grad-CAM attention is distributed naturally across the face with no concentrated manipulation artifacts.`
          }
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10,
        marginBottom: 16,
      }}>
        {[
          { label: 'Mean P(fake)',  value: `${confPct}%`,             color: accent },
          { label: 'Fake frames',   value: `${result.fake_frames}/${result.total_frames}`, color: '#F0EDE6' },
          { label: 'Threshold',     value: `${(result.threshold_used * 100).toFixed(0)}%`, color: '#F0EDE6' },
          { label: 'Process time',  value: `${result.processing_time_s}s`,                 color: '#F0EDE6' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '1rem 1.125rem',
          }}>
            <p style={{
              fontSize: 10, color: '#4B5563', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.8px',
              fontFamily: '"DM Mono", monospace',
            }}>
              {label}
            </p>
            <p style={{
              fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
              fontWeight: 500, color,
              fontFamily: '"DM Mono", monospace',
              letterSpacing: '-0.5px',
            }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Confidence bar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: '#6B7280', fontFamily: '"DM Mono", monospace' }}>
            Confidence distribution across {result.total_frames} frames
          </p>
          <p style={{ fontSize: 12, fontWeight: 500, color: accent, fontFamily: '"DM Mono", monospace' }}>
            {confPct}%
          </p>
        </div>

        <div style={{
          height: 6, background: 'rgba(255,255,255,0.06)',
          borderRadius: 999, overflow: 'hidden', position: 'relative',
        }}>
          {/* 50% threshold marker */}
          <div style={{
            position: 'absolute', left: '50%', top: 0, bottom: 0,
            width: 1, background: 'rgba(255,255,255,0.15)', zIndex: 1,
          }} />
          <div style={{
            height: '100%',
            width: `${confPct}%`,
            background: isFake
              ? 'linear-gradient(90deg, rgba(239,68,68,0.5), #EF4444)'
              : 'linear-gradient(90deg, rgba(74,255,145,0.5), #4AFF91)',
            borderRadius: 999,
            transition: 'width 1s ease',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: '#374151', fontFamily: '"DM Mono", monospace' }}>0 — Real</span>
          <span style={{ fontSize: 10, color: '#374151', fontFamily: '"DM Mono", monospace' }}>50% threshold</span>
          <span style={{ fontSize: 10, color: '#374151', fontFamily: '"DM Mono", monospace' }}>100 — Fake</span>
        </div>
      </div>
    </div>
  )
}