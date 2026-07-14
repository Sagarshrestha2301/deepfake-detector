/**
 * FrameChart.jsx
 * Recharts bar chart — P(fake) per frame.
 * Bars coloured red if prediction=FAKE, green if REAL.
 * Reference line at threshold (0.5).
 *
 * Props:
 *   frames: FrameResult[]   (see api.js typedef)
 *   threshold: number       default 0.5
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Cell, ResponsiveContainer
} from 'recharts'

const FAKE_COLOR = '#ef4444'
const REAL_COLOR = '#22c55e'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const isFake = d.prediction === 'FAKE'
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">Frame {d.frame_index + 1}</p>
      <p className="chart-tooltip__row">
        <span>P(fake)</span>
        <span
          style={{ color: isFake ? FAKE_COLOR : REAL_COLOR }}
          className="font-mono"
        >
          {(d.fake_prob * 100).toFixed(1)}%
        </span>
      </p>
      <p className="chart-tooltip__row">
        <span>Prediction</span>
        <span style={{ color: isFake ? FAKE_COLOR : REAL_COLOR }}>
          {d.prediction}
        </span>
      </p>
    </div>
  )
}

export function FrameChart({ frames, threshold = 0.5 }) {
  const data = frames.map((f) => ({ ...f }))

  return (
    <div className="frame-chart animate-fade-up">
      <h3 className="section-title">Per-Frame Fake Probability</h3>
      <p className="section-sub">
        Each bar = one of {frames.length} evenly-spaced frames. Red bars exceed
        the decision threshold ({(threshold * 100).toFixed(0)}%).
      </p>

      <div className="frame-chart__inner">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="frame_index"
              tick={{ fill: '#4a5568', fontSize: 11, fontFamily: 'Space Mono' }}
              tickFormatter={(v) => `F${v + 1}`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: '#4a5568', fontSize: 11, fontFamily: 'Space Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <ReferenceLine
              y={threshold}
              stroke="rgba(245,158,11,0.7)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: 'threshold',
                position: 'right',
                fill: '#f59e0b',
                fontSize: 11,
                fontFamily: 'Space Mono'
              }}
            />
            <Bar dataKey="fake_prob" radius={[3, 3, 0, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.prediction === 'FAKE' ? FAKE_COLOR : REAL_COLOR}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="chart-legend">
        <span className="chart-legend__item chart-legend__item--fake">FAKE frame</span>
        <span className="chart-legend__item chart-legend__item--real">REAL frame</span>
        <span className="chart-legend__item chart-legend__item--thresh">Decision threshold</span>
      </div>
    </div>
  )
}

/* ---- Styles --------------------------------------------------- */
const style = document.createElement('style')
style.textContent = `
  .frame-chart {
    background: var(--bg-card);
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-lg);
    padding: 24px 28px 20px;
    margin-bottom: 32px;
  }
  .frame-chart__inner { margin-top: 20px; }

  .chart-tooltip {
    background: #1a2035;
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-size: 13px;
  }
  .chart-tooltip__title {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .chart-tooltip__row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    color: var(--text-secondary);
  }

  .chart-legend {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    flex-wrap: wrap;
  }
  .chart-legend__item {
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-secondary);
  }
  .chart-legend__item::before {
    content: '';
    width: 10px; height: 10px;
    border-radius: 2px;
    display: inline-block;
  }
  .chart-legend__item--fake::before  { background: #ef4444; }
  .chart-legend__item--real::before  { background: #22c55e; }
  .chart-legend__item--thresh::before{ background: #f59e0b; }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: var(--font-mono);
  }
  .section-sub {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
`
document.head.appendChild(style)