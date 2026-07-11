/**
 * App.jsx — Apple-style minimal redesign
 * Fixes:
 *  - Floating pill constrained so it never clips off-screen
 *  - New "preview" phase: pick file → play/pause video → click Analyse
 * Flow: idle → preview → uploading → analysing → done / error
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, RefreshCw, Play, Pause, Scan } from 'lucide-react'

import { healthCheck, predictVideo } from './api'
import { UploadZone } from './components/UploadZone'
import { ResultCard } from './components/ResultCard'
import { FrameChart } from './components/FrameChart'
import { HeatmapGrid } from './components/HeatmapGrid'
import { ProgressBanner } from './components/StatusBar'
import SampleBar from './components/SampleBar'

const ANALYSIS_MSGS = [
  'Extracting 20 frames…',
  'Running EfficientNet-B0 inference…',
  'Generating Grad-CAM heatmaps…',
  'Computing final verdict…',
  'Almost done…',
]

/* ─── Floating health pill ─────────────────────────────────────────────── */
function FloatingHealthPill({ health, loading }) {
  const label = loading ? 'Connecting' : health?.status === 'ok' ? 'API online' : 'API offline'
  const mod   = loading ? 'loading'    : health?.status === 'ok' ? 'online'     : 'offline'
  return (
    <div className={`dg-pill dg-pill--${mod}`}>
      <span className={`dg-pill-dot dg-pill-dot--${mod}`} />
      {label}
    </div>
  )
}

/* ─── Inline video player shown in preview phase ───────────────────────── */
function VideoPreview({ file, onAnalyse, onCancel }) {
  const videoRef  = useRef(null)
  const [playing, setPlaying]   = useState(false)
  const [current, setCurrent]   = useState(0)
  const [duration, setDuration] = useState(0)
  const objectUrl = useRef(null)

  useEffect(() => {
    objectUrl.current = URL.createObjectURL(file)
    return () => URL.revokeObjectURL(objectUrl.current)
  }, [file])

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    playing ? v.pause() : v.play()
    setPlaying(!playing)
  }

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const pct = duration ? (current / duration) * 100 : 0

  return (
    <div className="dg-preview">
      {/* video element */}
      <div className="dg-preview-video-wrap">
        <video
          ref={videoRef}
          src={objectUrl.current}
          className="dg-preview-video"
          onTimeUpdate={e => setCurrent(e.target.currentTime)}
          onLoadedMetadata={e => setDuration(e.target.duration)}
          onEnded={() => setPlaying(false)}
          playsInline
        />
      </div>

      {/* controls */}
      <div className="dg-preview-controls">
        <button className="dg-play-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* seek bar */}
        <div className="dg-seek-track" onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          if (videoRef.current) videoRef.current.currentTime = ratio * duration
        }}>
          <div className="dg-seek-fill" style={{ width: `${pct}%` }} />
          <div className="dg-seek-thumb" style={{ left: `${pct}%` }} />
        </div>

        <span className="dg-time">{fmt(current)} / {fmt(duration)}</span>
      </div>

      {/* filename + size */}
      <div className="dg-preview-meta">
        <span className="dg-preview-name">{file.name}</span>
        <span className="dg-preview-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
      </div>

      {/* action row */}
      <div className="dg-preview-actions">
        <button className="dg-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="dg-btn-analyse" onClick={onAnalyse}>
          <Scan size={14} />
          Analyse video
        </button>
      </div>
    </div>
  )
}

/* ─── App ───────────────────────────────────────────────────────────────── */
export default function App() {
  const [health, setHealth]               = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [phase, setPhase]                 = useState('idle')   // idle | preview | uploading | analysing | done | error
  const [pendingFile, setPendingFile]     = useState(null)     // held in preview
  const [uploadPct, setUploadPct]         = useState(0)
  const [msgIdx, setMsgIdx]               = useState(0)
  const [result, setResult]               = useState(null)
  const [errorMsg, setErrorMsg]           = useState('')

  useEffect(() => {
    healthCheck()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false))
  }, [])

  useEffect(() => {
    if (phase !== 'analysing') return
    const id = setInterval(() => setMsgIdx(i => (i + 1) % ANALYSIS_MSGS.length), 2000)
    return () => clearInterval(id)
  }, [phase])

  /* File picked → go to preview instead of immediately uploading */
  const handleFile = useCallback((file) => {
    setPendingFile(file)
    setPhase('preview')
  }, [])

  /* User confirmed → now actually send to API */
  const handleAnalyse = useCallback(async () => {
    const file = pendingFile
    if (!file) return
    setResult(null); setErrorMsg(''); setUploadPct(0); setMsgIdx(0)
    setPhase('uploading')
    try {
      const data = await predictVideo(file, (pct) => {
        setUploadPct(pct)
        if (pct >= 100) setPhase('analysing')
      })
      setResult(data)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err?.message || 'Server error')
      setPhase('error')
    }
  }, [pendingFile])

  const reset = () => {
    setPhase('idle')
    setResult(null)
    setPendingFile(null)
    setUploadPct(0)
    setErrorMsg('')
  }

  const loading = phase === 'uploading' || phase === 'analysing'

  return (
    <div className="dg-app">

      {/* ── Floating API status pill ── */}
      <div className="dg-status-anchor">
        <FloatingHealthPill health={health} loading={healthLoading} />
      </div>

      {/* ── HERO (idle + preview only) ── */}
      {(phase === 'idle' || phase === 'preview') && (
        <section className="dg-hero" data-compact={phase === 'preview'}>
          <p className="dg-eyebrow">Deepfake Detection</p>
          <h1 className="dg-h1">
            Is this video<br />
            <em className="dg-h1-em">real?</em>
          </h1>
          {phase === 'idle' && (
            <p className="dg-sub">
              Upload any video. Our model analyses 20 frames with<br />
              Grad-CAM heatmaps to reveal manipulation.
            </p>
          )}
        </section>
      )}

      {/* ── SAMPLE BAR ── */}
      {phase === 'idle' && (
        <div className="dg-samples-wrap">
          <SampleBar onUpload={handleFile} />
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="dg-main">

        {/* Upload zone — idle only */}
        {phase === 'idle' && (
          <div className="dg-upload-wrap">
            <UploadZone onFile={handleFile} />
            <p className="dg-privacy">Processed locally · never stored permanently</p>
          </div>
        )}

        {/* Video preview — preview phase */}
        {phase === 'preview' && pendingFile && (
          <VideoPreview
            file={pendingFile}
            onAnalyse={handleAnalyse}
            onCancel={reset}
          />
        )}

        {/* Reset button — done phase */}
        {phase === 'done' && (
          <button className="dg-reset" onClick={reset}>
            <RefreshCw size={13} />
            Analyse another video
          </button>
        )}

        {/* Progress banner */}
        {loading && (
          <ProgressBanner uploadPct={uploadPct} message={ANALYSIS_MSGS[msgIdx]} />
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="dg-error">
            <AlertTriangle size={16} />
            <div>
              <div className="dg-err-title">Analysis failed</div>
              <div className="dg-err-msg">{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === 'done' && result && (
          <div className="dg-results">
            <ResultCard result={result} />
            <FrameChart frames={result.frames} threshold={result.threshold_used ?? 0.5} />
            <HeatmapGrid frames={result.frames} />
          </div>
        )}

        {/* How it works — idle only */}
        {phase === 'idle' && (
          <section className="dg-how">
            <p className="dg-how-label">How it works</p>
            <div className="dg-how-grid">
              {[
                { name: 'Extract',  desc: '20 evenly-spaced frames sampled from your video'  },
                { name: 'Detect',   desc: 'MTCNN isolates the face region with precision'     },
                { name: 'Analyse',  desc: 'EfficientNet-B0 scores each frame for artifacting' },
                { name: 'Explain',  desc: 'Grad-CAM highlights the suspicious regions'        },
              ].map(({ name, desc }, i) => (
                <div className="dg-how-card" key={name}>
                  <span className="dg-how-num">{String(i + 1).padStart(2, '0')}</span>
                  <p className="dg-how-name">{name}</p>
                  <p className="dg-how-desc">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer className="dg-footer">
        Trained on FaceForensics++ C23 &nbsp;·&nbsp; EfficientNet-B0 &nbsp;·&nbsp; Grad-CAM
      </footer>

      {/* ══ STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,200;0,300;0,400;0,500;1,200;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── SHELL ── */
        .dg-app {
          min-height: 100vh;
          background: #ffffff;
          color: #1d1d1f;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          -webkit-font-smoothing: antialiased;
        }

        /* ── FLOATING STATUS PILL ──
           max-width + right clamp keeps it inside viewport on any screen width */
        .dg-status-anchor {
          position: fixed;
          top: 16px;
          right: clamp(12px, 4vw, 24px);
          z-index: 200;
          max-width: calc(100vw - 24px);
        }

        .dg-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.01em;
          white-space: nowrap;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 0.5px solid rgba(0,0,0,0.08);
        }
        .dg-pill--online  { background: rgba(240,253,244,0.94); color: #15803d; }
        .dg-pill--offline { background: rgba(254,242,242,0.94); color: #dc2626; }
        .dg-pill--loading { background: rgba(249,250,251,0.94); color: #6b7280; }

        .dg-pill-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dg-pill-dot--online  { background: #22c55e; }
        .dg-pill-dot--offline { background: #ef4444; }
        .dg-pill-dot--loading { background: #9ca3af; }

        /* ── HERO ── */
        .dg-hero {
          text-align: center;
          padding: 110px 24px 56px;
          max-width: 720px;
          margin: 0 auto;
          width: 100%;
          transition: padding 0.2s;
        }
        .dg-hero[data-compact="true"] {
          padding: 80px 24px 32px;
        }

        .dg-eyebrow {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #aeaeb2;
          margin-bottom: 24px;
        }

        .dg-h1 {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
          font-size: clamp(52px, 9vw, 88px);
          font-weight: 200;
          line-height: 1.04;
          letter-spacing: -0.03em;
          color: #1d1d1f;
          margin-bottom: 24px;
        }
        .dg-h1-em {
          font-style: italic;
          font-weight: 200;
          color: #06b6d4;
        }

        .dg-sub {
          font-size: 17px;
          font-weight: 300;
          color: #6e6e73;
          line-height: 1.65;
          max-width: 420px;
          margin: 0 auto;
        }

        /* ── SAMPLES ── */
        .dg-samples-wrap {
          display: flex;
          justify-content: center;
          padding: 0 24px 8px;
        }

        /* ── MAIN ── */
        .dg-main {
          max-width: 960px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 24px 64px;
        }

        /* ── UPLOAD ZONE ── */
        .dg-upload-wrap {
          max-width: 520px;
          margin: 0 auto 24px;
          border: 0.5px solid rgba(0,0,0,0.1);
          border-radius: 18px;
          background: #fafafa;
          overflow: hidden;
        }
        .dg-privacy {
          text-align: center;
          font-size: 11px;
          color: #aeaeb2;
          padding: 10px 16px;
          border-top: 0.5px solid rgba(0,0,0,0.06);
          letter-spacing: 0.01em;
        }
        .dg-upload-wrap .upload-zone {
          border: none !important;
          background: transparent !important;
          border-radius: 0 !important;
          min-height: 200px !important;
          box-shadow: none !important;
        }
        .dg-upload-wrap .upload-zone:hover {
          background: rgba(0,0,0,0.012) !important;
        }

        /* ── VIDEO PREVIEW ── */
        .dg-preview {
          max-width: 560px;
          margin: 0 auto 24px;
          border: 0.5px solid rgba(0,0,0,0.1);
          border-radius: 18px;
          background: #fafafa;
          overflow: hidden;
        }

        .dg-preview-video-wrap {
          width: 100%;
          background: #000;
          border-radius: 18px 18px 0 0;
          overflow: hidden;
          aspect-ratio: 16/9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dg-preview-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .dg-preview-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px 10px;
        }

        .dg-play-btn {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 0.5px solid rgba(0,0,0,0.12);
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #1d1d1f;
          transition: background 0.15s;
        }
        .dg-play-btn:hover { background: rgba(0,0,0,0.04); }

        /* seek bar */
        .dg-seek-track {
          flex: 1;
          height: 3px;
          background: rgba(0,0,0,0.08);
          border-radius: 2px;
          position: relative;
          cursor: pointer;
        }
        .dg-seek-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: #06b6d4;
          border-radius: 2px;
          transition: width 0.1s linear;
        }
        .dg-seek-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 11px; height: 11px;
          border-radius: 50%;
          background: #06b6d4;
          box-shadow: 0 0 0 2px #fff;
        }

        .dg-time {
          flex-shrink: 0;
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          color: #aeaeb2;
          letter-spacing: 0.01em;
          min-width: 72px;
          text-align: right;
        }

        .dg-preview-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 12px;
        }
        .dg-preview-name {
          font-size: 12px;
          color: #6e6e73;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 70%;
        }
        .dg-preview-size {
          font-size: 12px;
          color: #aeaeb2;
          flex-shrink: 0;
        }

        .dg-preview-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 12px 16px;
          border-top: 0.5px solid rgba(0,0,0,0.06);
        }

        .dg-btn-ghost {
          padding: 8px 14px;
          border-radius: 100px;
          border: 0.5px solid rgba(0,0,0,0.1);
          background: transparent;
          font-size: 13px;
          font-family: inherit;
          color: #6e6e73;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dg-btn-ghost:hover { background: rgba(0,0,0,0.04); color: #1d1d1f; }

        .dg-btn-analyse {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 100px;
          border: none;
          background: #1d1d1f;
          color: #fff;
          font-size: 13px;
          font-family: inherit;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .dg-btn-analyse:hover  { background: #3a3a3c; }
        .dg-btn-analyse:active { transform: scale(0.98); }

        /* ── RESET ── */
        .dg-reset {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0 auto 28px;
          padding: 9px 16px;
          background: transparent;
          border: 0.5px solid rgba(0,0,0,0.12);
          border-radius: 100px;
          color: #6e6e73;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: background 0.15s, color 0.15s;
        }
        .dg-reset:hover { background: rgba(0,0,0,0.04); color: #1d1d1f; }

        /* ── ERROR ── */
        .dg-error {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 16px 20px;
          background: rgba(239,68,68,0.05);
          border: 0.5px solid rgba(239,68,68,0.2);
          border-radius: 12px;
          color: #dc2626;
          margin-bottom: 24px;
        }
        .dg-err-title { font-weight: 500; font-size: 14px; margin-bottom: 2px; }
        .dg-err-msg   { font-size: 12px; color: #9ca3af; }

        /* ── RESULTS ── */
        .dg-results { margin-top: 8px; }

        /* ── HOW IT WORKS ── */
        .dg-how { margin-top: 80px; }
        .dg-how-label {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #aeaeb2;
          margin-bottom: 20px;
          text-align: center;
        }
        .dg-how-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(0,0,0,0.07);
          border-radius: 16px;
          overflow: hidden;
        }
        .dg-how-card {
          background: #ffffff;
          padding: 26px 20px;
        }
        .dg-how-card:first-child { border-radius: 16px 0 0 16px; }
        .dg-how-card:last-child  { border-radius: 0 16px 16px 0; }
        .dg-how-num {
          display: block;
          font-size: 11px;
          color: #aeaeb2;
          letter-spacing: 0.04em;
          margin-bottom: 12px;
          font-variant-numeric: tabular-nums;
        }
        .dg-how-name {
          font-size: 15px;
          font-weight: 500;
          color: #1d1d1f;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }
        .dg-how-desc {
          font-size: 13px;
          font-weight: 300;
          color: #6e6e73;
          line-height: 1.55;
        }

        /* ── FOOTER ── */
        .dg-footer {
          margin-top: auto;
          text-align: center;
          padding: 28px 24px;
          font-size: 11px;
          color: #c7c7cc;
          letter-spacing: 0.02em;
          border-top: 0.5px solid rgba(0,0,0,0.06);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .dg-hero { padding: 88px 20px 40px; }
          .dg-h1 { font-size: 44px; }
          .dg-how-grid { grid-template-columns: repeat(2, 1fr); }
          .dg-how-card:first-child  { border-radius: 16px 0 0 0; }
          .dg-how-card:nth-child(2) { border-radius: 0 16px 0 0; }
          .dg-how-card:nth-child(3) { border-radius: 0 0 0 16px; }
          .dg-how-card:last-child   { border-radius: 0 0 16px 0; }
        }
      `}</style>
    </div>
  )
}