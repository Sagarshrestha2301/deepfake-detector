/**
 * ResultCard.jsx
 * Top-level verdict banner + key metrics.
 *
 * Props:
 *   result: PredictResponse  (see api.js typedef)
 */

import { ShieldAlert, ShieldCheck, Clock, Layers, BarChart2 } from 'lucide-react'

export function ResultCard({ result }) {
  const isFake = result.verdict === 'FAKE'

  const color      = isFake ? 'var(--accent-fake)' : 'var(--accent-real)'
  const bgGlow     = isFake ? 'rgba(239,68,68,0.07)' : 'rgba(34,197,94,0.07)'
  const borderClr  = isFake ? 'rgba(239,68,68,0.3)'  : 'rgba(34,197,94,0.3)'
  const glow       = isFake ? 'var(--glow-fake)'      : 'var(--glow-real)'
  const Icon       = isFake ? ShieldAlert              : ShieldCheck

  const pct  = (v) => (v * 100).toFixed(1) + '%'
  const conf = pct(result.confidence)
  const ratio = pct(result.fake_frame_ratio)

  return (
    <div
      className="result-card animate-fade-up"
      style={{
        background: bgGlow,
        borderColor: borderClr,
        boxShadow: glow,
      }}
    >
      {/* Verdict row */}
      <div className="result-card__verdict">
        <Icon size={44} color={color} strokeWidth={1.5} />
        <div>
          <span
            className="result-card__label"
            style={{ color }}
          >
            {result.verdict}
          </span>
          <p className="result-card__sub">
            {isFake
              ? 'Deepfake manipulation detected'
              : 'No manipulation detected — appears authentic'}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="result-card__divider" style={{ background: borderClr }} />

      {/* Metrics row */}
      <div className="result-card__metrics">
        <Metric
          icon={<BarChart2 size={16} />}
          label="Mean confidence"
          value={conf}
          color={color}
        />
        <Metric
          icon={<Layers size={16} />}
          label="Fake frame ratio"
          value={`${result.fake_frames} / ${result.total_frames} frames (${ratio})`}
          color={color}
        />
        <Metric
          icon={<Clock size={16} />}
          label="Processing time"
          value={`${result.processing_time_s?.toFixed(2) ?? '—'} s`}
          color="var(--text-secondary)"
        />
      </div>
    </div>
  )
}

function Metric({ icon, label, value, color }) {
  return (
    <div className="metric">
      <span className="metric__icon" style={{ color }}>{icon}</span>
      <div>
        <p className="metric__label">{label}</p>
        <p className="metric__value font-mono" style={{ color }}>{value}</p>
      </div>
    </div>
  )
}

/* ---- Styles --------------------------------------------------- */
const style = document.createElement('style')
style.textContent = `
  .result-card {
    border: 1px solid;
    border-radius: var(--radius-lg);
    padding: 28px 32px;
    margin-bottom: 32px;
  }

  .result-card__verdict {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 20px;
  }
  .result-card__label {
    font-family: var(--font-mono);
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1;
  }
  .result-card__sub {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  .result-card__divider {
    height: 1px;
    margin-bottom: 20px;
    opacity: 0.6;
  }

  .result-card__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .metric {
    display: flex;
    align-items: center;        /* ← vertical center alignment */
    gap: 10px;                 /* consistent spacing */
  }
  .metric__icon {
    flex-shrink: 0;            /* prevent icon from shrinking */
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;               /* match icon size */
  }
  .metric__label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 2px;
  }
  .metric__value {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;          /* better readability when wrapped */
    word-break: break-word;    /* prevent overflow */
  }
`
document.head.appendChild(style)