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
      <h3 className="section-title">Grad-CAM Heatmaps</h3>
      <p className="section-sub">
        20 evenly-spaced frames, sorted by P(fake) — high to low.
        Red regions indicate areas most influential for the FAKE prediction.
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
          <ZoomIn size={18} />
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
          <X size={20} />
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
  .heatmap-section {
    background: var(--bg-card);
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-lg);
    padding: 24px 28px;
    margin-bottom: 48px;
  }

  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
    margin-top: 20px;
  }

  .heatmap-cell {
    background: var(--bg-base);
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s, box-shadow 0.18s;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .heatmap-cell:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .heatmap-cell--fake:hover { border-color: rgba(239,68,68,0.5); }
  .heatmap-cell--real:hover { border-color: rgba(34,197,94,0.5);  }

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
    transition: transform 0.25s ease;
  }
  .heatmap-cell:hover .heatmap-cell__img { transform: scale(1.04); }

  .heatmap-cell__hover {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .heatmap-cell:hover .heatmap-cell__hover { opacity: 1; }

  .heatmap-cell__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
  }
  .heatmap-cell__frame {
    font-size: 10px;
    color: var(--text-muted);
  }
  .heatmap-cell__prob {
    font-size: 11px;
    font-weight: 700;
  }

  /* Lightbox */
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(6px);
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
  }
  .lightbox__close {
    position: absolute;
    top: 12px; right: 12px;
    background: rgba(0,0,0,0.5);
    border: none;
    border-radius: 50%;
    width: 34px; height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    z-index: 1;
    transition: background 0.2s;
  }
  .lightbox__close:hover { background: rgba(239,68,68,0.6); }
  .lightbox__img {
    width: 100%;
    display: block;
  }
  .lightbox__meta {
    display: flex;
    justify-content: space-between;
    padding: 12px 18px;
    font-size: 13px;
    color: var(--text-secondary);
    background: var(--bg-base);
  }
`
document.head.appendChild(style)
