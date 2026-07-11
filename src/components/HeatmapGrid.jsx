/**
 * HeatmapGrid.jsx
 * 4-column responsive grid of Grad-CAM heatmap thumbnails.
 * Each cell shows the base64 heatmap + frame index + P(fake).
 * Clicking a cell opens a fullscreen lightbox.
 *
 * Props:
 *   frames: FrameResult[]   (see api.js typedef)
 */

import { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

export function HeatmapGrid({ frames }) {
  const [lightbox, setLightbox] = useState(null)  // FrameResult | null

  // Sort descending by fake_prob for display
  const sorted = [...frames].sort((a, b) => b.fake_prob - a.fake_prob)

  return (
    <div className="heatmap-section animate-fade-up">
      <p className="section-eyebrow">Explainability</p>
      <h3 className="section-title">Grad-CAM heatmaps</h3>
      <p className="section-sub">
        20 evenly-spaced frames, sorted by P(fake) — high to low. Warm regions
        indicate areas most influential for the FAKE prediction.
      </p>

      <div className="heatmap-grid">
        {sorted.map((frame) => (
          <HeatmapCell
            key={frame.frame_index}
            frame={frame}
            onClick={() => setLightbox(frame)}
          />
        ))}
      </div>

      {lightbox && (
        <Lightbox frame={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}

function HeatmapCell({ frame, onClick }) {
  const isFake = frame.prediction === 'FAKE'
  const pct    = (frame.fake_prob * 100).toFixed(1)

  return (
    <button
      className={`heatmap-cell ${isFake ? 'heatmap-cell--fake' : 'heatmap-cell--real'}`}
      onClick={onClick}
      title={`Frame ${frame.frame_index + 1} — P(fake) ${pct}%`}
    >
      <div className="heatmap-cell__img-wrap">
        <img
          src={`data:image/png;base64,${frame.heatmap_b64}`}
          alt={`Frame ${frame.frame_index + 1} heatmap`}
          className="heatmap-cell__img"
          loading="lazy"
        />
        <div className="heatmap-cell__hover">
          <ZoomIn size={16} strokeWidth={1.5} />
        </div>
      </div>

      <div className="heatmap-cell__footer">
        <span className="font-mono heatmap-cell__frame">F{frame.frame_index + 1}</span>
        <span
          className="font-mono heatmap-cell__prob"
          style={{ color: isFake ? 'var(--accent-fake)' : 'var(--accent-real)' }}
        >
          {pct}%
        </span>
      </div>
    </button>
  )
}

function Lightbox({ frame, onClose }) {
  const isFake = frame.prediction === 'FAKE'
  const pct    = (frame.fake_prob * 100).toFixed(1)

  return (
    <div
      className="lightbox animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="lightbox__inner"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="lightbox__close" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={1.5} />
        </button>

        <img
          src={`data:image/png;base64,${frame.heatmap_b64}`}
          alt={`Frame ${frame.frame_index + 1} Grad-CAM heatmap`}
          className="lightbox__img"
        />

        <div className="lightbox__meta">
          <span className="font-mono">Frame {frame.frame_index + 1}</span>
          <span
            className="font-mono"
            style={{ color: isFake ? 'var(--accent-fake)' : 'var(--accent-real)' }}
          >
            {frame.prediction} &nbsp;·&nbsp; P(fake) = {pct}%
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---- Styles --------------------------------------------------- */
const style = document.createElement('style')
style.textContent = `
  :root {
    --bg-base: #FFFFFF;
    --bg-card: #FFFFFF;
    --bg-border: rgba(0,0,0,0.08);
    --bg-sunken: #FAFAFA;
    --text-primary: #1D1D1F;
    --text-secondary: #48484A;
    --text-muted: #86868B;
    --accent-fake: #D14343;
    --accent-real: #1D7A4C;
    --radius-lg: 18px;
    --radius-sm: 12px;
  }

  .heatmap-section {
    background: var(--bg-card);
    border-top: 1px solid var(--bg-border);
    padding: 40px 0 0;
    margin-bottom: 48px;
  }

  .section-eyebrow {
    font-family: "SF Mono", "IBM Plex Mono", monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0 0 12px;
    font-weight: 500;
  }

  .section-title {
    font-family: "SF Pro Display", "Inter", -apple-system, sans-serif;
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 200;
    letter-spacing: -1px;
    color: var(--text-primary);
    margin: 0 0 10px;
  }

  .section-sub {
    font-family: "SF Pro Text", "Inter", -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 300;
    color: var(--text-muted);
    line-height: 1.6;
    max-width: 560px;
    margin: 0 0 28px;
  }

  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 16px;
  }

  .heatmap-cell {
    background: var(--bg-sunken);
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .heatmap-cell:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  }
  .heatmap-cell--fake:hover { border-color: rgba(209,67,67,0.35); }
  .heatmap-cell--real:hover { border-color: rgba(29,122,76,0.35); }

  .heatmap-cell__img-wrap {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
  }
  .heatmap-cell__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }
  .heatmap-cell:hover .heatmap-cell__img { transform: scale(1.03); }

  .heatmap-cell__hover {
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .heatmap-cell:hover .heatmap-cell__hover { opacity: 1; }

  .heatmap-cell__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    border-top: 1px solid var(--bg-border);
  }
  .heatmap-cell__frame {
    font-size: 10px;
    letter-spacing: 0.3px;
    color: var(--text-muted);
  }
  .heatmap-cell__prob {
    font-size: 11px;
    font-weight: 500;
  }

  /* Lightbox */
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .lightbox__inner {
    position: relative;
    max-width: min(600px, 90vw);
    background: var(--bg-card);
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.12);
  }
  .lightbox__close {
    position: absolute;
    top: 14px; right: 14px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(8px);
    border: 1px solid var(--bg-border);
    border-radius: 50%;
    width: 32px; height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    cursor: pointer;
    z-index: 1;
    transition: background 0.2s;
  }
  .lightbox__close:hover { background: rgba(255,255,255,1); }
  .lightbox__img {
    width: 100%;
    display: block;
  }
  .lightbox__meta {
    display: flex;
    justify-content: space-between;
    padding: 14px 20px;
    font-size: 13px;
    color: var(--text-secondary);
    background: var(--bg-sunken);
    border-top: 1px solid var(--bg-border);
  }
`
document.head.appendChild(style)