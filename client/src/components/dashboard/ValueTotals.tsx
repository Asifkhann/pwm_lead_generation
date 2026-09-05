import { formatMoney } from '../../utils/format'

export interface CurrencyTotal {
  currency: string
  total: number
  count: number
}

interface ValueTotalsProps {
  label: string
  totals: CurrencyTotal[]
  emptyText: string
  tone?: 'default' | 'good'
}

/**
 * One figure per currency. Adding GBP to PKR would be a made-up number, so
 * they are never combined into a single total.
 */
export default function ValueTotals({ label, totals, emptyText, tone = 'default' }: ValueTotalsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      {totals.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {totals.map((row) => (
            <li key={row.currency} className="flex items-baseline justify-between gap-3">
              <span
                className={`text-xl font-semibold ${
                  tone === 'good' ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {formatMoney(row.total, row.currency)}
              </span>
              <span className="text-xs text-slate-500">
                {row.count} {row.count === 1 ? 'lead' : 'leads'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
