/**
 * HeatmapGrid.jsx
 * 4‑column responsive grid of Grad‑CAM heatmap thumbnails.
 * Click a cell to open a true fullscreen lightbox with arrow navigation,
 * click-to-advance on the image itself, and a thumbnail filmstrip.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'fake', label: 'Fake' },
  { id: 'real', label: 'Real' },
];

const SORTS = [
  { id: 'prob_desc', label: 'P(fake) high → low' },
  { id: 'prob_asc', label: 'P(fake) low → high' },
  { id: 'frame_asc', label: 'Frame order' },
];

export function HeatmapGrid({ frames }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('prob_desc');

  // Apply filter and sort
  const filtered = frames.filter((f) => {
    if (filter === 'fake') return f.prediction === 'FAKE';
    if (filter === 'real') return f.prediction === 'REAL';
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'prob_asc') return a.fake_prob - b.fake_prob;
    if (sortBy === 'frame_asc') return a.frame_index - b.frame_index;
    return b.fake_prob - a.fake_prob; // prob_desc default
  });

  const fakeCount = frames.filter((f) => f.prediction === 'FAKE').length;
  const realCount = frames.length - fakeCount;

  const openLightbox = useCallback((index) => {
    setLightboxIndex(index);
  }, []);
  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);
  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i > 0 ? i - 1 : sorted.length - 1));
  }, [sorted.length]);
  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i < sorted.length - 1 ? i + 1 : 0));
  }, [sorted.length]);

  return (
    <div className="heatmap-section animate-fade-up">
      <div className="heatmap-header">
        <div>
          <p className="section-eyebrow">Explainability</p>
          <h3 className="section-title">Grad‑CAM heatmaps</h3>
          <p className="section-sub">
            {frames.length} evenly‑spaced frames. Warm regions indicate areas
            most influential for the <strong>FAKE</strong> prediction. Click any
            frame to view it full size.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="heatmap-controls">
        <div className="heatmap-filters" role="tablist" aria-label="Filter frames">
          {FILTERS.map((f) => {
            const count = f.id === 'fake' ? fakeCount : f.id === 'real' ? realCount : frames.length;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                className={`heatmap-filter-btn heatmap-filter-btn--${f.id} ${
                  filter === f.id ? 'is-active' : ''
                }`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className="heatmap-filter-btn__count">{count}</span>
              </button>
            );
          })}
        </div>

        <select
          className="heatmap-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort frames"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <p className="heatmap-empty">No frames match this filter.</p>
      ) : (
        <div className="heatmap-grid">
          {sorted.map((frame, idx) => (
            <HeatmapCell
              key={frame.frame_index}
              frame={frame}
              onClick={() => openLightbox(idx)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && sorted.length > 0 && (
        <Lightbox
          frames={sorted}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          onJump={setLightboxIndex}
        />
      )}
    </div>
  );
}

// ─── Cell Component ───────────────────────────────────────────────────────

function HeatmapCell({ frame, onClick }) {
  const isFake = frame.prediction === 'FAKE';
  const pct = (frame.fake_prob * 100).toFixed(1);

  return (
    <button
      className={`heatmap-cell ${isFake ? 'heatmap-cell--fake' : 'heatmap-cell--real'}`}
      onClick={onClick}
      title={`Frame ${frame.frame_index + 1} — P(fake) ${pct}% — click to view full size`}
    >
      <div className="heatmap-cell__img-wrap">
        <img
          src={`data:image/png;base64,${frame.heatmap_b64}`}
          alt={`Frame ${frame.frame_index + 1} heatmap`}
          className="heatmap-cell__img"
          loading="lazy"
        />
        <div className="heatmap-cell__hover">
          <ZoomIn size={20} strokeWidth={1.5} />
        </div>
        {/* Status badge */}
        <span className={`heatmap-cell__badge heatmap-cell__badge--${isFake ? 'fake' : 'real'}`}>
          {isFake ? 'FAKE' : 'REAL'}
        </span>
      </div>

      <div className="heatmap-cell__footer">
        <span className="heatmap-cell__frame">Frame {frame.frame_index + 1}</span>
        <span
          className="heatmap-cell__prob"
          style={{ color: isFake ? 'var(--accent-fake)' : 'var(--accent-real)' }}
        >
          {pct}%
        </span>
      </div>
    </button>
  );
}

// ─── Lightbox Component ──────────────────────────────────────────────────

function Lightbox({ frames, index, onClose, onPrev, onNext, onJump }) {
  const frame = frames[index];
  const isFake = frame.prediction === 'FAKE';
  const pct = (frame.fake_prob * 100).toFixed(1);
  const total = frames.length;
  const filmstripRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onPrev, onNext, onClose]);

  // Lock background scroll while open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Keep the active thumbnail in view in the filmstrip
  useEffect(() => {
    const el = filmstripRef.current?.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  // Clicking the left half of the image goes back, right half advances
  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) onPrev();
    else onNext();
  };

  return (
    <div
      className="lightbox animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Frame ${frame.frame_index + 1} of ${total}, ${frame.prediction} prediction`}
    >
      <div className="lightbox__inner" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="lightbox__topbar">
          <span className="lightbox__counter font-mono">
            {index + 1} / {total}
          </span>
          <button className="lightbox__close" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation arrows */}
        <button
          className="lightbox__nav lightbox__nav--prev"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous frame"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          className="lightbox__nav lightbox__nav--next"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next frame"
        >
          <ChevronRight size={28} />
        </button>

        {/* Image */}
        <div className="lightbox__media">
          <img
            key={frame.frame_index}
            src={`data:image/png;base64,${frame.heatmap_b64}`}
            alt={`Frame ${frame.frame_index + 1} Grad‑CAM heatmap`}
            className="lightbox__img animate-fade-in"
            onClick={handleImageClick}
          />
        </div>

        {/* Meta */}
        <div className="lightbox__meta">
          <span className="lightbox__meta-item">
            <span className="lightbox__meta-label">Frame</span>
            <span className="font-mono">{frame.frame_index + 1} / {total}</span>
          </span>
          <span
            className="lightbox__meta-item"
            style={{ color: isFake ? 'var(--accent-fake)' : 'var(--accent-real)' }}
          >
            <span className="lightbox__meta-label">Prediction</span>
            <span className="font-mono">{frame.prediction}</span>
          </span>
          <span className="lightbox__meta-item">
            <span className="lightbox__meta-label">P(fake)</span>
            <span className="font-mono">{pct}%</span>
          </span>
        </div>

        {/* Filmstrip */}
        <div className="lightbox__filmstrip" ref={filmstripRef}>
          {frames.map((f, i) => (
            <button
              key={f.frame_index}
              data-active={i === index}
              className={`lightbox__thumb ${i === index ? 'is-active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onJump(i); }}
              aria-label={`Go to frame ${f.frame_index + 1}`}
              aria-current={i === index}
            >
              <img
                src={`data:image/png;base64,${f.heatmap_b64}`}
                alt=""
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const style = document.createElement('style');
style.textContent = `
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background: #ffffff; /* or match .dg-app */
}
  .heatmap-section {
    background: #ffffff;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    padding: 40px 0 0;
    margin-bottom: 48px;
  }

  .heatmap-header {
    margin-bottom: 24px;
  }

  .section-eyebrow {
    font-family: "SF Mono", "IBM Plex Mono", monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #000000;
    margin: 0 0 8px;
    font-weight: 500;
  }

  .section-title {
    font-family: "SF Pro Display", "Inter", -apple-system, sans-serif;
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 200;
    letter-spacing: -1px;
    color: #000000;
    margin: 0 0 8px;
  }

  .section-sub {
    font-size: 14px;
    font-weight: 300;
    color: #000000;
    line-height: 1.6;
    max-width: 560px;
    margin: 0;
  }
  .section-sub strong {
    font-weight: 600;
    color: #000000;
  }

  .heatmap-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 28px;
  }

  .heatmap-filters {
    display: flex;
    gap: 6px;
  }

  .heatmap-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #ffffff;
    color: #000000;
    font-family: "SF Mono", "IBM Plex Mono", monospace;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .heatmap-filter-btn:hover {
    background: rgba(15, 23, 42, 0.03);
  }
  .heatmap-filter-btn__count {
    font-size: 10.5px;
    color: #000000;
  }
  .heatmap-filter-btn.is-active .heatmap-filter-btn__count {
    color: inherit;
    opacity: 0.75;
  }

  .heatmap-filter-btn--all.is-active {
    background: #000000;
    border-color: #000000;
    color: #fff;
  }
  .heatmap-filter-btn--fake.is-active {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.2);
    color: #000000;
  }
  .heatmap-filter-btn--real.is-active {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.2);
    color: #000000;
  }

  .heatmap-sort-select {
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #ffffff;
    color: #000000;
    font-family: "SF Mono", "IBM Plex Mono", monospace;
    font-size: 12px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
  }
  .heatmap-sort-select:focus {
    border-color: #000000;
  }

  .heatmap-empty {
    font-size: 13px;
    color: #000000;
    padding: 32px 0;
    text-align: center;
  }

  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }

  .heatmap-cell {
    background: #ffffff;
    border-radius: var(--radius-sm, 10px);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease;
    border: 1px solid rgba(15, 23, 42, 0.08);
    position: relative;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .heatmap-cell--fake {
    border-color: rgba(15, 23, 42, 0.12);
  }
  .heatmap-cell--real {
    border-color: rgba(15, 23, 42, 0.12);
  }
  .heatmap-cell:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    z-index: 2;
  }
  .heatmap-cell--fake:hover {
    border-color: rgba(15, 23, 42, 0.24);
  }
  .heatmap-cell--real:hover {
    border-color: rgba(15, 23, 42, 0.24);
  }

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
    transition: transform 0.4s ease;
  }
  .heatmap-cell:hover .heatmap-cell__img {
    transform: scale(1.06);
  }

  .heatmap-cell__hover {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.62);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000000;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .heatmap-cell:hover .heatmap-cell__hover {
    opacity: 1;
  }

  .heatmap-cell__badge {
    position: absolute;
    top: 8px;
    right: 8px;
    font-family: "SF Mono", "IBM Plex Mono", monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 999px;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(0,0,0,0.06);
  }
  .heatmap-cell__badge--fake {
    color: #000000;
  }
  .heatmap-cell__badge--real {
    color: #000000;
  }

  .heatmap-cell__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    background: #ffffff;
  }
  .heatmap-cell__frame {
    font-size: 10px;
    color: #000000;
    font-weight: 400;
  }
  .heatmap-cell__prob {
    font-size: 11.5px;
    font-weight: 600;
    font-family: "SF Mono", "IBM Plex Mono", monospace;
    color: #000000;
  }

  /* ── Lightbox ── */
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 12, 0.92);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 0.2s ease;
  }

  .lightbox__inner {
    position: relative;
    width: min(1100px, 94vw);
    height: min(88vh, 900px);
    background: #0b0b0d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
  }

  .lightbox__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    flex: 0 0 auto;
  }
  .lightbox__counter {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.65);
    letter-spacing: 0.04em;
  }

  .lightbox__close {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
  }
  .lightbox__close:hover {
    background: rgba(255, 255, 255, 0.16);
    transform: scale(1.05);
  }

  .lightbox__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    z-index: 2;
    transition: background 0.2s, transform 0.15s;
  }
  .lightbox__nav:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-50%) scale(1.06);
  }
  .lightbox__nav--prev {
    left: 16px;
  }
  .lightbox__nav--next {
    right: 16px;
  }

  .lightbox__media {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 64px;
  }

  .lightbox__img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    border-radius: 10px;
    cursor: pointer;
  }

  .lightbox__meta {
    display: flex;
    justify-content: center;
    padding: 12px 22px;
    gap: 28px;
    flex: 0 0 auto;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .lightbox__meta-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
  }
  .lightbox__meta-label {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.45);
  }
  .lightbox__meta-item .font-mono {
    font-weight: 500;
    font-family: "SF Mono", "IBM Plex Mono", monospace;
  }

  .lightbox__filmstrip {
    display: flex;
    gap: 8px;
    padding: 10px 14px 14px;
    overflow-x: auto;
    flex: 0 0 auto;
    scrollbar-width: thin;
  }
  .lightbox__thumb {
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid transparent;
    padding: 0;
    cursor: pointer;
    opacity: 0.55;
    transition: opacity 0.2s, border-color 0.2s, transform 0.15s;
  }
  .lightbox__thumb:hover {
    opacity: 0.85;
    transform: translateY(-2px);
  }
  .lightbox__thumb.is-active {
    opacity: 1;
    border-color: #fff;
  }
  .lightbox__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 640px) {
    .lightbox__inner {
      width: 100vw;
      height: 100vh;
      border-radius: 0;
    }
    .lightbox__media {
      padding: 4px 44px;
    }
    .lightbox__nav {
      width: 38px;
      height: 38px;
    }
    .lightbox__nav--prev { left: 8px; }
    .lightbox__nav--next { right: 8px; }
    .lightbox__meta {
      gap: 16px;
      flex-wrap: wrap;
    }
  }

  /* ── Animations ── */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up {
    animation: fadeUp 0.5s ease both;
  }
  .animate-fade-in {
    animation: fadeIn 0.25s ease both;
  }
`;
document.head.appendChild(style);