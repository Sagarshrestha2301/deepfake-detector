/**
 * VideoPreview.jsx
 * Local video player with transport controls and frame-count slider.
 */

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Scan } from 'lucide-react'

const MIN_FRAMES = 20
const MAX_FRAMES = 60

export default function VideoPreview({
  file,
  frameCount,
  onFrameCountChange,
  onAnalyse,
  onCancel,
}) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [objectUrl] = useState(() => (file ? URL.createObjectURL(file) : ''))

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const progressPercent = duration ? (current / duration) * 100 : 0

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return

    if (playing) {
      video.pause()
      return
    }

    try {
      await video.play()
    } catch {
      setPlaying(false)
    }
  }

  const handleSeek = (event) => {
    const video = videoRef.current
    if (!video || !duration) return

    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    video.currentTime = ratio * duration
  }

  return (
    <div className="dg-preview">
      <div className="dg-preview-video-wrap">
        <video
          ref={videoRef}
          src={objectUrl || undefined}
          className="dg-preview-video"
          controls
          onTimeUpdate={(event) => setCurrent(event.target.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.target.duration)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          playsInline
        />
      </div>

      <div className="dg-preview-controls">
        <button
          className="dg-play-btn"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          type="button"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          className="dg-seek-track"
          onClick={handleSeek}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          type="button"
        >
          <div className="dg-seek-fill" style={{ width: `${progressPercent}%` }} />
          <div className="dg-seek-thumb" style={{ left: `${progressPercent}%` }} />
        </button>

        <span className="dg-time">
          {formatTime(current)} / {formatTime(duration)}
        </span>
      </div>

      <div className="dg-preview-meta">
        <span className="dg-preview-name">{file.name}</span>
        <span className="dg-preview-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
      </div>

      <div className="dg-frame-slider">
        <div className="dg-frame-slider__row">
          <span className="dg-frame-slider__label">Frames to analyse</span>
          <span className="dg-frame-slider__value">{frameCount}</span>
        </div>
        <input
          type="range"
          min={MIN_FRAMES}
          max={MAX_FRAMES}
          step={1}
          value={frameCount}
          onChange={(event) => onFrameCountChange(Number(event.target.value))}
          className="dg-frame-slider__input"
          aria-label="Number of frames to analyse"
        />
        <div className="dg-frame-slider__ticks">
          <span>{MIN_FRAMES} · faster</span>
          <span>{MAX_FRAMES} · more thorough</span>
        </div>
      </div>

      <div className="dg-preview-actions">
        <button className="dg-btn-ghost" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="dg-btn-analyse" onClick={onAnalyse} type="button">
          <Scan size={14} />
          Analyse video
        </button>
      </div>

      <style>{`
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 0.5px solid rgba(0,0,0,0.12);
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1d1d1f;
          transition: background 0.15s;
        }
        .dg-play-btn:hover {
          background: rgba(0,0,0,0.04);
        }

        .dg-seek-track {
          flex: 1;
          height: 3px;
          background: rgba(0,0,0,0.08);
          border-radius: 2px;
          position: relative;
          cursor: pointer;
          border: none;
          padding: 0;
        }
        .dg-seek-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: #06b6d4;
          border-radius: 2px;
          transition: width 0.1s linear;
        }
        .dg-seek-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 11px;
          height: 11px;
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

        .dg-frame-slider {
          padding: 0 16px 14px;
        }
        .dg-frame-slider__row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .dg-frame-slider__label {
          font-size: 12px;
          color: #6e6e73;
          letter-spacing: 0.01em;
        }
        .dg-frame-slider__value {
          font-size: 13px;
          font-weight: 600;
          color: #1d1d1f;
          font-variant-numeric: tabular-nums;
        }
        .dg-frame-slider__input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          display: block;
          width: 100%;
          height: 24px;
          background: transparent;
          outline: none;
          cursor: pointer;
          margin: 0;
        }
        .dg-frame-slider__input::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(0,0,0,0.08);
        }
        .dg-frame-slider__input::-moz-range-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(0,0,0,0.08);
        }
        .dg-frame-slider__input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #06b6d4;
          box-shadow: 0 0 0 3px #fff, 0 1px 3px rgba(0,0,0,0.25);
          cursor: pointer;
          margin-top: -6.5px;
        }
        .dg-frame-slider__input::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border: none;
          border-radius: 50%;
          background: #06b6d4;
          box-shadow: 0 0 0 3px #fff, 0 1px 3px rgba(0,0,0,0.25);
          cursor: pointer;
        }
        .dg-frame-slider__ticks {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
        }
        .dg-frame-slider__ticks span {
          font-size: 10.5px;
          color: #aeaeb2;
          letter-spacing: 0.01em;
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
        .dg-btn-ghost:hover {
          background: rgba(0,0,0,0.04);
          color: #1d1d1f;
        }

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
        .dg-btn-analyse:hover {
          background: #3a3a3c;
        }
        .dg-btn-analyse:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  )
}
