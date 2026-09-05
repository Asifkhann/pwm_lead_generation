import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Tone = 'default' | 'critical' | 'good'

interface StatTileProps {
  label: string
  value: number | string
  hint?: string
  tone?: Tone
  to?: string
  icon?: ReactNode
  /** "plain" drops the card chrome, for tiles that sit inside another card. */
  variant?: 'card' | 'plain'
}

const toneClasses: Record<Tone, string> = {
  default: 'border-slate-200',
  critical: 'border-rose-200 bg-rose-50/60',
  good: 'border-emerald-200 bg-emerald-50/50',
}

const valueClasses: Record<Tone, string> = {
  default: 'text-slate-900',
  critical: 'text-rose-700',
  good: 'text-emerald-700',
}

/** A headline number. Deliberately not a one-bar chart. */
export default function StatTile({
  label,
  value,
  hint,
  tone = 'default',
  to,
  icon,
  variant = 'card',
}: StatTileProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${valueClasses[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  )

  const className =
    variant === 'plain'
      ? 'block'
      : `block rounded-xl border bg-white p-4 shadow-sm ${toneClasses[tone]} ${
          to ? 'transition-colors hover:border-slate-300' : ''
        }`

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
