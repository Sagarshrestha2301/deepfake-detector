/**
 * App.jsx — Redesigned to exactly match reference image
 * - Fixed topbar at very top
 * - CSS grid background across entire page
 * - Hero centered below topbar with generous spacing
 * - Stats in DM Mono large font
 * - Sample cards with tinted REAL/FAKE sections + Analyse button
 */

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { healthCheck, predictVideo } from './api'
import { UploadZone } from './components/UploadZone'
import { ResultCard } from './components/ResultCard'
import { FrameChart } from './components/FrameChart'
import { HeatmapGrid } from './components/HeatmapGrid'
import { HealthPill, ProgressBanner } from './components/StatusBar'
import SampleBar from './components/SampleBar'

const ANALYSIS_MSGS = [
  'Extracting 20 frames…',
  'Running EfficientNet-B0 inference…',
  'Generating Grad-CAM heatmaps…',
  'Computing final verdict…',
  'Almost done…',
]

export default function App() {
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [phase, setPhase] = useState('idle')
  const [uploadPct, setUploadPct] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

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

  const handleFile = useCallback(async (file) => {
    setResult(null); setErrorMsg(''); setUploadPct(0); setMsgIdx(0); setPhase('uploading')
    try {
      const data = await predictVideo(file, (pct) => {
        setUploadPct(pct)
        if (pct >= 100) setPhase('analysing')
      })
      setResult(data); setPhase('done')
    } catch (err) {
      setErrorMsg(err?.message || 'Server error'); setPhase('error')
    }
  }, [])

  const reset = () => { setPhase('idle'); setResult(null); setUploadPct(0); setErrorMsg('') }
  const loading = phase === 'uploading' || phase === 'analysing'

  return (
    <div className="dg-app">

      {/* ═══ TOPBAR — always visible at top ═══ */}
      <header className="dg-topbar">
        <div className="dg-brand">
          <div className="dg-logo">
            <div className="dg-logo-ring" />
          </div>
          <span className="dg-brand-name">DeepGuard</span>
          <span className="dg-model-pill">EfficientNet-B0</span>
        </div>
        <HealthPill health={health} loading={healthLoading} />
      </header>

      {/* ═══ PAGE BODY ═══ */}
      <div className="dg-body">

        {/* ── HERO ── */}
        {phase === 'idle' && (
          <section className="dg-hero">
            <div className="dg-forensic-tag">
              <span className="dg-tag-dash" />
              <span className="dg-tag-text">FORENSIC AI DETECTION</span>
              <span className="dg-tag-dash" />
            </div>

            <h1 className="dg-h1">
              Is this video <em className="dg-real-word">real</em>?
            </h1>

            <p className="dg-hero-sub">
              Upload any video. Our model analyses 20 frames with Grad-CAM
              heatmaps to pinpoint exactly where manipulation occurred.
            </p>

            {/* <div className="dg-stats">
              {[
                { num: '92.7%', lbl: 'ACCURACY' },
                { num: '0.983', lbl: 'AUC-ROC'  },
                { num:  '~6s',  lbl: 'PER VIDEO' },
              ].map(({ num, lbl }) => (
                <div className="dg-stat" key={lbl}>
                  <span className="dg-stat-num">{num}</span>
                  <span className="dg-stat-lbl">{lbl}</span>
                </div>
              ))}
            </div> */}
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

          {phase === 'idle' && (
            <div className="dg-upload-wrap">
              <UploadZone onFile={handleFile} />
              <p className="dg-privacy">
                Your video is processed locally and never stored permanently
              </p>
            </div>
          )}

          {phase === 'done' && (
            <button className="dg-reset" onClick={reset}>
              <RefreshCw size={14} /> Analyse another video
            </button>
          )}

          {loading && (
            <ProgressBanner uploadPct={uploadPct} message={ANALYSIS_MSGS[msgIdx]} />
          )}

          {phase === 'error' && (
            <div className="dg-error">
              <AlertTriangle size={18} />
              <div>
                <div className="dg-err-title">Analysis failed</div>
                <div className="dg-err-msg">{errorMsg}</div>
              </div>
            </div>
          )}

          {phase === 'done' && result && (
            <div className="dg-results">
              <ResultCard result={result} />
              <FrameChart frames={result.frames} threshold={result.threshold_used ?? 0.5} />
              <HeatmapGrid frames={result.frames} />
            </div>
          )}

          {/* ── HOW IT WORKS ── */}
          {phase === 'idle' && (
            <section className="dg-how">
              <p className="dg-how-lbl">HOW IT WORKS</p>
              <div className="dg-how-grid">
                {[
                  { n: '01', name: 'Extract',  desc: '20 evenly-spaced frames from your video' },
                  { n: '02', name: 'Detect',   desc: 'MTCNN isolates the face region precisely' },
                  { n: '03', name: 'Analyse',  desc: 'EfficientNet-B0 scores each frame'        },
                  { n: '04', name: 'Explain',  desc: 'Grad-CAM highlights suspicious regions'   },
                ].map(({ n, name, desc }) => (
                  <div className="dg-how-card" key={n}>
                    <div className="dg-how-n">{n}</div>
                    <div className="dg-how-name">{name}</div>
                    <div className="dg-how-desc">{desc}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="dg-footer">
        Trained on FaceForensics++ C23 · EfficientNet-B0 · Grad-CAM explainability
      </footer>

      {/* ═══ ALL STYLES ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── APP SHELL ── */
        .dg-app {
          min-height: 100vh;
          background-color: #0A0C10;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          color: #E5E7EB;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── TOPBAR ── */
        .dg-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,12,16,0.92);
          backdrop-filter: blur(8px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .dg-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dg-logo {
          width: 34px; height: 34px;
          border-radius: 9px;
          border: 1.5px solid #22c55e;
          background: rgba(34,197,94,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dg-logo-ring {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid #22c55e;
          opacity: 0.8;
        }

        .dg-brand-name {
          font-size: 16px;
          font-weight: 700;
          color: #F0EDE6;
          letter-spacing: 0.3px;
        }

        .dg-model-pill {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          color: #22c55e;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 6px;
          padding: 3px 10px;
          letter-spacing: 0.2px;
        }

        /* ── PAGE BODY ── */
        .dg-body {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* ── HERO ── */
        .dg-hero {
          text-align: center;
          padding: 80px 24px 48px;
          max-width: 760px;
          margin: 0 auto;
          width: 100%;
        }

        .dg-forensic-tag {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 36px;
        }
        .dg-tag-dash {
          display: block;
          width: 36px; height: 1px;
          background: #22c55e;
          opacity: 0.7;
        }
        .dg-tag-text {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 3px;
          color: #22c55e;
          font-weight: 500;
        }

        .dg-h1 {
          font-size: clamp(52px, 9vw, 80px);
          font-weight: 700;
          color: #F0EDE6;
          line-height: 1.05;
          letter-spacing: -2px;
          margin-bottom: 24px;
          font-style: normal;
        }
        .dg-real-word {
          color: #2EF2C4;
          font-style: italic;
        }

        .dg-hero-sub {
          font-size: 17px;
          color: #6B7280;
          line-height: 1.75;
          max-width: 500px;
          margin: 0 auto 52px;
        }

        .dg-stats {
          display: flex;
          justify-content: center;
          gap: 72px;
        }
        .dg-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .dg-stat-num {
          font-family: 'DM Mono', monospace;
          font-size: 36px;
          font-weight: 500;
          color: #F0EDE6;
          letter-spacing: -1px;
          line-height: 1;
        }
        .dg-stat-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: #4B5563;
          text-transform: uppercase;
        }

        /* ── SAMPLES WRAP ── */
        .dg-samples-wrap {
          display: flex;
          justify-content: center;
          padding: 48px 24px 0;
        }

        /* ── MAIN ── */
        .dg-main {
          max-width: 960px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 24px;
        }

        /* ── UPLOAD WRAP ── */
        .dg-upload-wrap {
          max-width: 560px;
          margin: 0 auto 20px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          background: rgba(255,255,255,0.015);
          overflow: hidden;
        }
        .dg-privacy {
          text-align: center;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #374151;
          padding: 11px;
          border-top: 1px solid rgba(255,255,255,0.04);
          letter-spacing: 0.2px;
        }

        /* Override UploadZone internal styles */
        .dg-upload-wrap .upload-wrapper { margin-bottom: 0 !important; }
        .dg-upload-wrap .upload-zone {
          border: none !important;
          background: transparent !important;
          border-radius: 0 !important;
          min-height: 200px !important;
          box-shadow: none !important;
        }
        .dg-upload-wrap .upload-zone:hover { background: rgba(255,255,255,0.02) !important; }

        /* ── RESET ── */
        .dg-reset {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 auto 24px;
          padding: 10px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #9CA3AF;
          cursor: pointer;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
        }
        .dg-reset:hover { background: rgba(255,255,255,0.08); }

        /* ── ERROR ── */
        .dg-error {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 16px 20px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          color: #EF4444;
          margin-bottom: 24px;
        }
        .dg-err-title { font-weight: 600; font-size: 14px; }
        .dg-err-msg   { font-size: 12px; color: #9CA3AF; margin-top: 3px; }

        /* ── RESULTS ── */
        .dg-results { margin-top: 8px; }

        /* ── HOW IT WORKS ── */
        .dg-how { margin-top: 80px; text-align: center; }
        .dg-how-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: #22c55e;
          margin-bottom: 28px;
          text-transform: uppercase;
        }
        .dg-how-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 600px) {
          .dg-how-grid { grid-template-columns: repeat(2, 1fr); }
          .dg-stats { gap: 36px; }
          .dg-stat-num { font-size: 28px; }
        }
        .dg-how-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 18px 14px;
          text-align: center;
        }
        .dg-how-n {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #22c55e;
          margin-bottom: 8px;
        }
        .dg-how-name {
          font-size: 15px;
          font-weight: 600;
          color: #E5E7EB;
          margin-bottom: 6px;
        }
        .dg-how-desc { font-size: 12px; color: #4B5563; line-height: 1.5; }

        /* ── FOOTER ── */
        .dg-footer {
          text-align: center;
          padding: 28px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #374151;
          letter-spacing: 0.3px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
      `}</style>
    </div>
  )
}