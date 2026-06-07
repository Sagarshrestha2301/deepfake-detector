/**
 * UploadZone.jsx — Redesigned to match reference image
 * Centered icon, "Drop your video here", format chips, green button
 */

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, Film, AlertCircle } from 'lucide-react'

const ACCEPTED = ['.mp4', '.avi', '.mov', '.webm']
const MAX_MB   = 500

function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  if (!ACCEPTED.includes(ext)) {
    return `Unsupported format "${ext}". Accepted: ${ACCEPTED.join(', ')}`
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(0)} MB). Max ${MAX_MB} MB.`
  }
  return null
}

export function UploadZone({ onFile, disabled }) {
  const inputRef  = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState(null)
  const [preview,  setPreview]  = useState(null)

  const handleFile = useCallback((file) => {
    const err = validateFile(file)
    if (err) { setError(err); setPreview(null); return }
    setError(null)
    setPreview({ name: file.name, sizeMB: (file.size / 1024 / 1024).toFixed(1) })
    onFile(file)
  }, [onFile])

  const onDragOver  = (e) => { e.preventDefault(); if (!disabled) setDragging(true)  }
  const onDragLeave = ()  => setDragging(false)
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }
  const onInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div
      className={`uz-root${dragging ? ' uz-dragging' : ''}${disabled ? ' uz-disabled' : ''}${error ? ' uz-error' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label="Upload video file"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        style={{ display: 'none' }}
        onChange={onInputChange}
        disabled={disabled}
      />

      <div className="uz-body">
        {/* Icon box */}
        <div className={`uz-icon-box${preview ? ' uz-icon-box--file' : ''}`}>
          {preview
            ? <Film size={22} />
            : <UploadCloud size={22} />
          }
        </div>

        {preview ? (
          <>
            <p className="uz-title" style={{ color: '#3b82f6' }}>{preview.name}</p>
            <p className="uz-sub">{preview.sizeMB} MB · Drop or click to change</p>
          </>
        ) : (
          <>
            <p className="uz-title">
              {dragging ? 'Drop video here' : 'Drop your video here'}
            </p>
            <p className="uz-sub">MP4 · AVI · MOV · MKV · WebM · max {MAX_MB} MB</p>
          </>
        )}

        <button
          className="uz-btn"
          onClick={(e) => { e.stopPropagation(); !disabled && inputRef.current?.click() }}
          disabled={disabled}
          type="button"
        >
          {preview ? 'Change file' : 'Choose file'}
        </button>
      </div>

      {error && (
        <div className="uz-err-msg">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      <style>{`
        .uz-root {
          padding: 40px 24px 28px;
          transition: background 0.2s;
          cursor: default;
          position: relative;
        }
        .uz-dragging {
          background: rgba(34,197,94,0.04);
        }
        .uz-disabled { opacity: 0.5; pointer-events: none; }

        .uz-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
        }

        .uz-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9CA3AF;
          margin-bottom: 6px;
        }
        .uz-icon-box--file { color: #3b82f6; border-color: rgba(59,130,246,0.3); }

        .uz-title {
          font-size: 16px;
          font-weight: 600;
          color: #E5E7EB;
          margin: 0;
        }

        .uz-sub {
          font-size: 12px;
          color: #4B5563;
          margin: 0;
          letter-spacing: 0.2px;
        }

        .uz-btn {
          margin-top: 14px;
          padding: 10px 36px;
          border-radius: 8px;
          border: none;
          background: #22c55e;
          color: #030712;
          font-size: 14px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.2px;
          transition: background 0.18s, transform 0.12s;
        }
        .uz-btn:hover  { background: #16a34a; }
        .uz-btn:active { transform: scale(0.97); }
        .uz-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .uz-err-msg {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
          margin-top: 12px;
          font-size: 12px;
          color: #ef4444;
          padding: 8px 16px;
          background: rgba(239,68,68,0.08);
          border-top: 1px solid rgba(239,68,68,0.15);
        }
      `}</style>
    </div>
  )
}