/**
 * StatusBar.jsx
 * Shows backend health (top-right corner) and analysis progress.
 * Props:
 *   mode: 'health' | 'loading'
 *   health: { status, device, cuda } | null
 *   uploadPct: number (0-100, upload progress)
 *   message: string
 */

import { Cpu, Wifi, WifiOff, Loader } from 'lucide-react'
import clsx from 'clsx'

/* ---- Health Pill (top-right) ---------------------------------- */
export function HealthPill({ health, loading }) {
  if (loading) {
    return (
      <div className="health-pill health-pill--checking">
        <span className="animate-pulse">●</span>
        <span>connecting…</span>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="health-pill health-pill--offline">
        <WifiOff size={13} />
        <span>API offline</span>
      </div>
    )
  }

  return (
    <div className="health-pill health-pill--online">
      <Wifi size={13} />
      <span>API online</span>
      <span className="health-pill__sep">|</span>
      <Cpu size={13} />
      <span className="font-mono">{health.device?.toUpperCase()}</span>
    </div>
  )
}

/* ---- Analysis Progress Banner --------------------------------- */
export function ProgressBanner({ uploadPct, message }) {
  const isUploading = uploadPct < 100

  return (
    <div className="progress-banner animate-fade-up">
      <div className="progress-banner__icon">
        <Loader size={20} className="animate-spin" />
      </div>

      <div className="progress-banner__body">
        <p className="progress-banner__message">
          {isUploading
            ? `Uploading video… ${uploadPct}%`
            : (message || 'Running EfficientNet-B0 inference…')}
        </p>

        {isUploading && (
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        )}

        {!isUploading && (
          <p className="progress-banner__sub">
            Extracting frames · Grad-CAM heatmaps · ~5–10s on GPU
          </p>
        )}
      </div>
    </div>
  )
}

/* ---- Styles --------------------------------------------------- */
const style = document.createElement('style')
style.textContent = `
  /* Health pill */
  .health-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: 1px solid;
    transition: all 0.3s ease;
  }
  .health-pill--online  { color: var(--accent-real);  border-color: rgba(34,197,94,0.3);  background: rgba(34,197,94,0.08); }
  .health-pill--offline { color: var(--accent-fake);  border-color: rgba(239,68,68,0.3);  background: rgba(239,68,68,0.08); }
  .health-pill--checking{ color: var(--text-secondary);border-color: var(--bg-border);    background: var(--bg-card); }
  .health-pill__sep     { color: var(--text-muted); margin: 0 2px; }

  /* Progress banner */
  .progress-banner {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 24px;
    background: var(--bg-card);
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-lg);
    margin-bottom: 32px;
  }
  .progress-banner__icon {
    flex-shrink: 0;
    color: var(--accent-blue);
    margin-top: 2px;
  }
  .progress-banner__message {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
    font-family: var(--font-mono);
  }
  .progress-banner__sub {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  /* Upload progress bar */
  .progress-bar {
    height: 4px;
    background: var(--bg-border);
    border-radius: 2px;
    margin-top: 10px;
    overflow: hidden;
  }
  .progress-bar__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-blue-dim), var(--accent-blue));
    border-radius: 2px;
    transition: width 0.2s ease;
  }
`
document.head.appendChild(style)