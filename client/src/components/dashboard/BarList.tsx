import { Link } from 'react-router-dom'

export interface BarListRow {
  key: string
  label: string
  value: number
  /** Optional link so a row can double as a filter. */
  to?: string
}

interface BarListProps {
  rows: BarListRow[]
  emptyText: string
  /** Shows each row's share of the total beside its count. */
  showShare?: boolean
}

/**
 * Ranked horizontal bars. One hue — the bar length carries the magnitude,
 * and every value is directly labelled, so no legend is needed.
 */
export default function BarList({ rows, emptyText, showShare = true }: BarListProps) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  const total = rows.reduce((sum, row) => sum + row.value, 0)

  if (total === 0) return <p className="py-6 text-center text-sm text-slate-400">{emptyText}</p>

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const share = Math.round((row.value / total) * 100)
        const body = (
          <>
            <span className="truncate text-xs text-slate-600 group-hover:text-slate-900">
              {row.label}
            </span>
            <span className="h-5 rounded-sm bg-slate-100">
              <span
                className="block h-5 rounded-r-[4px] bg-[#2a78d6]"
                style={{ width: `${Math.max((row.value / max) * 100, row.value > 0 ? 2 : 0)}%` }}
              />
            </span>
            <span className="text-right text-xs tabular-nums text-slate-700">
              <span className="font-medium text-slate-900">{row.value}</span>
              {showShare && <span className="ml-1 text-slate-400">{share}%</span>}
            </span>
          </>
        )

        const className = 'group grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3'

        return (
          <li key={row.key}>
            {row.to ? (
              <Link to={row.to} className={className}>
                {body}
              </Link>
            ) : (
              <div className={className}>{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
