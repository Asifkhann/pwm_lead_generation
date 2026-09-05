import { useState, type PointerEvent } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'

export interface TrendChartPoint {
  /** "2026-09-05" for daily points, "2026-09" for monthly ones. */
  date: string
  value: number
}

const HEIGHT = 170
const PADDING = { top: 12, right: 8, bottom: 24, left: 28 }
const SERIES_COLOR = '#2a78d6'

interface TrendChartProps {
  points: TrendChartPoint[]
  /** Names the single series, so no legend is needed. */
  label: string
  granularity?: 'day' | 'month'
}

function shortDate(value: string, granularity: 'day' | 'month'): string {
  if (granularity === 'month') {
    const [year, month] = value.split('-').map(Number)
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    })
  }
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Single-series trend over the last two weeks, with a snapping crosshair. */
export default function TrendChart({ points, label, granularity = 'day' }: TrendChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 10)
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const maxValue = Math.max(...points.map((point) => point.value), 1)

  const xFor = (index: number) =>
    PADDING.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
  const yFor = (value: number) => PADDING.top + plotHeight - (value / maxValue) * plotHeight

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point.value)}`)
    .join(' ')
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${PADDING.top + plotHeight} L ${xFor(0)} ${
    PADDING.top + plotHeight
  } Z`

  const handlePointer = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const ratio = (x - PADDING.left) / plotWidth
    const index = Math.round(ratio * (points.length - 1))
    setActiveIndex(Math.min(Math.max(index, 0), points.length - 1))
  }

  const active = activeIndex === null ? null : points[activeIndex]
  const total = points.reduce((sum, point) => sum + point.value, 0)

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${label} over the last ${points.length} days, ${total} in total`}
          onPointerMove={handlePointer}
          onPointerLeave={() => setActiveIndex(null)}
          className="touch-none"
        >
          {/* Recessive gridlines and value axis. */}
          {[0, 0.5, 1].map((fraction) => {
            const y = PADDING.top + plotHeight * (1 - fraction)
            return (
              <g key={fraction}>
                <line
                  x1={PADDING.left}
                  x2={PADDING.left + plotWidth}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text x={0} y={y + 4} fontSize={10} fill="#94a3b8">
                  {Math.round(maxValue * fraction)}
                </text>
              </g>
            )
          })}

          <path d={areaPath} fill={SERIES_COLOR} opacity={0.1} />
          <path
            d={linePath}
            fill="none"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {activeIndex !== null && active && (
            <g>
              <line
                x1={xFor(activeIndex)}
                x2={xFor(activeIndex)}
                y1={PADDING.top}
                y2={PADDING.top + plotHeight}
                stroke="#94a3b8"
                strokeWidth={1}
              />
              <circle
                cx={xFor(activeIndex)}
                cy={yFor(active.value)}
                r={4.5}
                fill={SERIES_COLOR}
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          )}

          {/* First and last day only — a label per point would be noise. */}
          <text x={PADDING.left} y={HEIGHT - 6} fontSize={10} fill="#94a3b8">
            {shortDate(points[0].date, granularity)}
          </text>
          <text
            x={PADDING.left + plotWidth}
            y={HEIGHT - 6}
            fontSize={10}
            fill="#94a3b8"
            textAnchor="end"
          >
            {shortDate(points[points.length - 1].date, granularity)}
          </text>
        </svg>
      )}

      {active && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: Math.min(Math.max(xFor(activeIndex ?? 0) - 50, 0), Math.max(width - 110, 0)),
          }}
        >
          <p className="font-semibold tabular-nums text-slate-900">
            {active.value} {label.toLowerCase()}
          </p>
          <p className="text-slate-500">{shortDate(active.date, granularity)}</p>
        </div>
      )}

      {/*
        Values stay reachable without a pointer. The wrapper carries sr-only:
        a table ignores the 1px height and overflow:hidden that sr-only sets,
        so hiding the table directly leaves its full height in the page.
      */}
      <div className="sr-only">
        <table>
          <caption>{label} per day</caption>
          <tbody>
            {points.map((point) => (
              <tr key={point.date}>
                <th scope="row">{shortDate(point.date, granularity)}</th>
                <td>{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
