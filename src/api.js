/**
 * api.js
 * Thin Axios wrapper around the FastAPI backend.
 * Routes directly to ngrok tunnel URL.
 */

import axios from 'axios'

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
// const BASE_URL = 'https://unstable-mothproof-chafe.ngrok-free.dev'
const BASE_URL = 'https://itsmesagar-deepfake-detection-api.hf.space'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 180_000,
  headers: {
    // Keep this empty unless you need a proxy-specific header.
  },
})

/**
 * Health check.
 * @returns {Promise<{status:string, device:string, cuda:boolean, checkpoint:string}>}
 */
export async function healthCheck() {
  const { data } = await client.get('/health')
  return data
}

/**
 * Upload a video file and run deepfake detection.
 * @param {File} file           — MP4 / AVI / MOV / WEBM
 * @param {number} [numFrames]  — desired frame count (20-60); omit to let the
 *                                 backend pick via duration-based sampling
 * @param {Function} onProgress — (pct: 0-100) upload progress callback
 * @returns {Promise<PredictResponse>}
 */
export async function predictVideo(file, numFrames, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  if (numFrames != null) {
    formData.append('num_frames', String(numFrames))
  }

  const { data } = await client.post('/predict/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      // 'ngrok-skip-browser-warning': 'true',
    },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    },
  })

  return data
}

/**
 * @typedef {Object} PredictResponse
 * @property {string}  request_id
 * @property {'FAKE'|'REAL'} verdict
 * @property {number}  confidence        — mean fake_prob across all frames
 * @property {number}  fake_frame_ratio  — 0-1
 * @property {number}  total_frames      — 20-60, depends on requested num_frames / video length
 * @property {number}  fake_frames
 * @property {number}  processing_time_s
 * @property {number}  threshold_used    — default 0.5
 * @property {FrameResult[]} frames
 *
 * @typedef {Object} FrameResult
 * @property {number}          frame_index
 * @property {number}          fake_prob   — 0-1
 * @property {'FAKE'|'REAL'}   prediction
 * @property {string}          heatmap_b64 — base64 PNG
 * @property {string}          heatmap_path
 */