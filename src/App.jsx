/**
 * App.jsx — App shell for the deepfake detector
 * Flow: idle → preview → uploading → analysing → done / error
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { healthCheck, predictVideo } from './api';
import { UploadZone } from './components/UploadZone';
import { FrameChart } from './components/FrameChart';
import { HeatmapGrid } from './components/HeatmapGrid';
import { HealthPill, ProgressBanner } from './components/StatusBar';
import VerdictBanner from './components/VerdictBanner';
import VideoPreview from './components/VideoPreview';
import SampleBar from './components/SampleBar';

// ─── Constants ────────────────────────────────────────────────────────────

const ANALYSIS_MSGS = [
  'Extracting frames…',
  'Running EfficientNet-B0 inference…',
  'Generating Grad-CAM heatmaps…',
  'Computing final verdict…',
  'Almost done…',
];

const MAX_FRAMES = 60;
const DEFAULT_FRAMES = 30;

// ─── Error Boundary (for SampleBar) ──────────────────────────────────────

class SampleBarErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('SampleBar error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dg-sample-error">
          <AlertTriangle size={16} />
          <span>Sample videos unavailable — please upload your own.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────

export default function App() {
  // API health
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // UI phases: idle | preview | uploading | analysing | done | error
  const [phase, setPhase] = useState('idle');
  const [pendingFile, setPendingFile] = useState(null);
  const [frameCount, setFrameCount] = useState(DEFAULT_FRAMES);

  // Progress & results
  const [uploadPct, setUploadPct] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Health check ──
  useEffect(() => {
    healthCheck()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, []);

  // ── Rotate analysis messages ──
  useEffect(() => {
    if (phase !== 'analysing') return;
    const interval = setInterval(
      () => setMsgIdx((i) => (i + 1) % ANALYSIS_MSGS.length),
      2000
    );
    return () => clearInterval(interval);
  }, [phase]);

  // ── Handlers ──
  const handleFile = useCallback((file) => {
    setPendingFile(file);
    setPhase('preview');
  }, []);

  const handleAnalyse = useCallback(async () => {
    const file = pendingFile;
    if (!file) return;

    setResult(null);
    setErrorMsg('');
    setUploadPct(0);
    setMsgIdx(0);
    setPhase('uploading');

    try {
      const data = await predictVideo(file, frameCount, (pct) => {
        setUploadPct(pct);
        if (pct >= 100) setPhase('analysing');
      });
      setResult(data);
      setPhase('done');
    } catch (err) {
      setErrorMsg(err?.message || 'Server error');
      setPhase('error');
    }
  }, [pendingFile, frameCount]);

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setPendingFile(null);
    setFrameCount(DEFAULT_FRAMES);
    setUploadPct(0);
    setErrorMsg('');
  };

  const isLoading = phase === 'uploading' || phase === 'analysing';

  // ── Render ──
  return (
    <div className="dg-app">
      {/* Floating health pill */}
      <div className="dg-status-anchor">
        <HealthPill health={health} loading={healthLoading} />
      </div>

      {/* Hero section (idle & preview) */}
      {(phase === 'idle' || phase === 'preview') && (
        <section className="dg-hero" data-compact={phase === 'preview'}>
          <p className="dg-eyebrow">Deepfake Detection</p>
          <h1 className="dg-h1">
            Is this video
            <br />
            <em className="dg-h1-em">real?</em>
          </h1>
          {phase === 'idle' && (
            <p className="dg-sub">
              Upload any video. Our model analyses up to {MAX_FRAMES} frames with
              <br />
              Grad-CAM heatmaps to reveal manipulation.
            </p>
          )}
        </section>
      )}

      {/* Sample videos — wrapped in an error boundary */}
      {phase === 'idle' && (
        <div className="dg-samples-wrap">
          <SampleBarErrorBoundary>
            <SampleBar onUpload={handleFile} />
          </SampleBarErrorBoundary>
        </div>
      )}

      <main className="dg-main">
        {/* Upload zone – idle only */}
        {phase === 'idle' && (
          <div className="dg-upload-wrap">
            <UploadZone onFile={handleFile} />
            <p className="dg-privacy">Processed locally · never stored permanently</p>
          </div>
        )}

        {/* Video preview */}
        {phase === 'preview' && pendingFile && (
          <VideoPreview
            key={`${pendingFile.name}-${pendingFile.lastModified}`}
            file={pendingFile}
            frameCount={frameCount}
            onFrameCountChange={setFrameCount}
            onAnalyse={handleAnalyse}
            onCancel={reset}
          />
        )}

        {/* Reset button (done phase) */}
        {phase === 'done' && (
          <button className="dg-reset" onClick={reset}>
            <RefreshCw size={13} />
            Analyse another video
          </button>
        )}

        {/* Progress banner */}
        {isLoading && (
          <div className="dg-loading-stage">
            <ProgressBanner uploadPct={uploadPct} message={ANALYSIS_MSGS[msgIdx]} />
          </div>
        )}

        {/* Error display */}
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
            <VerdictBanner result={result} />
            <FrameChart frames={result.frames} threshold={result.threshold_used ?? 0.5} />
            <HeatmapGrid frames={result.frames} />
          </div>
        )}

        {/* How it works – idle only */}
        {phase === 'idle' && (
          <section className="dg-how">
            <p className="dg-how-label">How it works</p>
            <div className="dg-how-grid">
              {[
                { name: 'Extract', desc: 'Evenly-spaced frames sampled from your video' },
                { name: 'Detect', desc: 'MTCNN isolates the face region with precision' },
                { name: 'Analyse', desc: 'EfficientNet-B0 scores each frame for artifacting' },
                { name: 'Explain', desc: 'Grad-CAM highlights the suspicious regions' },
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

      <footer className="dg-footer">
        Trained on FaceForensics++ C23 · EfficientNet-B0 · Grad-CAM
      </footer>

      {/* ══ STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,200;0,300;0,400;0,500;1,200;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background: #ffffff; /* or match .dg-app */
}
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

        .dg-loading-stage {
          min-height: min(42vh, 420px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 0 12px;
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