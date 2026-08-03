export default function VerdictBanner({ result }) {
  const isFake   = result.verdict === 'FAKE'
  const confPct  = (result.confidence * 100).toFixed(1)
  const ratioPct = (result.fake_frame_ratio * 100).toFixed(0)

  // Restrained palette — ink on white, single accent that shifts by verdict.
  // No neon, no heavy gradients. Accent is desaturated enough to feel calm.
  const accent     = isFake ? '#D14343' : '#1D7A4C'
  const hairline    = 'rgba(0,0,0,0.08)'
  const ink         = '#000000'
  const inkMuted    = '#000000'
  const inkFaint    = '#000000'

  const riskLabel = result.confidence >= 0.80
    ? 'High confidence'
    : result.confidence >= 0.50
    ? 'Medium confidence'
    : 'Low confidence'

  const displayFont = '"SF Pro Display", "Inter", -apple-system, sans-serif'
  const bodyFont    = '"SF Pro Text", "Inter", -apple-system, sans-serif'
  const monoFont    = '"SF Mono", "IBM Plex Mono", monospace'

  return (
    <div style={{ padding: '0', background: '#FFFFFF', fontFamily: bodyFont }}>

      {/* ── Status pill (glass) ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${hairline}`,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: accent,
          }} />
          <span style={{
            fontSize: 11, color: inkMuted, fontFamily: monoFont,
            letterSpacing: '0.3px',
          }}>
            Analysis complete · {result.processing_time_s}s
          </span>
        </div>
      </div>

      {/* ── Hero verdict ── */}
      <div style={{ marginBottom: 56, textAlign: 'left' }}>
        <p style={{
          fontSize: 11, letterSpacing: '2px', color: inkMuted,
          textTransform: 'uppercase', marginBottom: 16,
          fontFamily: monoFont, fontWeight: 500,
        }}>
          Verdict
        </p>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{
            fontSize: 'clamp(3.5rem, 11vw, 7rem)',
            fontWeight: 200,
            color: ink,
            letterSpacing: '-4px',
            lineHeight: 0.95,
            fontFamily: displayFont,
          }}>
            {isFake ? 'Likely fake' : 'Likely real'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 14, color: inkMuted, fontFamily: bodyFont, fontWeight: 400,
          }}>
            {riskLabel} — {confPct}% probability of manipulation
          </span>
        </div>

        <p style={{
          fontSize: 16, color: ink, lineHeight: 1.6, maxWidth: 560,
          marginTop: 24, fontWeight: 300, fontFamily: bodyFont,
        }}>
          {isFake
            ? `${ratioPct}% of analysed frames show signs of manipulation. The heatmaps below highlight which facial regions the model found suspicious.`
            : `Only ${ratioPct}% of frames were flagged. Attention is distributed naturally across the face, with no concentrated manipulation artifacts.`
          }
        </p>
      </div>

      {/* ── Confidence gauge + stats row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 48,
        alignItems: 'center',
        paddingTop: 36,
        paddingBottom: 36,
        borderTop: `1px solid ${hairline}`,
        borderBottom: `1px solid ${hairline}`,
        marginBottom: 36,
        flexWrap: 'wrap',
      }}>
        {/* Gauge */}
        <div style={{ flexShrink: 0 }}>
          <svg width="104" height="104" viewBox="0 0 104 104">
            <circle cx="52" cy="52" r="44" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />
            <circle
              cx="52" cy="52" r="44" fill="none"
              stroke={accent} strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - result.confidence)}`}
              transform="rotate(-90 52 52)"
              style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            />
            <text x="52" y="48" textAnchor="middle" fill={ink} fontSize="18" fontWeight="300" fontFamily={displayFont}>
              {confPct}%
            </text>
            <text x="52" y="64" textAnchor="middle" fill={inkMuted} fontSize="9" fontFamily={monoFont} letterSpacing="0.5px">
              P(FAKE)
            </text>
          </svg>
        </div>

        {/* Stat list */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 28,
        }}>
          {[
            { label: 'Fake frames',  value: `${result.fake_frames}/${result.total_frames}` },
            { label: 'Threshold',    value: `${(result.threshold_used * 100).toFixed(0)}%` },
            { label: 'Process time', value: `${result.processing_time_s}s` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{
                fontSize: 10, color: inkMuted, marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '1px',
                fontFamily: monoFont, fontWeight: 500,
              }}>
                {label}
              </p>
              <p style={{
                fontSize: 22,
                fontWeight: 300, color: ink,
                fontFamily: displayFont,
                letterSpacing: '-0.5px',
              }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confidence bar ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: inkMuted, fontFamily: monoFont, letterSpacing: '0.3px' }}>
            Confidence distribution · {result.total_frames} frames
          </p>
          <p style={{ fontSize: 12, fontWeight: 500, color: accent, fontFamily: monoFont }}>
            {confPct}%
          </p>
        </div>

        <div style={{
          height: 3, background: 'rgba(0,0,0,0.06)',
          borderRadius: 999, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: '50%', top: 0, bottom: 0,
            width: 1, background: 'rgba(0,0,0,0.12)', zIndex: 1,
          }} />
          <div style={{
            height: '100%',
            width: `${confPct}%`,
            background: accent,
            borderRadius: 999,
            transition: 'width 1.2s ease',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 10, color: inkFaint, fontFamily: monoFont, letterSpacing: '0.3px' }}>REAL</span>
          <span style={{ fontSize: 10, color: inkFaint, fontFamily: monoFont, letterSpacing: '0.3px' }}>50%</span>
          <span style={{ fontSize: 10, color: inkFaint, fontFamily: monoFont, letterSpacing: '0.3px' }}>FAKE</span>
        </div>
      </div>
    </div>
  )
}